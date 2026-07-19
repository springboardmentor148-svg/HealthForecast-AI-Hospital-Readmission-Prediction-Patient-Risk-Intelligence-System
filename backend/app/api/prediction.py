from fastapi import APIRouter, HTTPException

from app.schemas.prediction_schema import PredictionRequest
from app.services.prediction_service import predict_readmission


# Prediction router
router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"]
)


# Predict hospital readmission
@router.post("/predict")
def predict(patient_data: PredictionRequest):
    try:
        result = predict_readmission(patient_data)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )