#!/usr/bin/env python3

# Standard library imports

# Remote library imports
from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime

# Local imports
from config import app, db, api
from models import User, Reading, Medication, Meal, reading_meals

# ---------------- Basic route ----------------

@app.route('/')
def index():
    return '<h1>Diabetes Management API</h1>'

# ---------------- Authentication ----------------
class Signup(Resource):
    def post(self):
        data = request.get_json()
        
        # Basic validation
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return {'error': 'Name, email, and password are required'}, 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return {'error': 'User with this email already exists'}, 400
        
        try:
            # Create new user
            user = User(
                name=data['name'],
                email=data['email']
            )
            user.password_hash = data['password']  # This will trigger the setter
            # Optional diabetes_type at signup
            if 'diabetes_type' in data:
                user.diabetes_type = data['diabetes_type']
            
            db.session.add(user)
            db.session.commit()
            
            # Create access token
            access_token = create_access_token(identity=user.id)
            
            return {
                'user': user.to_dict(),
                'access_token': access_token,
                'education': education_for(user.diabetes_type)
            }, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

class Login(Resource):
    def post(self):
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return {'error': 'Email and password are required'}, 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.authenticate(data['password']):
            access_token = create_access_token(identity=user.id)
            return {
                'user': user.to_dict(),
                'access_token': access_token,
                'education': education_for(user.diabetes_type)
            }, 200
        else:
            return {'error': 'Invalid email or password'}, 401

