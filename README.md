# HealthForecastAI 🩺📊

HealthForecastAI is a full-stack **Hospital Readmission Prediction & Patient Risk Intelligence System**. It combines a machine learning pipeline (XGBoost) for predicting patient readmission risk with a role-based web platform for doctors, hospital administrators, healthcare researchers, and system administrators to act on those predictions.

> ⚠️ **Disclaimer:** This is an academic/demo project. Model accuracy (~59–65%) is **not** sufficient for real clinical decision-making. Do not use this system to make actual patient care decisions in a production healthcare environment without significant further validation, regulatory review, and accuracy improvements.

## Project Overview 🚀

The platform predicts hospital readmission risk, identifies high-risk patients, evaluates treatment effectiveness, and supports post-discharge care planning — all through a centralized, role-based dashboard system.

It's built as three parts working together:

- **`backend/`** — the original ML pipeline (data preprocessing, XGBoost training, evaluation)
- **`backend_api/`** — a FastAPI REST API that serves the web app, handles auth, and triggers model retraining
- **`frontend/`** — a React (Vite) single-page app with dedicated dashboards per role

The current deployed model achieves **~59–65% accuracy** on the test set (varies by retrain; see the AI Model Management panel for the live figure).

## Roles & Access 👥

| Role | Can do |
|---|---|
| **Doctor** | View assigned patients, run predictions, review risk scores, manage treatments and care recommendations |
| **Hospital Administrator** | Monitor hospital-wide analytics, manage departments, track patient outcomes and readmission trends |
| **Healthcare Researcher** | Access anonymized/aggregated data, export research datasets, analyze treatment effectiveness |
| **System Administrator** | Full platform control — user management, dataset management, AI model retraining, audit logs, system settings |

## Features ✨

**Prediction & ML**
- Data preprocessing for medical tabular data (missing values, encoding, scaling)
- XGBoost model training with feature importance, confusion matrix, and classification report
- One-click model retraining from the admin dashboard, with results (accuracy/precision/recall/ROC-AUC) versioned automatically

**Platform**
- JWT-based authentication with role-based access control
- Per-role dashboards: Doctor, Hospital Administrator, Healthcare Researcher, System Administrator
- Patient records, treatment tracking, and care recommendations
- Real-time audit logging of every administrative action
- Dataset upload/management with automatic record counting
- Full settings suite per role (profile, password, notifications, appearance, and more)
- Public landing page showing live model accuracy

## Tech Stack 🛠️

**Frontend**
- React (Vite) + React Router
- Axios

**Backend API**
- FastAPI
- SQLAlchemy + SQLite
- JWT (python-jose) + Passlib (bcrypt)

**ML Pipeline**
- Python, Pandas, NumPy
- scikit-learn, XGBoost
- Joblib

