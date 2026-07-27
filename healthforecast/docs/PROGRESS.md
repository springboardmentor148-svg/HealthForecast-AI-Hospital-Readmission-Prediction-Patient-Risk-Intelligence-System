# HealthForecast AI — Build Progress

## STATUS: Model ✅ done | Backend ✅ done & tested | Frontend ✅ done (redesigned) & tested

## 1. Data & Model (COMPLETE)
- Source: `diabetic_data.csv` (101,766 raw encounters, Diabetes 130-US Hospitals dataset)
- Script: `model/train_model.py`
- Cleaning: removed expired/hospice discharges, deduped to first encounter/patient
  (69,987 rows after cleaning) to avoid leakage, dropped `weight` (99% missing),
  imputed `payer_code`/`medical_specialty`/`race` missing as "Missing" category.
- Feature engineering: ICD9 → clinical groups (Circulatory/Respiratory/Diabetes/etc),
  age bracket → numeric midpoint, medication columns → ordinal (No/Down/Steady/Up),
  `num_med_changes`, `prior_visits_total` engineered features.
- Target: binary — readmitted within **<30 days** (high-risk) vs not. Positive rate 9.0%.
- Model: XGBoost (`scale_pos_weight` to handle imbalance), 400 trees, depth 5.
- Test metrics (13,998 held-out patients):
  - Accuracy: 0.695 | Precision: 0.149 | Recall: 0.509 | F1: 0.230 | **ROC-AUC: 0.652**
  - (This AUC is in line with published literature for this exact task/dataset —
    30-day readmission is a genuinely noisy label; recall was prioritized via
    scale_pos_weight since missing a high-risk patient is costlier than a false alarm.)
- Artifacts saved in `model/`:
  - `xgb_readmission_model.joblib` — trained model
  - `label_encoders.joblib` — categorical encoders (dict per column: class→int)
  - `feature_columns.joblib` — ordered list of 48 feature names model expects
  - `metrics.json` — metrics + top-15 feature importances
  - `age_map.json` — age bracket → numeric mapping

## 2. Backend (COMPLETE & TESTED)
FastAPI app in `backend/`:
- [x] JWT auth + RBAC (Doctor, Hospital Administrator, Researcher, System Admin) — `auth.py`
- [x] SQLite via SQLAlchemy — `database.py`, `models.py` (User, Patient, PredictionLog)
- [x] `POST /patients/{id}/predict` — loads XGBoost model, returns risk score/category/top
      factors/care recommendations — `ml_service.py` replicates the exact training-time
      feature engineering (ICD9 grouping, age mapping, med ordinals) for live inference
- [x] Patient CRUD (`POST/GET /patients`, `GET /patients/{id}`) — role-scoped per Access
      Matrix (Doctor sees only assigned patients; Researcher blocked from raw records)
- [x] `GET /analytics/summary` and `GET /analytics/model-performance` — aggregate dashboards
- [x] Clinical decision support: rule-based recommendations keyed off risk tier (`ml_service.py`)
- [x] `seed_db.py` — demo users for all 4 roles
- [x] End-to-end tested: login → create patient → predict → analytics, all verified working

### Demo credentials (from seed_db.py)
| Role | Email | Password |
|---|---|---|
| Doctor | doctor@healthforecast.ai | doctor123 |
| Hospital Admin | admin@healthforecast.ai | admin123 |
| Researcher | researcher@healthforecast.ai | research123 |
| System Admin | sysadmin@healthforecast.ai | sysadmin123 |

