from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..core.deps import get_current_user, require_roles
from ..models.db_models import User, Patient, RiskAssessment
from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..schemas.patient import RiskAssessmentOut
from ..ml.predictor import ReadmissionPredictor

router = APIRouter(prefix="/predictions", tags=["Risk Prediction & Clinical Decision Support"])


@router.post("/predict", response_model=PredictionResponse)
def predict_readmission(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("doctor", "hospital_administrator", "system_admin")
    ),
):
    predictor = ReadmissionPredictor.get()
    features_dict = payload.features.model_dump(by_alias=True)
    result = predictor.predict(features_dict)

    if payload.patient_id:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        if current_user.role == "doctor" and patient.attending_doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Patient outside assigned scope")

        assessment = RiskAssessment(
            patient_id=patient.id,
            readmission_probability=result["readmission_probability"],
            risk_category=result["risk_category"],
            input_snapshot=features_dict,
            recommendations=result["recommendations"],
            created_by_id=current_user.id,
        )
        db.add(assessment)
        db.commit()

    return PredictionResponse(**result)


@router.get("/history/{patient_id}", response_model=list[RiskAssessmentOut])
def prediction_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "doctor" and patient.attending_doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Patient outside assigned scope")

    return (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == patient_id)
        .order_by(desc(RiskAssessment.created_at))
        .all()
    )
