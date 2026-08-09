from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import CareRecommendation, Patient, User
from schemas import CareRecommendationResponse
from auth_utils import get_current_user

router = APIRouter(prefix="/care-recommendations", tags=["Care Recommendations"])


def _resolve_patient_db_id(patient_id: str) -> int:
    raw_id = patient_id.upper().replace("PT-", "") if patient_id.upper().startswith("PT-") else patient_id
    try:
        numeric_id = int(raw_id)
        if patient_id.upper().startswith("PT-"):
            numeric_id -= 1000
        return numeric_id
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid patient ID format")


def _generate_recommendation_text(patient: Patient) -> tuple[str, str]:
    """
    Simple rule-based recommendation generator based on risk level + condition.
    Returns (recommendation_text, follow_up_label).
    """
    condition = (patient.condition or "").lower()

    if "diabet" in condition:
        text = (
            "Schedule follow-up within 7 days of discharge. Monitor blood glucose "
            "levels twice daily and reinforce dietary counseling."
        )
        follow_up = "7-day follow-up"
    elif "cardiac" in condition or "heart" in condition:
        text = (
            "Recommend cardiac rehabilitation referral. Weekly weight monitoring "
            "to detect fluid retention early."
        )
        follow_up = "14-day follow-up"
    elif "respiratory" in condition or "asthma" in condition or "copd" in condition:
        text = (
            "Ensure inhaler technique review before discharge. Schedule pulmonary "
            "follow-up and monitor oxygen saturation trends."
        )
        follow_up = "10-day follow-up"
    else:
        text = (
            "Based on recent readmission risk score, recommend close post-discharge "
            "monitoring, medication reconciliation, and a follow-up appointment within 10 days."
        )
        follow_up = "10-day follow-up"

    return text, follow_up


@router.get("", response_model=List[CareRecommendationResponse])
def get_care_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # High-risk assigned patients dikhate hai (dummy data ke pattern ke hisaab se)
    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id == current_user.id, Patient.risk_level == "High")
        .all()
    )

    results = []
    for p in patients:
        rec = (
            db.query(CareRecommendation)
            .filter(CareRecommendation.patient_id == p.id)
            .first()
        )
        results.append(
            CareRecommendationResponse(
                id=f"PT-{1000 + p.id}",
                name=p.name,
                riskLevel=p.risk_level,
                recommendation=rec.recommendation if rec else None,
                followUp=rec.follow_up if rec else None,
                status=rec.status if rec else "Not Generated",
            )
        )
    return results


@router.post("/{patient_id}/generate", response_model=CareRecommendationResponse)
def generate_recommendation(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient_id = _resolve_patient_db_id(patient_id)
    patient = db.query(Patient).filter(
        Patient.id == db_patient_id, Patient.doctor_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    text, follow_up = _generate_recommendation_text(patient)

    rec = db.query(CareRecommendation).filter(CareRecommendation.patient_id == patient.id).first()
    if rec:
        rec.recommendation = text
        rec.follow_up = follow_up
        rec.status = "Pending"
    else:
        rec = CareRecommendation(
            doctor_id=current_user.id,
            patient_id=patient.id,
            recommendation=text,
            follow_up=follow_up,
            status="Pending",
        )
        db.add(rec)

    db.commit()
    db.refresh(rec)

    return CareRecommendationResponse(
        id=f"PT-{1000 + patient.id}",
        name=patient.name,
        riskLevel=patient.risk_level,
        recommendation=rec.recommendation,
        followUp=rec.follow_up,
        status=rec.status,
    )


@router.patch("/{patient_id}/review", response_model=CareRecommendationResponse)
def mark_reviewed(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient_id = _resolve_patient_db_id(patient_id)
    patient = db.query(Patient).filter(
        Patient.id == db_patient_id, Patient.doctor_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    rec = db.query(CareRecommendation).filter(CareRecommendation.patient_id == patient.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="No recommendation found for this patient")

    rec.status = "Reviewed"
    db.commit()
    db.refresh(rec)

    return CareRecommendationResponse(
        id=f"PT-{1000 + patient.id}",
        name=patient.name,
        riskLevel=patient.risk_level,
        recommendation=rec.recommendation,
        followUp=rec.follow_up,
        status=rec.status,
    )