# HealthForecast-AI

## Hospital Readmission Prediction & Patient Risk Intelligence System

HealthForecast-AI is an AI-powered hospital readmission prediction and patient risk intelligence application. It combines a FastAPI backend, machine-learning based readmission prediction, authentication, patient workflows, dashboards, and API endpoints in a single application.

## Key Capabilities

- Hospital readmission risk prediction using a trained XGBoost model
- Patient risk prediction workflow
- Authentication and role-based application access
- FastAPI backend and API endpoints
- Dashboard and risk-prediction views
- Saved machine-learning model and label-encoder artifacts
- Docker-based application containerization

## Technology Stack

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite

### Machine Learning
- scikit-learn 1.6.1
- XGBoost 3.4.0
- pandas
- NumPy
- joblib

### Authentication
- python-jose
- passlib
- bcrypt

### Deployment
- Docker
- Docker Compose

## Project Structure

```text
HealthForecast-AI/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── ml_model.py
│   ├── create_db.py
│   └── seed_demo.py
│
├── ml/
│   ├── readmission_model.pkl
│   ├── label_encoders.pkl
│   └── readmission_prediction_model.ipynb
│
├── dataset/
│   └── diabetic_data.csv
│
├── static/
│   ├── profile.jpg
│   └── swagger-dark.css
│
├── models/
│   └── readmission_model.json
│
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── .python-version
├── .gitignore
└── README.md
```

## Machine Learning

The application uses a trained XGBoost classification model to predict hospital readmission risk.

The repository contains:

- `ml/readmission_model.pkl` — trained prediction model
- `ml/label_encoders.pkl` — saved label encoders used during preprocessing and inference
- `ml/readmission_prediction_model.ipynb` — model development and training notebook

The prediction workflow includes engineered features such as medication intensity, procedures per day, lab procedures per day, and high inpatient history.

## Running Locally

### 1. Create and activate a virtual environment

On Windows:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Start the FastAPI application

```powershell
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

FastAPI API documentation:

```text
http://127.0.0.1:8000/docs
```

## Running with Docker

The application is containerized using Docker.

### Build the Docker image

From the project root:

```powershell
docker build -t healthforecast-ai .
```

### Run the container

```powershell
docker run -p 8000:8000 healthforecast-ai
```

Then open:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

## Docker Validation

The Docker image has been successfully built, and the FastAPI application has been successfully started inside the container.

The running container successfully responded to requests for:

- `/`
- `/risk-prediction`
- `/static/profile.jpg`

## Database

The application uses SQLite with SQLAlchemy for local database operations.

The local database file is excluded from Git using `.gitignore`.

## Development Notes

The project uses Python 3.13 for deployment consistency. The machine-learning dependencies are pinned to the versions used for the saved model artifacts:

```text
scikit-learn==1.6.1
xgboost==3.4.0
```

## Deployment

The project is prepared for Docker-based cloud deployment. The Docker image packages the FastAPI application, machine-learning artifacts, dataset, static resources, and required Python dependencies.

## Project Context

This project implements a hospital readmission prediction and patient risk intelligence workflow using machine learning and a web-based application architecture.

The project documentation specifies Docker/containerization and cloud deployment as part of the deployment stage.

## Disclaimer

This application is a software/ML project for prediction and demonstration purposes. Model predictions should not be treated as a medical diagnosis or as a substitute for professional clinical judgment.
