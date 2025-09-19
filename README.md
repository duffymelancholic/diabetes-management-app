## Diabetes Management App

### Overview
A simple full‑stack app to help users manage diabetes by tracking readings, medications, and personal info. Built with Flask (API) and React (client).

### Features
- **Authentication**: Sign up, log in, and protected routes
- **Dashboard**: Quick view of recent activity
- **Readings**: Log and view blood glucose readings, context, and trends
- **Medications**: Track current medications and dosages
- **Profile**: Manage user details (including diabetes type and BMI fields)
- **To‑Do List**: Simple personal task tracking

### Tech Stack
- **Frontend**: React, React Router
- **Backend**: Flask, Flask‑RESTful, Flask‑Migrate, SQLAlchemy, SQLAlchemy‑Serializer
- **DB**: SQLite (dev)

### Getting Started

#### Prerequisites
- Python 3.10+ with pipenv
- Node.js 18+ and npm

#### 1) Backend (Flask API)
From the project root:
```bash
cd server
pipenv install
pipenv shell
python app.py  # First run will set up app; stop it (Ctrl+C) if needed

# Create DB and run migrations
flask db upgrade head

# (Optional) Seed data
python seed.py

# Start the API (default: http://localhost:5555)
python app.py
```

#### 2) Frontend (React Client)
From the project root in a new terminal:
```bash
npm install --prefix client
npm start --prefix client
```
Client runs at http://localhost:3000 and proxies API requests to http://localhost:5555.

#### 3) URLs
- API: http://localhost:5555
- Client: http://localhost:3000

### Project Structure
```
Diabetes-Management-App/
  client/        # React app
  server/        # Flask API, models, migrations, seed
```

### Common Commands
- **Run API**: `python server/app.py`
- **Run client**: `npm start --prefix client`
- **Install client deps**: `npm install --prefix client`
- **Migrations**:
  - Make revision: `flask db revision --autogenerate -m "message"`
  - Apply latest: `flask db upgrade head`

### Notes
- The client `package.json` sets a proxy to the API at `http://localhost:5555`.
- If ports conflict, change the Flask port in `server/app.py` and update the client proxy if needed.
