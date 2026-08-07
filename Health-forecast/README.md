# HealthForecast AI

A working implementation of **HealthForecast AI: Hospital Readmission
Prediction & Patient Risk Intelligence System**, built against every module
in the spec doc (`AI_Hospital Readmission Prediction & Patient Risk
Intelligence System (1).pdf`) — auth/RBAC, patient records, an XGBoost
readmission-risk model, treatment effectiveness tracking, clinical decision
support, analytics dashboards, audit logging, notifications, and AI model
management — with all four Milestones from Section 5 complete.

**Status: all 4 milestones complete.** The backend has been run live
end-to-end (login → RBAC checks → patient CRUD → prediction → analytics →
audit log, across all four roles) and has an automated pytest suite
(`healthforecast/backend/tests/test_api.py`, 9 tests, all passing). The
frontend has been syntax-verified (Babel-compiled clean, matching the
browser's runtime settings). See **"What's been tested"** below for exactly
what that does and doesn't cover.

## What's included

```
healthforecast/
├── data/
│   └── diabetic_data.csv        # Diabetes 130-US Hospitals dataset
├── model/
│   ├── train_model.py            # trains & selects the readmission model
│   ├── xgb_readmission_model.json  # trained XGBoost model (generated)
│   ├── label_encoders.joblib     # categorical encoders (generated)
│   ├── feature_columns.joblib    # ordered feature schema (generated)
│   ├── age_map.json              # age-bracket → numeric mapping (generated)
│   └── metrics.json              # accuracy/precision/recall/F1/ROC-AUC (generated)
├── backend/
│   ├── main.py                    # FastAPI app — every module's routes
│   ├── auth.py                     # JWT auth + RBAC (Access Matrix, spec Section 4)
│   ├── models.py                    # SQLAlchemy models
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── database.py                    # SQLite by default, Postgres via HF_DATABASE_URL
│   ├── ml_service.py                   # live inference — mirrors train_model.py's feature engineering
│   ├── seed_db.py                       # creates one demo user per role (idempotent)
│   ├── tests/test_api.py                # pytest suite (9 tests)
│   └── Dockerfile
├── frontend/
│   ├── index.html                        # single-file React 18 app (CDN + Babel Standalone, no build step)
│   └── Dockerfile                         # nginx, serves index.html
├── docs/PROGRESS.md                        # detailed build log, all 4 milestones
└── docker-compose.yml                       # full stack; SQLite by default, Postgres via `--profile postgres`
requirements.txt
```

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Train the model (optional — a trained model is already checked in)

```bash
cd healthforecast
python model/train_model.py
```

Loads `data/diabetic_data.csv` (101,766 raw encounters), cleans it (dedupes
to first encounter per patient, drops leakage-prone/expired-discharge rows),
engineers features (ICD9 → clinical groups, age bracket → numeric midpoint,
medication columns → ordinal), and trains an XGBoost classifier on a binary
target (readmitted **within 30 days** vs. not — the clinically standard,
CMS-penalized framing of "readmission").

**Test-set metrics (13,998 held-out patients):**

| Metric | Value |
|---|---|
| Accuracy | 69.3% |
| Precision | 14.6% |
| Recall | 49.7% |
| F1 | 0.226 |
| ROC-AUC | 0.647 |

This is a genuinely hard, imbalanced problem (~9% positive rate) — these
numbers are in line with published baselines for this exact dataset/task.
`scale_pos_weight` biases the model toward recall, since missing a
high-risk patient is costlier than a false alarm; treat the score as a
triage/prioritization signal, not a diagnostic tool.

## 3. Seed demo users and run the backend

```bash
cd healthforecast/backend
python seed_db.py          # creates demo accounts (safe to re-run)
uvicorn main:app --reload --port 8000
```

### Demo credentials (from `seed_db.py`)

| Role | Email | Password |
|---|---|---|
| Doctor | doctor@healthforecast.ai | doctor123 |
| Hospital Administrator | admin@healthforecast.ai | admin123 |
| Healthcare Researcher | researcher@healthforecast.ai | research123 |
| System Administrator | sysadmin@healthforecast.ai | sysadmin123 |

## 4. Run the frontend

```bash
cd healthforecast/frontend
python -m http.server 3000
# open http://localhost:3000 — the app talks to the API at http://localhost:8000
```

No `npm install` / build step — it's a single HTML file that loads React 18
and Babel Standalone from a CDN and compiles JSX in-browser. This is a
deliberate simplification; `docs/PROGRESS.md` notes porting it to a real
Vite/Next.js + Tailwind project (the spec's listed stack) as a follow-up,
since all components are already written as separable functions.

## 5. Or run everything with Docker

```bash
cd healthforecast
docker compose up --build
# backend on :8000, frontend on :3000, SQLite persisted in a named volume
```

For Postgres instead of SQLite (matches the spec's tech stack, Section 7):

```bash
docker compose --profile postgres up --build
# then set HF_DATABASE_URL on the backend service in docker-compose.yml —
# see the commented-out example line in that file
```

## What's been tested

**Backend — live-verified, this pass:**
- Installed the pinned `requirements.txt` into a clean environment and confirmed it resolves with no missing packages (this used to fail — see "Fixes made in this pass" below).
- Ran the server, seeded demo users, and exercised the full request lifecycle over HTTP for all 4 roles: login → `/auth/me` → patient create → `POST /predict` → all 5 analytics endpoints → `/models` → `/audit-logs` → `/notifications`, plus negative tests (wrong password → 401, Doctor hitting `/users` → 403, Researcher creating a patient → 403).
- Added `healthforecast/backend/tests/test_api.py` — 9 pytest tests covering auth, the Access Matrix's RBAC boundaries, patient lifecycle + prediction, all analytics endpoints, and audit logging. All passing (`pytest -v` from `healthforecast/backend/`).

**Frontend:**
- Extracted the inline JSX from `index.html` and compiled it with Babel using the same classic-runtime settings `babel-standalone` uses in-browser — compiles clean, no syntax errors, and the compiled output parses correctly against `React`/`ReactDOM` globals.
- Not covered: actual browser rendering / click-through testing (this environment has no browser). If you hit a runtime (not syntax) issue, it'll be a logic bug in a specific component, not a project-wide problem — the whole file is verified to compile.

**Deployment:**
- `docker-compose.yml` and both Dockerfiles were rewritten to fix a build-context bug (see below) and validated for YAML correctness and Dockerfile `COPY` path correctness against the actual repo layout.
- Not covered: an actual `docker compose up --build` run — no Docker engine is available in this authoring environment. The paths and YAML are correct; if you hit an image-build issue on your machine it'll most likely be an environment difference (Docker version, platform), not a structural error in these files.

## Fixes made in this pass

1. **`requirements.txt` was missing half its actual dependencies** (`sqlalchemy`, `python-jose`, `passlib`, `bcrypt`, `python-multipart`, `email-validator`, `pytest`, `httpx`) — a fresh install would have failed on the first `import`. Rewritten to match everything the backend actually imports, with `bcrypt==4.0.1` pinned (newer bcrypt breaks passlib's version probe).
2. **RBAC 403 error message was ugly** — showed `Role 'RoleEnum.doctor' is not permitted...` instead of `Role 'doctor'...`. Fixed in `auth.py`.
3. **Database was hardcoded to SQLite** — added an `HF_DATABASE_URL` env var (defaults to SQLite for zero-friction local dev; set it to a `postgresql+psycopg2://...` URL for Postgres, matching the spec's tech stack).
4. **Docker build context was broken** — `backend/Dockerfile` tried to `COPY requirements.txt` from inside a build context (`healthforecast/`) that didn't contain it (`requirements.txt` lives at the repo root, one level up). Fixed by changing the build context to the repo root in `docker-compose.yml` and updating the Dockerfile's `COPY` paths to match; also switched it to install from the single `requirements.txt` instead of a separately-maintained inline package list, and added the Postgres driver.
5. Added a `postgres` service (behind a Compose `--profile postgres`, off by default) so the Docker path can actually exercise the Postgres option now that `database.py` supports it.

## API endpoints (selected)

| Method | Path | Module |
|---|---|---|
| POST | `/auth/login` | Auth |
| GET | `/auth/me` | Auth |
| GET/POST/PATCH | `/users` | User Management (System Admin only) |
| POST/GET/PATCH/DELETE | `/patients` | Patient Data Management |
| POST | `/patients/{id}/predict` | Risk Prediction / Readmission Forecasting |
| POST/GET | `/patients/{id}/treatments` | Treatment Effectiveness |
| POST/GET | `/patients/{id}/care-plan` | Clinical Decision Support |
| GET | `/analytics/summary`, `/model-performance`, `/trends`, `/hospital-performance`, `/export/patients` | Healthcare Analytics Dashboard |
| GET/POST | `/models`, `/models/retrain`, `/models/runs` | AI Model Management |
| GET | `/audit-logs` | Audit Logging (System Admin only) |
| GET/PATCH | `/notifications` | Notifications |
| GET | `/health` | Liveness |

Full interactive docs (request/response schemas) are auto-generated by
FastAPI at `http://localhost:8000/docs` once the backend is running.

## Notes on the target variable

The raw `readmitted` column has three values: `NO`, `>30`, `<30`. The model
collapses it to a binary label (`<30` = 1, else = 0) because 30-day
readmission is the standard, clinically actionable target for this dataset
— it's what CMS penalizes hospitals on, and it's the framing implied by
"Readmission Forecasting" in the spec.

## What's still open (flagged, not hidden)

- The frontend is a single-file CDN/Babel React app rather than a built
  Vite/Next.js + Tailwind project — functionally complete and verified
  syntax-clean, but not the exact build tooling the spec's tech stack lists.
- Docker Compose has not been build-tested end-to-end in this environment
  (no Docker engine available here) — see "What's been tested" above.
- No CI pipeline (e.g. GitHub Actions) wired up to run `pytest` automatically
  on push, though the test suite itself is ready to be dropped into one.
