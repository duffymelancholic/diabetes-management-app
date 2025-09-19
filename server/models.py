from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import DateTime
from datetime import datetime
import bcrypt

from config import db

# Link table for Reading ↔ Meal (includes user-submitted carbs_amount)
reading_meals = db.Table('reading_meals',
    db.Column('reading_id', db.Integer, db.ForeignKey('readings.id'), primary_key=True),
    db.Column('meal_id', db.Integer, db.ForeignKey('meals.id'), primary_key=True),
    db.Column('carbs_amount', db.Float, nullable=True),  # User submittable attribute
    db.Column('created_at', DateTime, default=datetime.utcnow)
)

# Users of the app
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128))
    # Optional: user's diabetes type (e.g., type1, type2, gestational, prediabetes)
    diabetes_type = db.Column(db.String(30), nullable=True)
    # BMI-related fields (optional)
    height_cm = db.Column(db.Float, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    readings = db.relationship('Reading', backref='user', lazy=True, cascade='all, delete-orphan')
    medications = db.relationship('Medication', backref='user', lazy=True, cascade='all, delete-orphan')
    
    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes may not be viewed.')

    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt())
        self._password_hash = password_hash.decode('utf-8')

    def authenticate(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self._password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'diabetes_type': self.diabetes_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.name}>'

class Reading(db.Model):  # Blood glucose reading
    __tablename__ = 'readings'
    
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Float, nullable=False)  # Blood sugar value
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    notes = db.Column(db.Text)
    # pre_meal or post_meal
    context = db.Column(db.String(20), nullable=True)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Foreign key - belongs to User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Many-to-many with Meals
    meals = db.relationship('Meal', secondary=reading_meals, back_populates='readings')
    
    def to_dict(self):
        return {
            'id': self.id,
            'value': self.value,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'notes': self.notes,
            'context': self.context,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_id': self.user_id
        }
    
    def __repr__(self):
        return f'<Reading {self.value} on {self.date}>'

class Medication(db.Model):  # Medication reminder
    __tablename__ = 'medications'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dose = db.Column(db.String(50), nullable=False)
    time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='pending')  # taken/missed/pending
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Foreign key - belongs to User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'dose': self.dose,
            'time': self.time.isoformat() if self.time else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_id': self.user_id
        }
    
    def __repr__(self):
        return f'<Medication {self.name} - {self.dose}>'

class Meal(db.Model):  # Logged meal
    __tablename__ = 'meals'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    meal_type = db.Column(db.String(20))  # breakfast, lunch, dinner, snack
    description = db.Column(db.Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Many-to-many with Readings
    readings = db.relationship('Reading', secondary=reading_meals, back_populates='meals')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'meal_type': self.meal_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Meal {self.name}>'