### To restart backend after resuming:
```bash
cd healthforecast/backend
pip install fastapi uvicorn sqlalchemy python-jose passlib "bcrypt==4.0.1" python-multipart email-validator xgboost scikit-learn joblib pandas numpy --break-system-packages
python3 seed_db.py   # only if healthforecast.db doesn't exist yet
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Note: pin `bcrypt==4.0.1` — newer bcrypt breaks passlib's version probe.

## 3. Frontend (COMPLETE — redesigned)
Single-file React app (`frontend/index.html`) using React 18 + Babel Standalone via CDN
(no npm build step needed — open directly or serve statically). It's a straightforward
follow-up to port into a proper Next.js project (all components are already separated
functions: Login, Shell, Dashboard, Patients, NewPatient, PatientDetail, Analytics) if you
want the production Next.js/Tailwind version the spec's tech stack lists.

Implemented:
- [x] Login screen with demo-account quick-fill buttons for all 4 roles
- [x] Role-aware sidebar nav (Researcher doesn't see "New Patient", per Access Matrix)
- [x] Dashboard: composite risk pulse, total patients / predictions / high-risk count /
      avg risk score with sparklines, risk distribution bars, live model performance
      metrics, top predictive factors
- [x] Patients list (role-scoped by backend automatically — Doctor sees only their own)
      with client-side search by name/MRN
- [x] New Patient form matching the model's clinical input schema, grouped into labeled
      sections (Identification / Encounter Metrics / Clinical)
- [x] Patient detail page: encounter summary + "Run Readmission Risk Prediction" button
      → shows analog risk gauge (color-coded Low/Medium/High, zones matched to the
      backend's actual 0.25/0.5 thresholds), care recommendations, top per-patient risk
      factors

### Design direction (v2 — redesigned for a distinctive, non-generic look)
Rebuilt around a literal bedside patient-monitor / telemetry concept instead of a
generic dark navy/teal SaaS dashboard:
- Signature element: a live, animated ECG-style waveform (`VitalsWaveform`) whose
  amplitude, spike frequency, and scroll speed are procedurally generated from each
  patient's/population's actual risk score — used on the login screen, dashboard hero,
  and patient detail. An analog semicircular gauge with a needle (`RiskGauge`) replaces
  the old donut ring, styled after a clinical dial rather than a generic progress ring.
- Palette: near-black monitor screen background with a faint animated ECG-paper grid,
  phosphor green / cyan / amber / red — mapped to real vital-monitor conventions instead
  of the teal-on-navy "AI app" default.
- Type: JetBrains Mono for all data/display/headers (monitor-readout feel), IBM Plex
  Sans for body copy.
- Voice/copy: interface language leans into the monitor metaphor — "Chart Rack",
  "New Encounter", "Population Analytics", risk categories labeled STABLE / ELEVATED /
  CRITICAL — without changing the underlying API values.
- Small details: tile corner brackets (oscilloscope bezel), blinking status LEDs (blink
  rate scales with risk severity), sparklines on stat tiles.
- Verified: JSX syntax-checked with `@babel/core` (`transformSync`), all `<div>` tags
  balanced, gauge arc math implemented as a sampled polyline (not the SVG `A` command)
  to guarantee correct rendering with no ambiguity. Full API contract smoke-tested end
  to end (login → summary → model-performance → create patient → predict) against the
  running backend.
- Tested: served locally on port 3000, loads and hits the API on port 8000.

## How to run everything
```bash
# Terminal 1 — backend
cd healthforecast/backend
pip install fastapi uvicorn sqlalchemy python-jose passlib "bcrypt==4.0.1" python-multipart email-validator xgboost scikit-learn joblib pandas numpy --break-system-packages
python3 seed_db.py        # creates demo users (skip if healthforecast.db already exists)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend (any static server works)
cd healthforecast/frontend
python3 -m http.server 3000
# open http://localhost:3000/index.html — API base URL is hardcoded to http://localhost:8000
```

## Remaining / nice-to-have next steps
- [ ] Port the single-file frontend into a real Vite/Next.js + Tailwind project (spec's stack)
- [ ] Add Recharts-based charts (trend lines over time) once predictions accumulate history
- [ ] Dockerfile + docker-compose.yml for backend+frontend+Postgres (spec's Milestone 4 —
      currently using SQLite for simplicity; swap `DATABASE_URL` in `backend/database.py`)
- [ ] Patient edit/delete endpoints, admin user-management UI, audit logging
- [ ] Multiclass readmission target (<30 / >30 / NO) as an alternative to current binary model
- [ ] Move JWT secret in `backend/auth.py` out of source into an environment variable