> **Note on tech stack:** The original project proposal referenced a broader stack (PostgreSQL/MongoDB, Random Forest, TensorFlow, Next.js). The **actual shipped implementation** uses SQLite, XGBoost only, and React + Vite as listed above. Migrating to PostgreSQL and benchmarking additional models (Random Forest, LightGBM, CatBoost) remain open items — see [Future Improvements](#future-improvements-).

## Dataset 📁

The project uses a **Diabetic Readmission Dataset** — patient encounter records and clinical attributes related to readmission outcomes.

- `dataset/diabetic_data.csv` — raw dataset
- `dataset/clean_diabetic_data.csv` — cleaned dataset
- `dataset/train_data.csv` — training split
- `dataset/test_data.csv` — testing split
- `dataset/xgboost_model.pkl` — the currently deployed trained model

## Project Structure 📂

```text
HealthForecastAI/
├── backend/                  # ML pipeline
│   ├── preprocessing.py
│   ├── model_training.py
│   ├── model_loader.py
│   └── prediction.py
├── backend_api/               # FastAPI web backend
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth_utils.py
│   ├── audit_utils.py
│   └── routes/
│       ├── auth_routes.py
│       ├── admin_routes.py
│       ├── dataset_routes.py
│       ├── model_routes.py
│       ├── settings_routes.py
│       ├── patient_routes.py
│       ├── prediction_routes.py
│       ├── hospital_admin_routes.py
│       ├── research_routes.py
│       └── ...
├── frontend/                  # React (Vite) app
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── styles/
├── dataset/                    # shared dataset + trained model
├── docs/
├── images/
├── notebooks/
├── screenshots/
├── docker-compose.yml           # (add if using Docker deployment — see below)
└── README.md
```

## Installation ⚙️ (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/HealthForecastAI.git
cd HealthForecastAI
```

### 2. Set up the ML pipeline environment

```bash
python -m venv venv
venv\Scripts\activate
pip install pandas numpy scikit-learn xgboost joblib
```

### 3. Set up the backend API

```bash
cd backend_api
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy python-jose passlib[bcrypt] python-multipart
```

### 4. Set up the frontend

```bash
cd frontend
npm install
```

## Usage ▶️ (Local Development)

### Run the ML pipeline (standalone)

```bash
python backend/preprocessing.py
python backend/model_training.py
```

This produces `dataset/xgboost_model.pkl`, which the API and predictions use.

### Run the backend API

```bash
cd backend_api
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

API docs available at `http://127.0.0.1:8000/docs`.

### Run the frontend

```bash
cd frontend
npm run dev
```

App available at `http://localhost:5173`.

### Retrain the model from the dashboard

Log in as a System Administrator → **AI Model Management** → **Retrain Model**. This runs `backend/model_training.py` directly, parses the resulting metrics, and saves a new version — no manual steps needed.

---

## Deployment 🚀 (Production)

This section covers taking HealthForecastAI from local dev to a running production instance.

### 1. Environment variables

Create a `.env` file in `backend_api/` (never commit this file):

```env
# Security
SECRET_KEY=replace-with-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=sqlite:///./app.db
# or, if migrated to Postgres:
# DATABASE_URL=postgresql://user:password@db_host:5432/healthforecastai

# CORS
FRONTEND_ORIGIN=https://your-frontend-domain.com

# ML model path
MODEL_PATH=../dataset/xgboost_model.pkl
```

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

> Update `backend_api/database.py` and `backend_api/main.py` (CORS middleware) to read these values via `os.environ` / `python-dotenv` instead of hardcoded local values, if not already done.

### 2. Build the frontend for production

```bash
cd frontend
npm run build
```

This outputs a static `dist/` folder — serve it via Nginx, a static host (Vercel/Netlify), or bundle it into the Docker image.

### 3. Run the backend in production mode

Don't use `--reload` in production. Use a proper ASGI server with workers:

```bash
cd backend_api
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 4. Docker deployment

Add a `Dockerfile` for the backend (`backend_api/Dockerfile`):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend_api/ .
COPY dataset/ ../dataset/
RUN pip install --no-cache-dir fastapi uvicorn gunicorn sqlalchemy python-jose passlib[bcrypt] python-multipart
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

And for the frontend (`frontend/Dockerfile`):

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Tie both together with `docker-compose.yml` at the repo root:

```yaml
version: "3.9"
services:
  backend:
    build:
      context: .
      dockerfile: backend_api/Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - backend_api/.env
    volumes:
      - ./dataset:/dataset

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
```

Run with:

```bash
docker compose up -d --build
```

### 5. Cloud deployment (AWS / Azure)

- **Simple path:** Push Docker images to a registry (ECR / ACR), deploy backend as a container app (AWS ECS/Fargate, Azure Container Apps), and serve the frontend `dist/` via S3+CloudFront or Azure Static Web Apps.
- **Database:** If moving off SQLite for production (recommended for multi-instance deployments), provision a managed Postgres instance (AWS RDS / Azure Database for PostgreSQL) and update `DATABASE_URL`.
- **Secrets:** Store `SECRET_KEY` and DB credentials in AWS Secrets Manager / Azure Key Vault — do not bake them into the Docker image.
- **HTTPS:** Terminate TLS at a load balancer / API gateway in front of the backend, and serve the frontend over HTTPS.

### 6. Post-deployment checklist

- [ ] `.env` files created and **not** committed to git (confirm `.gitignore` covers them)
- [ ] `SECRET_KEY` rotated to a unique production value (not the dev default)
- [ ] CORS origin restricted to the actual frontend domain
- [ ] Frontend built with `npm run build` and served (not `npm run dev`)
- [ ] Backend running via `gunicorn`/`uvicorn` without `--reload`
- [ ] Database backed up / migration plan in place if using SQLite in production
- [ ] Model file (`xgboost_model.pkl`) present in the deployed container/volume
- [ ] Test each of the four role logins (Doctor, Hospital Admin, Researcher, System Admin) end-to-end on the deployed instance
- [ ] Audit logging confirmed working in the deployed environment

---

## System Administrator Panel 🛡️

The most complete role in the platform, fully backend-connected:

- **Overview** — live platform stats (users, doctors, predictions, patients) and recent activity
- **User Management** — invite, edit, activate/deactivate, change roles, remove users
- **Dataset Management** — upload, download, and remove training datasets with automatic record counting
- **AI Model Management** — trigger retraining, track version history and live metrics
- **Audit Logs** — a permanent, timestamped record of every administrative action, exportable as CSV
- **Settings** — profile, password, platform configuration, role permissions, alerts, notifications, privacy, and appearance

## Results 📈

- Model accuracy: **~59–65%** on the test set (updates with each retrain)
- Confusion matrix for class-wise prediction analysis
- Classification report with precision, recall, and F1-score
- Feature importance ranking to identify influential variables

## Known Limitations ⚠️

- **Model accuracy is low (~59–65%)** — not suitable for real clinical use without further tuning and validation.
- **Retraining always uses the fixed `dataset/train_data.csv`** — uploading a new dataset via the admin panel does not yet feed directly into retraining.
- **Some platform settings are not enforced yet** — e.g., maintenance mode and certain role-based permission toggles exist in the UI but aren't backed by real enforcement logic.
- **SQLite is used by default** — fine for demo/single-instance use, but not recommended for concurrent multi-user production load; migrate to PostgreSQL for real deployments.

## Future Improvements 🔮

- Hyperparameter tuning for XGBoost
- Compare performance with Random Forest, LightGBM, and CatBoost
- Cross-validation for more reliable evaluation
- Connect a specific uploaded dataset directly to the retraining pipeline (currently retraining always uses the fixed `dataset/train_data.csv`)
- Real enforcement for platform settings like maintenance mode and role-based permission toggles
- Migrate from SQLite to PostgreSQL for production-scale deployment
- Docker-based deployment to a cloud platform (AWS/Azure) — see [Deployment](#deployment-) section above

## Author 👨‍💻

**HealthForecastAI Project**

Built as a full-stack machine learning healthcare platform for readmission risk prediction and hospital patient intelligence.