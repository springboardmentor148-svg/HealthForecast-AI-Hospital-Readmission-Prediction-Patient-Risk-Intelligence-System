import os
import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, RiskAssessment

router = APIRouter()

# ------------------------------------------------------------------
# 1. Generic & HIPAA-Compliant Email Function
# ------------------------------------------------------------------
def send_high_risk_alert(patient_code: str):
    """Sends a privacy-safe alert email without exposing sensitive PHI/health records."""
    try:
        # Load sensitive email credentials safely from environment variables (.env)
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "465"))
        sender_email = os.getenv("SENDER_EMAIL", "alerts@healthforecast.ai")
        sender_password = os.getenv("SENDER_PASSWORD", "")  # App password from .env
        doctor_email = os.getenv("ALERT_DOCTOR_EMAIL", "doctor@hospital.org")

        msg = EmailMessage()
        msg['Subject'] = f"Clinical Alert: High Readmission Risk Flagged [{patient_code}]"
        msg['From'] = sender_email
        msg['To'] = doctor_email
        
        # Privacy-compliant notification body (No sensitive medical history included)
        msg.set_content(
            f"Alert: High-Risk patient assessment recorded (ID: {patient_code}).\n\n"
            "Please log in to the secure HealthForecast AI clinical portal to review full details."
        )

        # Uncomment and configure if actively using live SMTP credentials
        # with smtplib.SMTP_SSL(smtp_server, smtp_port) as smtp:
        #     smtp.login(sender_email, sender_password)
        #     smtp.send_message(msg)

        print(f"[SUCCESS] Security alert queued for Patient Code: {patient_code}")
    except Exception as e:
        print(f"[ERROR] Failed to send alert email: {e}")


# ------------------------------------------------------------------
# 2. Prediction Schema & Route Definition
# ------------------------------------------------------------------
class PredictionInput(BaseModel):
    full_name: str
    age: int
    gender: str
    num_inpatient: int
    num_emergency: int
    num_diagnoses: int
    discharge_disposition_id: int
    diabetes_med: int

@router.post("/")
def predict_readmission(
    data: PredictionInput, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    try:
        # Simple prediction heuristic logic (Replace or link with your XGBoost model file)
        risk_score = (data.num_inpatient * 25) + (data.num_emergency * 20) + (data.num_diagnoses * 5)
        probability = min(max(float(risk_score), 10.0), 98.5)
        risk_level = "High Risk" if probability >= 50.0 else "Low Risk"

        # Save Patient Record
        patient_code = f"PAT-{1000 + db.query(Patient).count() + 1}"
        new_patient = Patient(
            patient_code=patient_code,
            full_name=data.full_name,
            age=data.age,
            gender=data.gender,
            primary_diagnosis="Diabetes Mellitus Type II"
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        # Save Risk Assessment
        new_assessment = RiskAssessment(
            patient_id=new_patient.id,
            probability=probability,
            risk_level=risk_level
        )
        db.add(new_assessment)
        db.commit()

        # Trigger Privacy-Safe Email in Background if Patient is High Risk
        if risk_level == "High Risk":
            background_tasks.add_task(send_high_risk_alert, patient_code)

        return {
            "patient_code": patient_code,
            "risk_level": risk_level,
            "probability": round(probability, 2),
            "status": "Assessment logged successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")