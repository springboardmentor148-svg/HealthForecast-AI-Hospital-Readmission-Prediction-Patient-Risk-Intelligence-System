from fastapi import APIRouter, HTTPException
from app.services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()

@router.post("/risk/{patient_id}")
async def predict_risk(patient_id: str):
    from app.models.patient import Patient
    patient = await Patient.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await prediction_service.predict_risk(patient)