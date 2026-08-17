import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.api.inference import InferenceService
from src.api.schemas import PatientCreateRequest, PredictionRequest, PredictionResponse, RiskFactor
from src.api.serializers import (
    api_audit_to_db,
    api_patient_to_db,
    build_patient_dict,
    db_audit_to_api,
    db_patient_to_api,
)
from src.api.analytics import build_analytics, build_treatment_outcomes
from src.api.static_data import load_model_metrics
from src.core.config import settings
from src.db.models import AuditLog, Patient
from src.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_service(request: Request) -> InferenceService:
    service: InferenceService | None = getattr(request.app.state, "service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return service


def _make_audit_log(
    user_email: str,
    user_name: str,
    user_role: str,
    action: str,
    target_patient_id: str | None,
    details: str,
) -> AuditLog:
    return AuditLog(
        id=f"log-{int(time.time() * 1000)}",
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        user_email=user_email,
        user_name=user_name,
        user_role=user_role,
        action=action,
        target_patient_id=target_patient_id,
        details=details,
    )


# --- Health / model info -----------------------------------------------------


@router.get("/api/health")
def health(request: Request):
    return {
        "status": "ok",
        "model_loaded": getattr(request.app.state, "service", None) is not None,
    }


@router.get("/api/model-info")
def model_info(request: Request):
    model = _get_service(request).model
    return {
        "model_type": type(model).__name__,
        "features_count": model.n_features_in_,
        "objective": "binary:logistic",
        "classes": ["No Readmission", "Readmission"],
    }


# --- ML inference ------------------------------------------------------------


def _run_prediction(request: Request, req: PredictionRequest) -> dict:
    try:
        return _get_service(request).predict(req.model_dump())
    except HTTPException:
        raise
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.post("/api/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest, request: Request):
    result = _run_prediction(request, req)
    return PredictionResponse(
        riskScore=result["riskScore"],
        riskTier=result["riskTier"],
        readmissionLikelihood=result["readmissionLikelihood"],
        readmissionProbability=result["readmissionProbability"],
        dischargeReadinessScore=result["dischargeReadinessScore"],
        prediction=result["prediction"],
        riskFactors=[RiskFactor(**rf) for rf in result["riskFactors"]],
        careRecommendations=result["careRecommendations"],
    )


@router.post("/api/predict-risk")
def predict_risk(req: PredictionRequest, request: Request):
    """Frontend-compatible wrapper for the risk simulator (expects {success, prediction})."""
    result = _run_prediction(request, req)
    return {"success": True, "prediction": result}


# --- Patients ----------------------------------------------------------------


@router.get("/api/patients")
def list_patients(
    request: Request,
    search: str = "",
    riskTier: str = "",
    department: str = "",
    doctorId: str = "",
    db: Session = Depends(get_db),
):
    filters = []
    if search:
        q = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(Patient.name).like(q),
                func.lower(Patient.id).like(q),
                func.lower(Patient.medical_record_number).like(q),
                func.lower(Patient.primary_diagnosis).like(q),
            )
        )
    if riskTier and riskTier != "All":
        filters.append(Patient.risk_tier == riskTier)
    if department and department != "All":
        filters.append(Patient.department == department)
    if doctorId and doctorId != "All":
        filters.append(Patient.assigned_doctor_id == doctorId)

    stmt = select(Patient)
    if filters:
        stmt = stmt.where(*filters)

    try:
        rows = db.execute(stmt).scalars().all()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to load patients")
        raise HTTPException(status_code=500, detail="Failed to load patients")

    patients = [db_patient_to_api(p) for p in rows]
    return {"patients": patients, "count": len(patients)}


@router.post("/api/patients")
def create_patient(req: PatientCreateRequest, request: Request, db: Session = Depends(get_db)):
    prediction = _run_prediction(request, req)
    patient_data = build_patient_dict(req.model_dump(), prediction)
    db_values = api_patient_to_db(patient_data)

    existing = db.get(Patient, db_values["id"])
    try:
        if existing:
            for key, value in db_values.items():
                setattr(existing, key, value)
            patient_obj = existing
            action = "Patient Record Updated"
        else:
            patient_obj = Patient(**db_values)
            db.add(patient_obj)
            action = "New Patient Intake Created"

        db.add(
            _make_audit_log(
                user_email="doctor@healthforecast.ai",
                user_name="Dr. Sarah Lin, MD",
                user_role="doctor",
                action=action,
                target_patient_id=patient_data["id"],
                details=(
                    f"Updated risk profile for {patient_data['name']} "
                    f"(Risk Score: {patient_data['riskScore']}%)"
                ),
            )
        )
        db.commit()
        db.refresh(patient_obj)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to persist patient")
        raise HTTPException(status_code=500, detail="Failed to save patient record")

    return {"success": True, "patient": db_patient_to_api(patient_obj)}


