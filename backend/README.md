# HealthForecast AI — Backend

Hospital Readmission Prediction & Patient Risk Intelligence System.
A production-ready, modular, RESTful **backend-only** service built with
FastAPI. No frontend, HTML/CSS/JS UI, or mobile app is included by design.

---

## Tech Stack

| Concern            | Choice                                  |
|---------------------|------------------------------------------|
| Language            | Python 3.12+                             |
| Framework           | FastAPI                                  |
| ASGI Server         | Uvicorn                                  |
| Database            | PostgreSQL                               |
| ORM                 | SQLAlchemy 2.0 (Declarative)              |
| Migrations          | Alembic                                  |
| Validation          | Pydantic v2                              |
| Auth                | JWT (python-jose, passlib/bcrypt)         |
| ML Serving          | joblib + XGBoost (inference only)         |
| Data Processing     | pandas, numpy                            |
| Reports             | reportlab (PDF), openpyxl (Excel), pandas (CSV) |
| Docs                | Swagger / OpenAPI (auto-generated)        |
| Testing             | pytest, httpx                            |
| Containerization    | Docker, Docker Compose                    |

---

## Project Structure

```
backend/
├── app/main.py            # FastAPI app entrypoint
├── core/                  # config, database, security, dependencies, logging, exceptions
├── models/                 # SQLAlchemy ORM models
├── schemas/                 # Pydantic request/response models
├── routers/                 # API endpoints (thin — no business logic)
├── services/                 # Business logic layer
├── repositories/             # Database access layer
├── ml/                        # Model loader, preprocessing, best_xgboost.pkl (you provide)
├── utils/                     # Helpers, constants, validators
├── tests/                     # pytest test suite
├── alembic/                   # DB migrations
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

Architecture follows: **Router → Service → Repository → Database**, with
FastAPI `Depends()` used for DB sessions, current-user resolution, and
role-based access control (RBAC). Business logic lives only in `services/`;
routers only validate input and delegate.

---

## 1. Local Setup (without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your real DATABASE_URL / SECRET_KEY

# Make sure PostgreSQL is running and the DB in DATABASE_URL exists, then:
alembic revision --autogenerate -m "init"
alembic upgrade head

uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs
Health check: http://localhost:8000/health

> In `APP_ENV=development`, tables are also auto-created on startup as a
> convenience. Use Alembic migrations for anything beyond local dev.

---

## 2. Running with Docker

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL and the API together. The API is available at
`http://localhost:8000`.

---

## 3. Adding the trained model

Place your trained model at:

```
backend/ml/best_xgboost.pkl
```

The backend **only loads and serves predictions** — it never retrains the
model. See `ml/model_loader.py` and `ml/preprocessing.py`. If your model
was trained with a different feature encoding than the defaults provided,
update `FEATURE_ORDER` and the `*_MAP` dictionaries in
`ml/preprocessing.py` to match your training pipeline.

---

## 4. Running tests

```bash
pytest
```

Tests use an in-memory SQLite database and a stubbed model, so no
PostgreSQL instance or real `.pkl` file is required to run the suite.

---

## 5. Roles & RBAC

- `doctor`
- `hospital_administrator`
- `healthcare_researcher`
- `system_administrator`

Each protected endpoint declares which roles may access it via the
`RequireRoles(...)` FastAPI dependency (`core/dependencies.py`).

---

## 6. API Overview

All routes are prefixed with `/api/v1`.

- **Auth**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`,
  `/auth/me`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`
- **Users**: `/users` (admin-scoped CRUD)
- **Patients**: `/patients` (CRUD, search, filter, sort, pagination)
- **Prediction**: `/predict`, `/predictions/{id}`, `/patients/{id}/predictions`
- **Dashboard**: `/dashboard/summary`, `/dashboard/recent-predictions`,
  `/dashboard/high-risk-patients`, `/dashboard/readmission-statistics`,
  `/dashboard/hospital-overview`
- **Analytics**: `/analytics/age-distribution`, `/analytics/monthly`,
  `/analytics/readmission-distribution`, `/analytics/patient-trends`
- **Reports**: `/reports/generate`, `/reports`, `/reports/{id}/download`,
  `/reports/{id}` (DELETE)

Full interactive documentation is always available at `/docs`.

---

## 7. Security notes

- Passwords hashed with bcrypt (never stored in plaintext).
- JWT access + refresh tokens; access tokens are short-lived.
- All protected routes require a valid Bearer token; sensitive routes are
  additionally role-gated.
- Centralised exception handling ensures internal errors/stack traces are
  never leaked to clients (`core/exceptions.py`).
- All security-relevant actions (logins, CRUD, predictions, reports) are
  recorded in the `audit_logs` table.
- CORS origins are explicitly configured via `BACKEND_CORS_ORIGINS`.
- Basic rate limiting is applied via `slowapi` (`RATE_LIMIT_PER_MINUTE`).

This backend is designed to be consumed by any frontend (React/Next.js or
otherwise) — no UI code is included in this deliverable.
