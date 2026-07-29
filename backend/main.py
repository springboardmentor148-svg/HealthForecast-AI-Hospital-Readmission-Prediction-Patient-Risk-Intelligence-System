import os
import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from random import random
app = FastAPI(
    title="HealthForecast AI",
    description="Hospital Readmission Prediction & Patient Risk Intelligence System",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------
# Load Trained Model
# -------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "readmission_model.pkl")

model = joblib.load(MODEL_PATH)
# -------------------------
# Models
# -------------------------

class User(BaseModel):
    username: str
    password: str
    role: str


class Login(BaseModel):
    username: str
    password: str


class Patient(BaseModel):
    patient_id: int
    name: str
    age: int
    gender: str
    diagnosis: str




class PredictionRequest(BaseModel):
    age: int
    gender: str
    race: str
    admissionType: str
    timeInHospital: int
    numLabProcedures: int
    numMedications: int
    diagnoses: int

# -------------------------
# Temporary Storage
# -------------------------

users = []
patients = []


# -------------------------
# Home API
# -------------------------

@app.get("/")
def home():
    return {
        "message": "HealthForecast AI Backend Running Successfully"
    }


# -------------------------
# Register API
# -------------------------

@app.post("/register")
def register(user: User):
    users.append(user)
    return {
        "message": "User Registered Successfully",
        "user": user
    }


# -------------------------
# Login API
# -------------------------

@app.post("/login")
def login(login: Login):
    for user in users:
        if user.username == login.username and user.password == login.password:
            return {
                "message": "Login Successful",
                "role": user.role
            }

    return {
        "message": "Invalid Username or Password"
    }


# -------------------------
# Add Patient API
# -------------------------

@app.post("/patients")
def add_patient(patient: Patient):
    patients.append(patient)
    return {
        "message": "Patient Added Successfully",
        "patient": patient
    }


# -------------------------
# View All Patients API
# -------------------------

@app.get("/patients")
def get_patients():
    return {
        "total_patients": len(patients),
        "patients": patients
    }
@app.put("/patients/{patient_id}")
def update_patient(patient_id: int, updated_patient: Patient):
    for index, patient in enumerate(patients):
        if patient.patient_id == patient_id:
            patients[index] = updated_patient
            return {
                "message": "Patient Updated Successfully",
                "patient": updated_patient
            }

    return {
        "message": "Patient Not Found"
    }

@app.put("/patients/{patient_id}")
def update_patient(patient_id: int, updated_patient: Patient):
    for i, patient in enumerate(patients):
        if patient.patient_id == patient_id:
            patients[i] = updated_patient
            return {
                "message": "Patient Updated Successfully",
                "patient": updated_patient
            }

    return {"message": "Patient Not Found"}


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int):
    for i, patient in enumerate(patients):
        if patient.patient_id == patient_id:
            deleted_patient = patients.pop(i)
            return {
                "message": "Patient Deleted Successfully",
                "patient": deleted_patient
            }

    return {
        "message": "Patient Not Found"
    }

# -------------------------
# Prediction API
# -------------------------

@app.post("/predict")
def predict(data: PredictionRequest):

    probability = round(random(), 2)

    if probability >= 0.5:
        prediction = "High Risk"
    else:
        prediction = "Low Risk"

    return {
        "prediction": prediction,
        "probability": probability
    }