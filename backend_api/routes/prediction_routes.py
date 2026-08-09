from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Prediction, User
from schemas import PredictionCreate, PredictionResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("", response_model=PredictionResponse)
def save_prediction(
    payload: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_prediction = Prediction(
        doctor_id=current_user.id,
        patient_name=payload.patientName,
        prediction=payload.prediction,
        result=payload.result,
        confidence=payload.confidence,
        risk_level=payload.riskLevel,
        message=payload.message,
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return PredictionResponse(
        id=new_prediction.id,
        patientName=new_prediction.patient_name,
        prediction=new_prediction.prediction,
        result=new_prediction.result,
        confidence=new_prediction.confidence,
        riskLevel=new_prediction.risk_level,
        message=new_prediction.message,
        createdAt=new_prediction.created_at,
    )

@router.get("", response_model=List[PredictionResponse])
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    return [
        PredictionResponse(
            id=p.id,
            patientName=p.patient_name,
            prediction=p.prediction,
            result=p.result,
            confidence=p.confidence,
            riskLevel=p.risk_level,
            message=p.message,
            createdAt=p.created_at,
        )
        for p in predictions
    ]