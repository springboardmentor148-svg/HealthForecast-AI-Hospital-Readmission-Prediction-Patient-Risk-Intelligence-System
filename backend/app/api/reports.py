import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient, RiskAssessment

router = APIRouter()

@router.get("/download-csv")
def download_patient_report(db: Session = Depends(get_db)):
    """Generate real-time CSV download directly from live SQLite database."""
    try:
        assessments = (
            db.query(RiskAssessment, Patient)
            .join(Patient, RiskAssessment.patient_id == Patient.id)
            .order_by(RiskAssessment.id.desc())
            .all()
        )

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Assessment ID", 
            "Patient Code", 
            "Full Name", 
            "Age", 
            "Gender", 
            "Risk Level", 
            "Readmission Probability (%)", 
            "Date Generated"
        ])

        for assessment, patient in assessments:
            created_str = (
                assessment.created_at.strftime("%Y-%m-%d %H:%M:%S") 
                if hasattr(assessment, "created_at") and assessment.created_at 
                else "N/A"
            )
            writer.writerow([
                assessment.id,
                patient.patient_code,
                patient.full_name,
                patient.age,
                patient.gender,
                assessment.risk_level,
                f"{assessment.probability}%",
                created_str
            ])

        response_content = output.getvalue()
        output.close()

        return Response(
            content=response_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=patient_readmission_report.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV report: {str(e)}")