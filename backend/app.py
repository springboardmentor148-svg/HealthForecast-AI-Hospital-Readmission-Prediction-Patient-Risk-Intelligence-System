from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import PatientData
from predict import predict_readmission

from fastapi import Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import UserRegister
from crud import create_user
from crud import get_user_by_email

from schemas import UserLogin
from crud import authenticate_user
from auth import create_access_token
from fastapi import HTTPException

from dependencies import get_current_user
from models import User

from schemas import PredictionResponse
from typing import List

from audit import create_log

from schemas import PatientCreate
from schemas import PatientResponse
from schemas import PatientUpdate

from crud_patient import (
    get_all_patients,
    get_patient_by_id,
    create_patient,
    update_patient,
    delete_patient
)

app = FastAPI(
    title="HealthForecast AI API",
    description="Hospital Readmission Prediction System",
    version="1.0"
)

# Allow Frontend Connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Later we'll change this to React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to HealthForecast AI Backend",
        "status": "Running Successfully"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }


from crud_prediction import save_prediction


@app.post("/predict")
def predict(
    patient: PatientData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    result = predict_readmission(patient)

    save_prediction(
        db=db,
        patient_id=1,   # Temporary, we'll connect real patients later
        predicted_class=result["prediction"],
        probability=result["probability_readmitted"],
        confidence=result["confidence"],
        recommendation="\n".join(result["recommendation"]),
        predicted_by=current_user.id,
        risk_level=result["risk_level"]
    )

    create_log(
    db,
    current_user.id,
    "Created Prediction"
    )   

    return {
        "predicted_by": current_user.full_name,
        "result": result
    }


@app.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    existing = get_user_by_email(
        db,
        user.email
    )

    if existing:
        return {
            "message": "Email already exists"
        }

    new_user = create_user(
        db,
        user
    )

    return {
        "message": "User Registered Successfully",
        "user_id": new_user.id
    }

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = authenticate_user(
        db,
        user.email,
        user.password
    )

    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    create_log(
    db,
    db_user.id,
    "User Logged In"
    )

    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role
    }

@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {

        "id": current_user.id,

        "name": current_user.full_name,

        "email": current_user.email,

        "role": current_user.role

    }

from crud_prediction import get_all_predictions


@app.get(
    "/predictions",
    response_model=List[PredictionResponse]
)
def get_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    predictions = get_all_predictions(db)

    result = []

    for p in predictions:

        result.append({

            "prediction_id": p.prediction_id,

            "patient_id": p.patient_id,

            "predicted_class": p.predicted_class,

            "risk_level": p.risk_level,

            "probability": float(p.probability),

            "confidence": p.confidence,

            "recommendation": p.recommendation.split("\n"),

            "predicted_by": p.user.full_name,

            "prediction_time": p.prediction_time

        })

    return result

from dashboard import get_dashboard_stats

@app.get("/dashboard")
def dashboard(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    return get_dashboard_stats(db)


# ======================================================
# Patients APIs
# ======================================================

from fastapi import HTTPException

@app.get(
    "/patients",
    response_model=list[PatientResponse]
)
def get_patients(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    return get_all_patients(db)


@app.get(
    "/patients/{patient_id}",
    response_model=PatientResponse
)
def get_patient(

    patient_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    patient = get_patient_by_id(

        db,

        patient_id

    )

    if patient is None:

        raise HTTPException(

            status_code=404,

            detail="Patient not found"

        )

    return patient


@app.post(
    "/patients",
    response_model=PatientResponse
)
def add_patient(

    patient: PatientCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    return create_patient(

        db,

        patient,

        current_user.id

    )


@app.put(
    "/patients/{patient_id}",
    response_model=PatientResponse
)
def edit_patient(

    patient_id: int,

    patient: PatientUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    updated = update_patient(

        db,

        patient_id,

        patient.dict(exclude_unset=True)

    )

    if updated is None:

        raise HTTPException(

            status_code=404,

            detail="Patient not found"

        )

    return updated


@app.delete("/patients/{patient_id}")
def remove_patient(

    patient_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    deleted = delete_patient(

        db,

        patient_id

    )

    if not deleted:

        raise HTTPException(

            status_code=404,

            detail="Patient not found"

        )

    return {

        "message": "Patient deleted successfully"

    }
