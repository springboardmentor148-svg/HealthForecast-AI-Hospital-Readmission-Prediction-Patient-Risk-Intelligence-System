# HealthForecast AI

**Hospital Readmission Prediction & Patient Risk Intelligence System**

An AI-powered healthcare analytics platform that predicts 30-day hospital
readmission risk for diabetic patients, helping doctors identify high-risk
patients, evaluate treatment effectiveness, and plan proactive care.

Built as part of a Springboard/Infosys internship project.

---

## Live Deployment

Deployed on AWS EC2 with MongoDB Atlas.

```
http://16.16.197.3
```

---

## Features

### Patient Risk Prediction
- 43-field clinical prediction form (grouped into Common / Other medications
  for usability), backed by a tuned XGBoost model
- Optional linking to an existing patient record — updates that patient's
  profile with their latest risk level, visible across the app
- Clinical Decision Support — rule-based care recommendations, follow-up
  planning, risk mitigation suggestions, and discharge support notes
  generated from the prediction result and patient factors
- Full prediction history per doctor

### Patient Management
- Patient records (CRUD)
- Medical History (per patient)
- Treatment records (per patient) + **Treatment Effectiveness analysis**
  (completion-rate breakdown by medication, across all patients)
- Admission History (per patient)
- Consolidated **Patient Outcome Reports** — combines all of the above into
  one printable/exportable report per patient

### Analytics
- Dashboard with live statistics (patients, predictions, risk breakdown)
- Healthcare Trends — readmission risk over time, by month
- Model performance metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
  displayed directly on the Prediction page

### Platform
- JWT-based authentication (Doctor role)
- Editable doctor profile with avatar
- Persistent sidebar navigation + top navbar with live patient search,
  notifications shell, and last-login tracking
- Fully responsive, animated UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Bootstrap 5, Recharts, react-icons, Axios |
| Backend | FastAPI, Motor (async MongoDB driver), JWT (python-jose), Pydantic |
| Database | MongoDB (Atlas in production) |
| ML | XGBoost, scikit-learn, pandas, NumPy |
| Deployment | Docker, Docker Compose, AWS EC2, nginx |

---

## Machine Learning Model

**Dataset:** Diabetes 130-US Hospitals dataset (101,766 records, 50 features)

**Final model:** `XGBoost (Weighted, Tuned)` — `XGBClassifier` trained with
`scale_pos_weight` to correct for severe class imbalance, then
hyperparameter-tuned via `RandomizedSearchCV` (25 candidates × 5-fold CV,
scored on F1).

**Hyperparameters:**
```
subsample: 0.8, n_estimators: 300, min_child_weight: 7,
max_depth: 5, learning_rate: 0.05, colsample_bytree: 0.9
```

**Final performance (held-out test set):**

| Metric | Value |
|---|---|
| Accuracy | 66.2% |
| Precision | 18.3% |
| Recall | 58.7% |
| F1-Score | 0.283 |
| ROC-AUC | 0.687 |

### Why accuracy looks "low" — and why that's the right tradeoff

An earlier version of this model (plain XGBoost + SMOTE oversampling)
achieved **88.8% accuracy** but only **1.7% recall** — meaning it correctly
predicted "not readmitted" for almost everyone, catching virtually none of
the actual high-risk patients. High accuracy on this dataset is a trap:
since only a small fraction of patients are readmitted within 30 days, a
model can score well on accuracy while being clinically useless.

The current model deliberately trades accuracy for recall, since for a
readmission-risk screening tool, missing a genuinely high-risk patient
(false negative) is worse than flagging someone who turns out fine (false
positive, which a doctor can review and dismiss). Baseline comparisons
(Logistic Regression, Decision Tree, Random Forest, CatBoost) confirmed the
same accuracy/recall trap affects every tree-based model trained with SMOTE
instead of `scale_pos_weight` — see the training notebook for the full
comparison table.

Feature engineering (adding utilization/medication-burden features) was
attempted but did not improve results over the tuned baseline — documented
as a negative result rather than omitted.

---

## Project Structure

```
HealthForecastAI/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (auth, patient, prediction, etc.)
│   │   ├── models/          # MongoDB document builders
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Prediction logic, clinical decision support
│   │   ├── utils/           # JWT handling, password hashing
│   │   └── database/        # MongoDB connection
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route-level page components
│   │   ├── components/      # Reusable UI (Sidebar, TopNavbar, forms, etc.)
│   │   ├── services/        # API call wrappers
│   │   └── layouts/         # DashboardLayout (sidebar + navbar + footer)
│   ├── Dockerfile
│   └── nginx.conf
├── models/                  # Trained model artifacts (.pkl)
├── docker-compose.yml
└── .env.example
```

---

## Running Locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Create `backend/.env` with:
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=healthforecast_ai
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Running with Docker

```bash
cp .env.example .env
# Fill in real values in .env

docker compose up --build
```

Frontend: `http://localhost` · Backend: `http://localhost:8000`

---

## Roadmap

**Completed (Phase A — Doctor role):** Authentication, Profile, Patient
Management, Medical History, Treatment + Effectiveness Analysis, Admissions,
Risk Prediction, Clinical Decision Support, Healthcare Trends, Patient
Outcome Reports, Dashboard Analytics, Docker + AWS deployment.

**Not yet built (Phase B):** Multi-role RBAC (Hospital Administrator,
Healthcare Researcher, System Administrator), real notification system
(current bell icon is a UI placeholder), automated test suite, HTTPS/SSL.

---

## Tech Notes for Reviewers

- Passwords are hashed (bcrypt); JWT tokens carry `sub` (email) and `role`
- All patient-scoped endpoints filter by `created_by` — a doctor only ever
  sees their own patients' data
- MongoDB connection, JWT secret, and CORS origins are all environment-driven
  (no hardcoded credentials in source)
