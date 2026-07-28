from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from app.models.patient import Patient
from app.models.audit import AuditLog
from app.models.prediction import Prediction
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None
):
    query = {}
    if search:
        query = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"patient_id": {"$regex": search, "$options": "i"}}
        ]}
    return await Patient.find(query).skip(skip).limit(limit).to_list()

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    patient = await Patient.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/", response_model=PatientResponse)
async def create_patient(patient_data: PatientCreate):
    existing = await Patient.find_one({"patient_id": patient_data.patient_id})
    if existing:
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    
    patient = Patient(**patient_data.dict())
    await patient.insert()
    
    await AuditLog(
        user_id="system",
        action="create_patient",
        resource="patient",
        details={"patient_id": patient.patient_id}
    ).insert()
    
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, patient_data: PatientUpdate):
    patient = await Patient.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in patient_data.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    patient.updated_at = datetime.utcnow()
    await patient.save()
    return patient

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    patient = await Patient.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await patient.delete()
    return {"message": "Patient deleted successfully"}

@router.post("/{patient_id}/predict")
async def predict_risk(patient_id: str):
    patient = await Patient.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # REMOVED await - predict_risk is now a regular function
    prediction = prediction_service.predict_risk(patient)
    
    # Update patient with risk score
    patient.risk_score = prediction['risk_score']
    patient.risk_category = prediction['risk_category']
    await patient.save()
    
    # Create prediction record
    pred = Prediction(
        patient_id=patient_id,
        risk_score=prediction['risk_score'],
        readmission_probability=prediction['readmission_probability'],
        risk_category=prediction['risk_category'],
        predicted_readmission=prediction['predicted_readmission'],
        feature_values=prediction.get('feature_values', {}),
        doctor_id=prediction.get('doctor_id')
    )
    await pred.insert()
    
    return prediction