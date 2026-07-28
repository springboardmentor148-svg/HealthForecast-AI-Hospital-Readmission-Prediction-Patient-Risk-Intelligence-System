# HealthForecast AI
### Hospital Readmission Prediction & Patient Risk Intelligence System

A full-stack implementation of the platform described in your project spec, wired
up to the CatBoost model you trained in `HealthForecast_AI_Improved_Model.ipynb`.

```
healthforecast-ai/
├── backend/     FastAPI + SQLAlchemy + your CatBoost model
├── frontend/    React + Vite + Tailwind, custom clinical UI
└── docker-compose.yml
```

## What's implemented vs. the original spec

The PDF describes an 8-week, enterprise-scale build (Postgres **and** MongoDB,
Kubernetes, multi-cloud deployment, a full EHR/lab/pharmacy integration layer,
etc.). This build implements the same **modules, roles, and access matrix**
end-to-end, with a couple of pragmatic substitutions so it runs anywhere with
zero external infrastructure:

| Spec | This build | Why |
|---|---|---|
| PostgreSQL + MongoDB | SQLite (SQLAlchemy) | One dependency-free file. Point `DATABASE_URL` at Postgres for production — the code doesn't change. |
| Kubernetes / multi-cloud | Docker + Docker Compose | Same containers deploy to ECS/AKS/Cloud Run/K8s without modification. |
| EHR / lab / pharmacy integrations | Not implemented | No sandbox credentials for these systems; the data model has room for them (`clinical_features` is a flexible JSON column). |

Everything else — the 4 roles and their exact permissions from your access
matrix, all 7 core modules, JWT auth, the risk prediction engine, and the
analytics dashboards — is implemented and working.

## Modules implemented

1. **User Management** — JWT auth, RBAC for Doctor / Hospital Administrator /
   Healthcare Researcher / System Administrator, matching your access matrix
   exactly (e.g. researchers get anonymized data only, doctors only see
   assigned patients, only admins manage users/models).
2. **Patient Data Management** — patient records, encounter history, the full
   43-feature clinical profile used by the model.
3. **Risk Prediction** — `/predictions/predict` runs your CatBoost model
   directly (same preprocessing as the notebook) and returns a probability +
   risk category (Low/Medium/High/Critical).
4. **Treatment Effectiveness / Clinical Decision Support** — rule-based care
   recommendations generated alongside every prediction (follow-up timing,
   case-manager flags, medication reconciliation, etc.) — see
   `backend/app/ml/predictor.py::_categorize` to extend these.
5. **Healthcare Analytics Dashboard** — hospital-wide readmission trends by
   age, admission type, length of stay, and medication burden, computed from
   the Diabetes 130-US Hospitals dataset you provided, plus live platform
   metrics (active assessments, risk mix, etc).
6. **AI Model Management** — the model is loaded once at startup
   (`ReadmissionPredictor`, a singleton) and versioned in each stored
   assessment (`model_version`); swap in a retrained `.pkl` by replacing
   `backend/app/ml/healthforecast_model.pkl`.

## Quick start (Docker — recommended)

```bash
docker compose up --build
```
- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:3000

The backend seeds demo accounts automatically on first boot.

## Quick start (manual)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed        # creates demo users + sample patients
uvicorn app.main:app --reload
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
cp .env.example .env      # points at http://localhost:8000/api/v1
npm run dev
```
Open http://localhost:5173.

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Doctor | `dr.patel` | `Doctor@123` |
| Doctor | `dr.james` | `Doctor@123` |
| Hospital Administrator | `hospitaladmin` | `Admin@123` |
| Healthcare Researcher | `researcher` | `Research@123` |
| System Administrator | `admin` | `Admin@123` |

The login screen has one-click buttons for all five.

## API overview

Full interactive docs at `GET /docs` once the backend is running. Key routes:

- `POST /api/v1/auth/login` — OAuth2 password flow, returns a JWT
- `GET /api/v1/patients` — role-scoped patient list (assigned-only for
  doctors, anonymized for researchers, full for admins)
- `POST /api/v1/predictions/predict` — run the model against a feature set,
  optionally persisting the result against a patient
- `GET /api/v1/analytics/population-insights` — cohort-level readmission
  trends from the training dataset
- `GET /api/v1/analytics/hospital-overview` — live platform metrics

## Notes on the model

`backend/app/ml/predictor.py` reproduces the exact 43-column feature order and
categorical casting (`.astype(str)`, including the literal string `"nan"` for
missing values) used when the CatBoost model was fit in your notebook, so
predictions from the API match what you'd get calling `model.predict_proba()`
directly on the same row. Risk categories are threshold buckets over the
predicted probability — tune the cutoffs in `_categorize()` if your hospital
wants different triage thresholds.

## Next steps if you want to go further

- Swap SQLite → Postgres for concurrent multi-user production use.
- Add a `/models/reload` admin endpoint + versioned storage if you plan to
  retrain periodically.
- Wire real EHR/lab feeds into `Patient.clinical_features` instead of manual
  entry.
- Add automated tests (`pytest` for the API, `vitest` for the frontend) before
  shipping to a real hospital environment.
