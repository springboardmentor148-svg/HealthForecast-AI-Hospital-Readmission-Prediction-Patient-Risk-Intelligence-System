# HealthForecast AI – Hospital Readmission Prediction & Patient Risk Intelligence System

## Overview

**HealthForecast AI** is an end-to-end AI-powered hospital readmission prediction and patient risk intelligence system designed to assist healthcare professionals in identifying patients who may be at risk of hospital readmission.

The system combines **machine learning, clinical data processing, a FastAPI REST backend, MySQL database, JWT authentication, and a React-based web interface** into a single healthcare application.

Hospital readmissions are an important indicator of healthcare quality and patient outcomes. By analyzing patient demographics, admission information, hospital utilization, diagnosis categories, medication history, and other clinical attributes, HealthForecast AI provides a risk assessment that can support clinical decision-making, discharge planning, and targeted patient follow-up.

## Key Features

- **Secure Authentication**: User registration, login, JWT authentication, protected routes, and current-user management.
- **Patient Management**: Create, read, update, and delete patient records through REST APIs.
- **AI Readmission Prediction**: Machine-learning-based prediction using patient and clinical information.
- **Risk Classification**: Patients can be classified into low-, medium-, and high-risk categories.
- **Prediction Probability**: The system returns the estimated readmission probability along with the prediction.
- **Clinical Recommendations**: Prediction responses include recommendations associated with the model result.
- **Prediction History**: Previously generated predictions can be stored and retrieved.
- **Hospital Dashboard**: Displays patient, prediction, high-risk, and low-risk statistics.
- **Clinical Data Processing**: Supports demographic, admission, diagnosis, hospital-statistic, diabetes, and medication-related features.
- **REST API**: FastAPI endpoints connect the React frontend, database, and machine-learning model.
- **Interactive API Documentation**: Swagger/OpenAPI documentation is available through FastAPI.
- **Responsive Healthcare UI**: React-based interface containing dashboard, patient management, prediction, history, reports, profile, and settings modules.

---

## System Architecture

```text
                         HEALTHFORECAST AI
                                |
             ┌──────────────────┴──────────────────┐
             |                                     |
             ▼                                     ▼
    React Frontend                            FastAPI Backend
             |                                     |
      ┌──────┼────────┐                    ┌───────┼────────┐
      |      |        |                    |       |        |
      ▼      ▼        ▼                    ▼       ▼        ▼
    Auth  Patients Prediction          Auth APIs Patient  ML Model
                         |                     APIs   Prediction
                         |                       |
                         ▼                       ▼
                 Prediction History       MySQL Database
                         |
                         ▼
                 Dashboard Analytics
```

### Application Flow

```text
Doctor / Authorized User
          |
          ▼
      React UI
          |
          ▼
     JWT Authentication
          |
          ▼
     FastAPI REST API
          |
      ┌───┴───────────────┐
      |                   |
      ▼                   ▼
   MySQL             ML Pipeline
      |                   |
      |                   ▼
      |             Risk Prediction
      |                   |
      └──────────┬────────┘
                 ▼
          Prediction Result
                 |
                 ▼
       Dashboard / History
```

---

## Project Structure

```text
HealthForecastAI/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   └── images/
│   │   │
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   └── Tables/
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   │
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login/
│   │   │   │   ├── Register/
│   │   │   │   └── ForgotPassword/
│   │   │   ├── Dashboard/
│   │   │   ├── Patients/
│   │   │   ├── Prediction/
│   │   │   ├── PredictionHistory/
│   │   │   ├── Reports/
│   │   │   ├── Profile/
│   │   │   └── Settings/
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── predictionService.js
│   │   │   └── patientService.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── dependencies.py
│   ├── security.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── crud_patient.py
│   ├── crud_prediction.py
│   ├── dashboard.py
│   ├── predict.py
│   ├── audit.py
│   ├── model/
│   ├── requirements.txt
│   └── venv/
│
├── README.md
└── .gitignore
```

> `venv/`, `node_modules/`, `.env`, credentials, and other generated/private files should not be committed to GitHub.

---

## Dataset Information

The machine-learning component is based on the **UCI Diabetes 130-US Hospitals dataset**, which contains clinical records from 130 US hospitals covering the period from 1999 to 2008.

The dataset contains information related to:

- Patient demographics
- Race and gender
- Admission and discharge information
- Hospital stay
- Laboratory procedures
- Medical procedures
- Medication counts
- Previous outpatient visits
- Emergency visits
- Inpatient visits
- Diagnosis information
- Diabetes medications
- Readmission status

### Target Variable

