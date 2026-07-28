from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.services.report_service import ReportService
from app.services.prediction_service import PredictionService
from app.models.patient import Patient
from app.api.auth import get_current_user

router = APIRouter()
report_service = ReportService()
prediction_service = PredictionService()

@router.post("/generate/pdf")
async def generate_pdf_report(current_user = Depends(get_current_user)):
    """Generate PDF report"""
    try:
        patients = await Patient.find().to_list()
        predictions = []
        for patient in patients:
            pred = prediction_service.predict_risk(patient)
            predictions.append(pred)
        
        data = {
            'summary': {
                'total_patients': len(patients),
                'high_risk_patients': sum(1 for p in predictions if p['risk_category'] == 'High'),
                'average_risk_score': sum(p['risk_score'] for p in predictions) / len(predictions) if predictions else 0
            },
            'patients': [
                {
                    'patient_id': p.patient_id,
                    'name': p.name,
                    'age': p.age,
                    'gender': p.gender,
                    'risk_score': pred['risk_score'],
                    'risk_category': pred['risk_category'],
                    'last_admission': p.last_admission
                }
                for p, pred in zip(patients, predictions)
            ]
        }
        
        filename = await report_service.generate_pdf_report(data, "Patient Risk Assessment")
        return {"message": "PDF Report generated successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/excel")
async def generate_excel_report(current_user = Depends(get_current_user)):
    """Generate Excel report"""
    try:
        patients = await Patient.find().to_list()
        predictions = []
        for patient in patients:
            pred = prediction_service.predict_risk(patient)
            predictions.append(pred)
        
        data = {
            'summary': {
                'total_patients': len(patients),
                'high_risk_patients': sum(1 for p in predictions if p['risk_category'] == 'High'),
                'average_risk_score': sum(p['risk_score'] for p in predictions) / len(predictions) if predictions else 0
            },
            'patients': [
                {
                    'patient_id': p.patient_id,
                    'name': p.name,
                    'age': p.age,
                    'gender': p.gender,
                    'risk_score': pred['risk_score'],
                    'risk_category': pred['risk_category'],
                    'last_admission': p.last_admission
                }
                for p, pred in zip(patients, predictions)
            ]
        }
        
        filename = await report_service.generate_excel_report(data)
        return {"message": "Excel Report generated successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))