# --- Analytics / model ops ---------------------------------------------------


@router.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    return {
        "analytics": build_analytics(db),
        "treatmentOutcomes": build_treatment_outcomes(db),
    }


@router.get("/api/model-metrics")
def model_metrics():
    return {"model": load_model_metrics()}


# --- Audit logs --------------------------------------------------------------


@router.get("/api/audit-logs")
def audit_logs(db: Session = Depends(get_db)):
    try:
        rows = db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc())).scalars().all()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to load audit logs")
        raise HTTPException(status_code=500, detail="Failed to load audit logs")
    return {"logs": [db_audit_to_api(a) for a in rows]}


# --- Gemini clinical assistant ------------------------------------------------


@router.post("/api/gemini/clinical-assistant")
async def clinical_assistant(body: dict):
    if not settings.gemini_api_key:
        return JSONResponse(
            status_code=500,
            content={"error": "GEMINI_API_KEY environment variable is missing."},
        )

    try:
        from google import genai
    except ImportError:
        return JSONResponse(
            status_code=500,
            content={"error": "google-genai package is not installed in the backend."},
        )

    try:
        patient = body.get("patient")
        prompt = body.get("prompt")
        mode = body.get("mode")

        system_instruction = (
            "You are HealthForecast AI, an expert clinical decision support assistant "
            "specialized in hospital readmission prevention, endocrinology, and inpatient "
            "diabetes management based on the Diabetes 130-US Hospitals dataset standards. "
            "Provide concise, high-value clinical guidance, risk factor analysis, and "
            "evidence-based post-discharge recommendations. Always organize your advice "
            "with bullet points and clear sections."
        )

        user_message = prompt

        if mode == "care_plan" and patient:
            meds = patient.get("medications") or {}
            user_message = (
                f"Generate a targeted 30-Day Hospital Readmission Prevention & Care Plan for patient:\n"
                f"Name: {patient.get('name')}\n"
                f"Age: {patient.get('age')}, Gender: {patient.get('gender')}, Race: {patient.get('race')}\n"
                f"Primary Diagnosis: {patient.get('primaryDiagnosis')}\n"
                f"Secondary Diagnoses: {patient.get('secondaryDiagnosis1') or 'None'}, "
                f"{patient.get('secondaryDiagnosis2') or 'None'}\n"
                f"Hospital Stay: {patient.get('timeInHospital')} days | Lab Procedures: "
                f"{patient.get('numLabProcedures')} | Meds: {patient.get('numMedications')}\n"
                f"Prior Stays: {patient.get('numInpatientVisits')} Inpatient, "
                f"{patient.get('numEmergencyVisits')} ER, {patient.get('numOutpatientVisits')} Outpatient\n"
                f"Glucose Test: {patient.get('glucoseTest')}, HbA1c: {patient.get('a1cResult')}\n"
                f"Medications: Insulin ({meds.get('insulin')}), Metformin ({meds.get('metformin')})\n"
                f"AI Risk Score: {patient.get('riskScore')}% ({patient.get('riskTier')} Tier, "
                f"Likelihood: {patient.get('readmissionLikelihood')})\n\n"
                f"Include:\n"
                f"1. Primary Clinical Risk Drivers\n"
                f"2. Medication Reconciliation & Titration Strategy\n"
                f"3. Post-Discharge Follow-up Timeline (48h, 7d, 30d)\n"
                f"4. Red Flag Warnings & Early Warning Indicators for Home Health Nursing"
            )
        elif mode == "discharge_readiness" and patient:
            user_message = (
                f"Evaluate Discharge Readiness & Risk Mitigation Checklist for patient "
                f"{patient.get('name')} (Risk Score: {patient.get('riskScore')}%, "
                f"Discharge Readiness Score: {patient.get('dischargeReadinessScore')}%). "
                f"Provide a 5-step clinical clearance checklist prior to releasing the patient."
            )

        client = genai.Client(api_key=settings.gemini_api_key)
        response = await client.models.generate_content(
            model="gemini-3.6-flash",
            contents=user_message,
            config={
                "systemInstruction": system_instruction,
                "temperature": 0.2,
            },
        )

        return {"text": response.text}
    except Exception as err:
        logger.exception("Gemini API error")
        return JSONResponse(
            status_code=500,
            content={"error": str(err) or "Failed to generate clinical insights with Gemini"},
        )