The original readmission target contains three categories:

```text
<30  → Readmitted within 30 days
>30  → Readmitted after 30 days
NO   → Not readmitted
```

The project can also evaluate a binary formulation focused on identifying patients readmitted within 30 days.

---

## Clinical Input Features

The prediction interface supports clinical and hospital-related information including:

### Patient Information

- Age
- Gender
- Race
- Medical specialty

### Admission Information

- Admission type
- Discharge disposition
- Admission source

### Hospital Statistics

- Time in hospital
- Number of laboratory procedures
- Number of procedures
- Number of medications
- Number of outpatient visits
- Number of emergency visits
- Number of inpatient visits
- Number of diagnoses

### Diabetes Information

- Maximum glucose serum result
- HbA1c result
- Medication change
- Diabetes medication indicator

### Diagnosis Categories

- Primary diagnosis
- Secondary diagnosis
- Tertiary diagnosis

### Medication History

The system supports medication-related features such as:

- Metformin
- Repaglinide
- Nateglinide
- Chlorpropamide
- Glimepiride
- Acetohexamide
- Glipizide
- Glyburide
- Tolbutamide
- Pioglitazone
- Rosiglitazone
- Acarbose
- Miglitol
- Troglitazone
- Tolazamide
- Insulin
- Glyburide + Metformin
- Glipizide + Metformin
- Glimepiride + Pioglitazone
- Metformin + Rosiglitazone
- Metformin + Pioglitazone

---

## Technologies and Libraries Used

### Frontend

- **Language**: JavaScript
- **Framework**: React
- **Build Tool**: Vite
- **Routing**: React Router
- **HTTP Client**: Axios
- **UI Components**: Bootstrap
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Styling**: CSS

### Backend

- **Language**: Python
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Database Driver**: PyMySQL
- **Authentication**: JWT / Python-JOSE
- **Password Security**: Passlib / bcrypt

### Database

- **MySQL**

### Machine Learning

- Python
- pandas
- numpy
- scikit-learn
- XGBoost
- LightGBM
- CatBoost
- imbalanced-learn
- FLAML
- Optuna
- matplotlib
- seaborn

---

## Machine Learning Models & Modeling Approaches

The machine-learning study includes binary readmission classification.


### Binary Classification

The binary formulation focuses on:

```text
Readmitted within <30 days
vs.
Other / Not <30 days
```

Decision-threshold optimization is used to study the trade-off between precision and recall for identifying high-risk patients.

---

## Evaluation Metrics

The machine-learning models are evaluated using:

- **Accuracy** – Overall proportion of correct predictions.
- **Precision** – Proportion of predicted positive cases that are actually positive.
- **Recall / Sensitivity** – Proportion of actual positive cases correctly identified.
- **F1-Score** – Harmonic mean of precision and recall.
- **ROC-AUC** – Measures discrimination performance for the binary classification task.
- **Confusion Matrix** – Shows prediction outcomes across classes.
- **Classification Report** – Provides precision, recall, and F1-score for each class.

Recall is particularly important for the readmission-risk application because missing a genuinely high-risk patient can have significant clinical consequences.

---

### Important Observation

For the binary task, the standard 0.50 decision threshold produces very low sensitivity because of severe class imbalance. A lower threshold of 0.25 improves recall and F1-score, making it more appropriate for screening patients who may be at higher readmission risk.

---

## Backend REST API

The FastAPI backend currently exposes the following endpoints.

### General

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend status |
| GET | `/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate a user |
| GET | `/me` | Get the authenticated user |

### Prediction

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Generate AI readmission prediction |
| GET | `/predictions` | Retrieve prediction history |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Retrieve hospital dashboard statistics |

### Patient Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/patients` | Retrieve all patients |
| POST | `/patients` | Add a new patient |
| GET | `/patients/{patient_id}` | Retrieve a specific patient |
| PUT | `/patients/{patient_id}` | Update a patient |
| DELETE | `/patients/{patient_id}` | Delete a patient |

Protected endpoints use:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication Architecture

```text
User
 |
 ▼
Login Page
 |
 ▼
POST /login
 |
 ▼
FastAPI validates credentials
 |
 ▼
JWT Access Token
 |
 ▼
React AuthContext
 |
 ▼
localStorage
 |
 ▼
Axios Request Interceptor
 |
 ▼
Authorization: Bearer <token>
 |
 ▼
Protected FastAPI API
```

JWT authentication is used to protect patient, dashboard, prediction, and user-specific resources.

---

## Patient Management Architecture

The Patients module provides CRUD functionality:

