# HealthForecast AI Backend

Phase 1 of the backend foundation for **HealthForecast AI**.

## Setup

### 1. Create a virtual environment

macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies

From the repository root:

```bash
pip install -r backend/requirements.txt
```

### 3. Create your environment file

Copy `.env.example` to `.env` and update the values for your local setup.
`SECRET_KEY` and `JWT_SECRET_KEY` are required and must be set in the environment before the app starts.

### 4. Start PostgreSQL

Make sure PostgreSQL is running and that `DATABASE_URL` points to a valid database connection string.

### 5. Run the backend

From the repository root:

```bash
python run.py
```

### 6. Run migrations later

Migrations are scaffolded for future phases. Once models are added, use:

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Phase 1 Endpoints

- `GET /api/v1/health`
- `GET /api/v1/auth/health`
- `GET /api/v1/users/health`
- `GET /api/v1/patients/health`
- `GET /api/v1/predictions/health`
- `GET /api/v1/analytics/health`