class CheckSession(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user:
            resp = user.to_dict()
            resp['education'] = education_for(user.diabetes_type)
            return resp, 200
        else:
            return {'error': 'User not found'}, 404

# ---------------- Helpers (dates/times/validation) ----------------

def parse_date(date_str):
    # Expecting YYYY-MM-DD
    return datetime.strptime(date_str, '%Y-%m-%d').date()

def parse_time(time_str):
    # Expecting HH:MM
    return datetime.strptime(time_str, '%H:%M').time()

def validate_glucose_value(value):
    try:
        v = float(value)
    except Exception:
        return False
    return 40 <= v <= 500

# ---------------- Diabetes education ----------------
EDU = {
    'type1': [
        'Type 1 diabetes: autoimmune; requires insulin therapy.',
        'Monitor carbs and time insulin with meals.',
        'Carry fast-acting glucose to treat lows.'
    ],
    'type2': [
        'Type 2 diabetes: insulin resistance; lifestyle and meds help.',
        'Focus on weight management, low-GI carbs, regular activity.',
        'Monitor blood sugar trends and medication adherence.'
    ],
    'gestational': [
        'Gestational diabetes: occurs in pregnancy; close monitoring.',
        'Follow meal plan, stay active, and track sugars as advised.'
    ],
    'prediabetes': [
        'Prediabetes: elevated sugars; lifestyle changes are effective.',
        'Aim for 150+ minutes weekly activity and balanced meals.'
    ]
}

def education_for(diabetes_type):
    return EDU.get((diabetes_type or '').lower(), [])

# ---------------- Glucose evaluation ----------------
TIPS_NORMAL = [
    'Maintain balanced meals with non-starchy veggies, lean protein, and healthy fats.',
    'Stay hydrated and keep up light daily activity.',
    'Aim for consistent meal times and portion control.'
]
TIPS_HIGH = [
    'Take a 15–30 minute walk and hydrate with water.',
    'Reduce refined carbohydrates; choose low-GI, high-fiber foods.',
    'Include lean proteins and healthy fats to slow glucose spikes.',
    'Discuss supplements with your doctor (e.g., cinnamon, berberine).'
]

def evaluate_glucose(value, context):
    # Simple rules: pre_meal 80-130 normal, post_meal < 180 normal
    status = 'unknown'
    color = 'gray'
    suggestions = []
    if context == 'pre_meal':
        if 80 <= value <= 130:
            status, color, suggestions = 'normal', 'green', TIPS_NORMAL
        elif value > 130:
            status, color, suggestions = 'high', 'red', TIPS_HIGH
        else:
            status, color, suggestions = 'low', 'yellow', ['Consider a small balanced snack and consult your clinician if frequent.']
    else:  # post_meal or unknown
        if value < 180:
            status, color, suggestions = 'normal', 'green', TIPS_NORMAL
        elif value >= 180:
            status, color, suggestions = 'high', 'red', TIPS_HIGH
    return {'status': status, 'color': color, 'suggestions': suggestions}

# ---------------- Readings CRUD ----------------
class Readings(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        items = Reading.query.filter_by(user_id=user_id).order_by(Reading.date, Reading.time).all()
        return [r.to_dict() for r in items], 200

    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        required = ['value', 'date', 'time']
        if not all(k in data for k in required):
            return {'error': 'value, date (YYYY-MM-DD), and time (HH:MM) are required'}, 400
        if not validate_glucose_value(data['value']):
            return {'error': 'value must be a number between 40 and 500'}, 400
        context = data.get('context')
        if context and context not in ['pre_meal', 'post_meal']:
            return {'error': "context must be 'pre_meal' or 'post_meal'"}, 400
        try:
            reading = Reading(
                value=float(data['value']),
                date=parse_date(data['date']),
                time=parse_time(data['time']),
                notes=data.get('notes'),
                context=context,
                user_id=user_id,
            )
            db.session.add(reading)
            db.session.commit()
            payload = reading.to_dict()
            if context:
                payload['evaluation'] = evaluate_glucose(reading.value, context)
            return payload, 201
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

class ReadingById(Resource):
    @jwt_required()
    def get(self, id):
        user_id = get_jwt_identity()
        reading = Reading.query.filter_by(id=id, user_id=user_id).first()
        if not reading:
            return {'error': 'Reading not found'}, 404
        payload = reading.to_dict()
        if reading.context:
            payload['evaluation'] = evaluate_glucose(reading.value, reading.context)
        return payload, 200

    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        reading = Reading.query.filter_by(id=id, user_id=user_id).first()
        if not reading:
            return {'error': 'Reading not found'}, 404
        data = request.get_json()
        if 'value' in data:
            if not validate_glucose_value(data['value']):
                return {'error': 'value must be a number between 40 and 500'}, 400
            reading.value = float(data['value'])
        if 'date' in data:
            reading.date = parse_date(data['date'])
        if 'time' in data:
            reading.time = parse_time(data['time'])
        if 'notes' in data:
            reading.notes = data['notes']
        if 'context' in data:
            if data['context'] not in ['pre_meal', 'post_meal', None]:
                return {'error': "context must be 'pre_meal' or 'post_meal'"}, 400
            reading.context = data['context']
        try:
            db.session.commit()
            payload = reading.to_dict()
            if reading.context:
                payload['evaluation'] = evaluate_glucose(reading.value, reading.context)
            return payload, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

    @jwt_required()
    def delete(self, id):
        user_id = get_jwt_identity()
        reading = Reading.query.filter_by(id=id, user_id=user_id).first()
        if not reading:
            return {'error': 'Reading not found'}, 404
        try:
            db.session.delete(reading)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

# ---------------- Profile + BMI ----------------
class UserProfile(Resource):
    @jwt_required()
    def patch(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        data = request.get_json()
        if 'name' in data and data['name']:
            user.name = data['name']
        if 'diabetes_type' in data:
            user.diabetes_type = data['diabetes_type'] or None
        if 'height_cm' in data:
            try:
                user.height_cm = float(data['height_cm']) if data['height_cm'] is not None else None
            except Exception:
                return {'error': 'height_cm must be a number'}, 400
        if 'weight_kg' in data:
            try:
                user.weight_kg = float(data['weight_kg']) if data['weight_kg'] is not None else None
            except Exception:
                return {'error': 'weight_kg must be a number'}, 400
        try:
            db.session.commit()
            return user.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

class UserBMI(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        if not user.height_cm or not user.weight_kg:
            return {'error': 'height_cm and weight_kg must be set on profile'}, 400
        height_m = user.height_cm / 100.0
        bmi = user.weight_kg / (height_m ** 2)
        if bmi < 18.5:
            category = 'Underweight'
        elif bmi < 25:
            category = 'Normal'
        elif bmi < 30:
            category = 'Overweight'
        else:
            category = 'Obese'
        return {'bmi': round(bmi, 1), 'category': category}, 200

# Add resources to API
api.add_resource(Signup, '/signup')
api.add_resource(Login, '/login')
api.add_resource(CheckSession, '/check_session')
api.add_resource(Readings, '/readings')
api.add_resource(ReadingById, '/readings/<int:id>')
api.add_resource(UserProfile, '/me')
api.add_resource(UserBMI, '/me/bmi')

# ---------------- Medications (create/read + update status) ----------------
class Medications(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        meds = Medication.query.filter_by(user_id=user_id).order_by(Medication.time).all()
        return [m.to_dict() for m in meds], 200

    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        required = ['name', 'dose', 'time']
        if not all(k in data and data[k] for k in required):
            return {'error': 'name, dose, and time (HH:MM) are required'}, 400
        try:
            med = Medication(
                name=data['name'].strip(),
                dose=data['dose'].strip(),
                time=parse_time(data['time']),
                status=(data.get('status') or 'pending'),
                user_id=user_id,
            )
            db.session.add(med)
            db.session.commit()
            return med.to_dict(), 201
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

class MedicationById(Resource):
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        med = Medication.query.filter_by(id=id, user_id=user_id).first()
        if not med:
            return {'error': 'Medication not found'}, 404
        data = request.get_json()
        if 'status' in data:
            if data['status'] not in ['pending', 'taken', 'missed']:
                return {'error': "status must be 'pending', 'taken', or 'missed'"}, 400
            med.status = data['status']
        if 'time' in data:
            med.time = parse_time(data['time'])
        if 'name' in data and data['name']:
            med.name = data['name'].strip()
        if 'dose' in data and data['dose']:
            med.dose = data['dose'].strip()
        try:
            db.session.commit()
            return med.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

# Register medication resources
api.add_resource(Medications, '/medications')
api.add_resource(MedicationById, '/medications/<int:id>')

# ---------------- Meals (create/read) ----------------
class Meals(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        # Return only meals that are linked to this user's readings OR simple listing of all meals
        # For simplicity, we'll return all meals the user created in this app context.
        # If meals are global, you could return all.
        meals = Meal.query.order_by(Meal.created_at.desc()).all()
        return [m.to_dict() for m in meals], 200

    @jwt_required()
    def post(self):
        data = request.get_json()
        if not data.get('name'):
            return {'error': 'name is required'}, 400
        meal = Meal(
            name=data['name'].strip(),
            meal_type=data.get('meal_type'),
            description=data.get('description'),
        )
        try:
            db.session.add(meal)
            db.session.commit()
            return meal.to_dict(), 201
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

api.add_resource(Meals, '/meals')

# ---------------- Link/Unlink Meals to Readings with carbs_amount ----------------
class ReadingMeals(Resource):
    @jwt_required()
    def post(self, reading_id):
        """Attach a meal to a reading with optional carbs_amount."""
        user_id = get_jwt_identity()
        reading = Reading.query.filter_by(id=reading_id, user_id=user_id).first()
        if not reading:
            return {'error': 'Reading not found'}, 404
        data = request.get_json()
        if not data or not data.get('meal_id'):
            return {'error': 'meal_id is required'}, 400
        meal = Meal.query.get(data['meal_id'])
        if not meal:
            return {'error': 'Meal not found'}, 404
        carbs_amount = data.get('carbs_amount')
        try:
            ins = reading_meals.insert().values(
                reading_id=reading.id,
                meal_id=meal.id,
                carbs_amount=carbs_amount,
            )
            db.session.execute(ins)
            db.session.commit()
            return {'message': 'linked', 'reading_id': reading.id, 'meal_id': meal.id, 'carbs_amount': carbs_amount}, 201
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

    @jwt_required()
    def delete(self, reading_id):
        """Detach a meal from a reading."""
        user_id = get_jwt_identity()
        reading = Reading.query.filter_by(id=reading_id, user_id=user_id).first()
        if not reading:
            return {'error': 'Reading not found'}, 404
        meal_id = request.args.get('meal_id', type=int)
        if not meal_id:
            return {'error': 'meal_id query param is required'}, 400
        try:
            delete_stmt = reading_meals.delete().where(
                (reading_meals.c.reading_id == reading.id) & (reading_meals.c.meal_id == meal_id)
            )
            db.session.execute(delete_stmt)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400

api.add_resource(ReadingMeals, '/readings/<int:reading_id>/meals')

if __name__ == '__main__':
    app.run(port=5555, debug=True)