```text
                 Patients Module
                       |
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Create          Read          Update
        |              |              |
        └──────────────┼──────────────┘
                       |
                       ▼
                     Delete
                       |
                       ▼
                 MySQL Database
```

Patient records include:

- Patient ID
- Patient name
- Age
- Gender
- Race
- Admission type
- Discharge disposition
- Admission source
- Created by
- Created timestamp

---

## Prediction Workflow

```text
Patient Information
        |
        ▼
Clinical Prediction Form
        |
        ▼
Input Validation
        |
        ▼
POST /predict
        |
        ▼
Feature Preparation
        |
        ▼
Machine Learning Model
        |
        ▼
Prediction Probability
        |
        ▼
Risk Classification
        |
        ▼
Confidence + Recommendation
        |
        ▼
Save Prediction
        |
        ▼
Display Result
```

---

## Dashboard

The dashboard provides a centralized hospital overview including:

- Total patients
- Total predictions
- High-risk cases
- Low-risk cases
- Today's prediction statistics
- Readmission trends
- Risk distribution

The dashboard retrieves its statistics from the FastAPI `/dashboard` endpoint.

---

## Installation & Setup

### Prerequisites

Install the following:

- Python 3.10+
- Node.js and npm
- MySQL
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/HealthForecastAI.git
cd HealthForecastAI
```

---

### 2. Configure MySQL

Create the database:

```sql
CREATE DATABASE healthforecast_ai;
```

Configure the backend database connection for your local MySQL installation.

Example:

```text
mysql+pymysql://USERNAME:PASSWORD@localhost:3306/healthforecast_ai
```

Do not commit real database credentials to GitHub.

---

### 3. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI:

```bash
uvicorn app:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install packages:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Environment Variables

For local development, sensitive configuration should be stored in environment variables.

Example:

```env
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/healthforecast_ai
SECRET_KEY=your_secret_key
```

Do not commit:

```text
.env
venv/
node_modules/
__pycache__/
*.pyc
```

---

## Usage

### Step 1 – Start MySQL

Make sure the MySQL server is running and the `healthforecast_ai` database is available.

### Step 2 – Start Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app:app --reload
```

### Step 3 – Start Frontend

```bash
cd frontend
npm run dev
```

### Step 4 – Open the Application

```text
http://localhost:5173
```

### Step 5 – Login

Use a registered healthcare user account.

### Step 6 – Manage Patients

Open:

```text
Patients
```

to add, view, update, search, filter, and delete patient records.

### Step 7 – Generate Prediction

Open:

```text
New Prediction
```

Enter the required clinical information and generate the AI readmission prediction.

### Step 8 – Review History

Open:

```text
Prediction History
```

to review previously generated predictions.

---

## API Documentation

FastAPI automatically provides interactive API documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

The Swagger interface can be used to test:

```text
/register
/login
/me
/predict
/predictions
/dashboard
/patients
/patients/{patient_id}
```

## Future Scope

### 1. Explainable AI

Integrate:

- SHAP
- LIME

to explain why a patient receives a particular risk classification.

### 2. Advanced Analytics

Add:

- Patient risk trends
- Hospital readmission trends
- Department-level analytics
- Model performance dashboards
- Interactive charts

### 3. Clinical Decision Support

Extend the recommendation engine to provide more personalized discharge and follow-up suggestions.

### 4. EHR Integration

Provide integration interfaces for Electronic Health Record systems to support real-time clinical data ingestion.

### 5. Notifications

Implement alerts for high-risk patients through:

- Email
- SMS
- In-app notifications

### 6. Production Deployment

Future deployment can use:

- Docker
- Nginx
- Cloud hosting
- CI/CD
- Managed MySQL
- HTTPS
- Production secrets management

### 7. Model Monitoring

Add:

- Model drift detection
- Prediction monitoring
- Data quality monitoring
- Periodic model retraining

---

## Security Considerations

The application uses:

- JWT-based authentication
- Bearer token authorization
- Password hashing
- Protected React routes
- Protected FastAPI endpoints
- SQLAlchemy database access

For production deployment:

- Store secrets in environment variables or a secrets manager.
- Use HTTPS.
- Restrict CORS to trusted frontend domains.
- Never expose database credentials.
- Never commit `.env` files.
- Use appropriate healthcare data privacy and security controls.

---

## Disclaimer

HealthForecast AI is intended for academic, research, and software demonstration purposes.

The predictions generated by the system should **not** be treated as medical diagnoses or as a replacement for qualified clinical judgment. Healthcare professionals should review model outputs together with complete patient information before making clinical decisions.

---

