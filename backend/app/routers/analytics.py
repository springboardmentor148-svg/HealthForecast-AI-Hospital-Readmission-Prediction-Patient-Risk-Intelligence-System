from functools import lru_cache
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.db_models import User, Patient, RiskAssessment

router = APIRouter(prefix="/analytics", tags=["Healthcare Analytics Dashboard"])

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_dataset.csv"


@lru_cache(maxsize=1)
def _dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["readmitted_flag"] = df["readmitted"].map({"<30": 1, ">30": 0, "NO": 0})
    return df


@router.get("/population-insights")
def population_insights(current_user: User = Depends(get_current_user)):
    """Hospital-wide trends derived from the historical Diabetes 130-US
    Hospitals dataset used to train the model. Available to every role;
    researchers and admins see this as their primary population view."""
    df = _dataset()

    by_age = (
        df.groupby("age")["readmitted_flag"].mean().mul(100).round(2).sort_index()
    )
    by_admission_type = (
        df.groupby("admission_type_id")["readmitted_flag"].mean().mul(100).round(2)
    )
    time_in_hospital_vs_readmit = (
        df.groupby("time_in_hospital")["readmitted_flag"].mean().mul(100).round(2)
    )
    readmit_counts = df["readmitted"].value_counts().to_dict()
    num_meds_bucket = pd.cut(
        df["num_medications"], bins=[0, 5, 10, 15, 20, 100],
        labels=["1-5", "6-10", "11-15", "16-20", "21+"]
    )
    by_med_count = (
        df.groupby(num_meds_bucket, observed=True)["readmitted_flag"]
        .mean().mul(100).round(2)
    )

    return {
        "total_encounters": int(len(df)),
        "overall_readmission_rate": round(float(df["readmitted_flag"].mean()) * 100, 2),
        "readmission_breakdown": readmit_counts,
        "readmission_rate_by_age": [
            {"label": k, "rate": v} for k, v in by_age.items()
        ],
        "readmission_rate_by_admission_type": [
            {"label": f"Type {int(k)}", "rate": v} for k, v in by_admission_type.items()
        ],
        "readmission_rate_by_length_of_stay": [
            {"label": f"{int(k)}d", "rate": v} for k, v in time_in_hospital_vs_readmit.items()
        ],
        "readmission_rate_by_medication_count": [
            {"label": str(k), "rate": v} for k, v in by_med_count.items()
        ],
    }


@router.get("/hospital-overview")
def hospital_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Live operational metrics computed from patients/predictions recorded
    in the platform (as opposed to the historical training dataset)."""
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_assessments = db.query(func.count(RiskAssessment.id)).scalar() or 0

    risk_dist_rows = (
        db.query(RiskAssessment.risk_category, func.count(RiskAssessment.id))
        .group_by(RiskAssessment.risk_category)
        .all()
    )
    risk_distribution = {cat: count for cat, count in risk_dist_rows}

    avg_prob = db.query(func.avg(RiskAssessment.readmission_probability)).scalar()

    doctors_count = db.query(func.count(User.id)).filter(User.role == "doctor").scalar() or 0

    return {
        "total_patients": total_patients,
        "total_risk_assessments": total_assessments,
        "average_readmission_probability": round(float(avg_prob), 4) if avg_prob else 0.0,
        "risk_distribution": risk_distribution,
        "active_doctors": doctors_count,
    }
