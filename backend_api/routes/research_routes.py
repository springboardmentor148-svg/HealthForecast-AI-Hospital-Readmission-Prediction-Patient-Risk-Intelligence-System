import csv
import io
from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import User, Patient, Prediction, Treatment, ExportLog
from auth_utils import get_current_user

router = APIRouter(prefix="/research", tags=["Healthcare Researcher"])


# ============================================================
# ACCESS CONTROL + SHARED HELPERS
# ============================================================

def require_researcher(current_user: User = Depends(get_current_user)) -> User:
    """Sirf Healthcare Researcher role wale users ko allow karega."""
    if current_user.user_role != "Healthcare Researcher":
        raise HTTPException(status_code=403, detail="Not authorized — Researcher access required")
    return current_user


def get_hospital_doctor_ids(db: Session, researcher: User) -> list[int]:
    """
    Researcher ke hospital ke saare Doctors ki id list.
    Hospital Admin route jaisa hi case-insensitive + trimmed match pattern.
    """
    normalized_hospital = researcher.hospital_name.strip().lower()
    doctors = (
        db.query(User)
        .filter(
            func.lower(func.trim(User.hospital_name)) == normalized_hospital,
            User.user_role == "Doctor",
        )
        .all()
    )
    return [d.id for d in doctors]


def _parse_percent(value) -> float:
    """'91%' jaisi string se number nikalta hai. Fail hone par 0 return karta hai."""
    try:
        return float(str(value).replace("%", "").strip())
    except (ValueError, TypeError):
        return 0.0


def _age_bucket(age: int) -> str:
    if age < 35:
        return "18-34"
    if age < 50:
        return "35-49"
    if age < 65:
        return "50-64"
    if age < 80:
        return "65-79"
    return "80+"


# ============================================================
# POPULATION HEALTH  →  GET /research/population-stats
# ============================================================

@router.get("/population-stats")
def get_population_stats(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    doctor_ids = get_hospital_doctor_ids(db, researcher)
    patients = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )

    total_records = len(patients)

    # ---- condition breakdown ----
    condition_groups = defaultdict(list)
    for p in patients:
        condition_groups[p.condition].append(p)

    condition_breakdown = []
    for condition, group in condition_groups.items():
        readmit_probs = [_parse_percent(p.readmission_probability) for p in group if p.readmission_probability]
        avg_readmit = sum(readmit_probs) / len(readmit_probs) if readmit_probs else 0.0
        condition_breakdown.append({
            "condition": condition,
            "records": len(group),
            "avgReadmission": f"{avg_readmit:.1f}%",
        })
    condition_breakdown.sort(key=lambda x: x["records"], reverse=True)

    # chronic condition records — diabetes/hypertension/heart/kidney/copd jaisi conditions count karo
    chronic_keywords = ["diabet", "hypertension", "heart", "kidney", "copd", "chronic"]
    chronic_count = sum(
        1 for p in patients if any(k in (p.condition or "").lower() for k in chronic_keywords)
    )

    # ---- age group breakdown ----
    age_groups = defaultdict(list)
    for p in patients:
        age_groups[_age_bucket(p.age)].append(p)

    age_order = ["18-34", "35-49", "50-64", "65-79", "80+"]
    age_group_breakdown = []
    for bucket in age_order:
        group = age_groups.get(bucket, [])
        readmit_probs = [_parse_percent(p.readmission_probability) for p in group if p.readmission_probability]
        avg_readmit = sum(readmit_probs) / len(readmit_probs) if readmit_probs else 0.0
        age_group_breakdown.append({
            "ageGroup": bucket,
            "records": len(group),
            "readmissionRate": f"{avg_readmit:.1f}%",
        })

    # sabse zyada records wala age bucket "average age group" ke liye
    avg_age_group = max(age_group_breakdown, key=lambda x: x["records"])["ageGroup"] if patients else "N/A"

    return {
        "totalAnonymizedRecords": total_records,
        "chronicConditionRecords": chronic_count,
        "avgAgeGroup": avg_age_group,
        "conditionBreakdown": condition_breakdown,
        "ageGroupBreakdown": age_group_breakdown,
    }


# ============================================================
# RISK & READMISSION TRENDS  →  GET /research/risk-trends
# ============================================================

@router.get("/risk-trends")
def get_risk_trends(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    doctor_ids = get_hospital_doctor_ids(db, researcher)
    predictions = (
        db.query(Prediction)
        .filter(Prediction.doctor_id.in_(doctor_ids))
        .order_by(Prediction.created_at.asc())
        .all()
        if doctor_ids else []
    )

    total = len(predictions)
    high_risk_count = sum(1 for p in predictions if p.risk_level == "High")
    high_risk_share = (high_risk_count / total * 100) if total else 0.0
    avg_confidence = (
        sum(_parse_percent(p.confidence) for p in predictions) / total if total else 0.0
    )
    # readmission-probability proxy: prediction == 1 (readmission) ka % share
    readmit_count = sum(1 for p in predictions if p.prediction == 1)
    avg_readmit_prob = (readmit_count / total * 100) if total else 0.0

    # ---- monthly breakdown (last 6 months jitna data available hai) ----
    monthly = defaultdict(list)
    for p in predictions:
        if p.created_at:
            key = p.created_at.strftime("%b %Y")
            monthly[key].append(p)

    monthly_trend = []
    prev_high_share = None
    for month_label, group in monthly.items():
        m_total = len(group)
        m_high = sum(1 for p in group if p.risk_level == "High")
        m_high_share = (m_high / m_total * 100) if m_total else 0.0
        m_readmit = sum(1 for p in group if p.prediction == 1)
        m_avg_risk = (m_readmit / m_total * 100) if m_total else 0.0

        trend = "up" if (prev_high_share is not None and m_high_share >= prev_high_share) else "down"
        prev_high_share = m_high_share

        monthly_trend.append({
            "month": month_label,
            "avgRisk": f"{m_avg_risk:.1f}%",
            "highRiskShare": f"{m_high_share:.1f}%",
            "trend": trend,
        })

    return {
        "recordsScored": total,
        "highRiskShare": f"{high_risk_share:.1f}%",
        "avgReadmissionProbability": f"{avg_readmit_prob:.1f}%",
        "avgModelConfidence": f"{avg_confidence:.1f}%",
        "monthlyTrend": monthly_trend,
    }


# ============================================================
# TREATMENT ANALYSIS  →  GET /research/treatment-analysis
# ============================================================

EFFECTIVENESS_SCORE = {"Good": 100, "Moderate": 60, "Poor": 20}


@router.get("/treatment-analysis")
def get_treatment_analysis(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    doctor_ids = get_hospital_doctor_ids(db, researcher)
    records = (
        db.query(Treatment, Patient)
        .join(Patient, Treatment.patient_id == Patient.id)
        .filter(Treatment.doctor_id.in_(doctor_ids))
        .all()
        if doctor_ids else []
    )

    groups = defaultdict(list)
    for t, p in records:
        groups[t.treatment_plan].append((t, p))

    effectiveness_by_treatment = []
    readmission_trends = []

    for treatment_name, group in groups.items():
        cohort_size = len(group)
        avg_score = sum(EFFECTIVENESS_SCORE.get(t.effectiveness, 0) for t, _ in group) / cohort_size

        effectiveness_by_treatment.append({
            "treatment": treatment_name,
            "effectiveness": round(avg_score, 1),
        })

        # readmission rate: is treatment ke patients me se kitno ki latest prediction "Readmission" thi
        patient_ids = [p.id for _, p in group]
        preds = (
            db.query(Prediction)
            .filter(Prediction.doctor_id.in_(doctor_ids))
            .all()
        )
        # patient_name match best-effort (koi direct FK Prediction->Patient nahi hai)
        matched = [pr for pr in preds if pr.patient_name and any(
            pr.patient_name.strip().lower() == p.name.strip().lower() for _, p in group
        )]
        readmit_rate = (
            sum(1 for pr in matched if pr.result == "Readmission") / len(matched) * 100
            if matched else 0.0
        )

        declining_count = sum(1 for t, _ in group if t.recovery_trend == "Declining")
        direction = "up" if declining_count > cohort_size / 2 else "down"

        readmission_trends.append({
            "treatment": treatment_name,
            "cohortSize": cohort_size,
            "readmissionRate": f"{readmit_rate:.1f}%",
            "direction": direction,
        })

    total_treatments = len(records)
    overall_avg_effectiveness = (
        sum(e["effectiveness"] for e in effectiveness_by_treatment) / len(effectiveness_by_treatment)
        if effectiveness_by_treatment else 0.0
    )

    return {
        "treatmentsAnalyzed": len(groups),
        "avgEffectiveness": f"{overall_avg_effectiveness:.1f}%",
        "medicationsTracked": len(groups),
        "totalRecordsAnalyzed": total_treatments,
        "effectivenessByTreatment": effectiveness_by_treatment,
        "readmissionTrends": readmission_trends,
    }


# ============================================================
# OVERVIEW  →  GET /research/overview-stats
# ============================================================

@router.get("/overview-stats")
def get_overview_stats(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    doctor_ids = get_hospital_doctor_ids(db, researcher)

    total_records = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).count()
        if doctor_ids else 0
    )

    treatments = (
        db.query(Treatment).filter(Treatment.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )
    distinct_treatment_names = {t.treatment_plan for t in treatments}
    active_studies = len(distinct_treatment_names)  # proxy: distinct treatment plans being tracked

    avg_effectiveness = (
        sum(EFFECTIVENESS_SCORE.get(t.effectiveness, 0) for t in treatments) / len(treatments)
        if treatments else 0.0
    )

    exports_count = (
        db.query(ExportLog).filter(ExportLog.researcher_id == researcher.id).count()
    )

    # treatment effectiveness table (Overview page ke liye, group by treatment_plan)
    groups = defaultdict(list)
    for t in treatments:
        groups[t.treatment_plan].append(t)

    treatment_table = []
    for name, group in groups.items():
        score = sum(EFFECTIVENESS_SCORE.get(t.effectiveness, 0) for t in group) / len(group)
        treatment_table.append({
            "treatment": name,
            "cohortSize": len(group),
            "effectiveness": f"{score:.0f}%",
        })
    treatment_table.sort(key=lambda x: x["cohortSize"], reverse=True)

    return {
        "anonymizedRecords": total_records,
        "activeStudies": active_studies,
        "avgTreatmentEffectiveness": f"{avg_effectiveness:.1f}%",
        "datasetsExported": exports_count,
        "treatmentEffectiveness": treatment_table[:5],
    }


# ============================================================
# DATASET EXPORT
# ============================================================

DATASET_DEFINITIONS = {
    "patient-demographics": "Anonymized Patient Demographics",
    "readmission-trends": "Readmission Trend Data",
    "treatment-effectiveness": "Treatment Effectiveness Aggregates",
    "population-health": "Population Health Statistics",
}


@router.get("/datasets")
def list_available_datasets(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    doctor_ids = get_hospital_doctor_ids(db, researcher)

    patient_count = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).count() if doctor_ids else 0
    )
    prediction_count = (
        db.query(Prediction).filter(Prediction.doctor_id.in_(doctor_ids)).count() if doctor_ids else 0
    )
    treatment_count = (
        db.query(Treatment).filter(Treatment.doctor_id.in_(doctor_ids)).count() if doctor_ids else 0
    )

    record_counts = {
        "patient-demographics": patient_count,
        "readmission-trends": prediction_count,
        "treatment-effectiveness": treatment_count,
        "population-health": patient_count,
    }

    exports_this_month_count = (
        db.query(ExportLog)
        .filter(
            ExportLog.researcher_id == researcher.id,
            func.strftime("%Y-%m", ExportLog.created_at) == datetime.utcnow().strftime("%Y-%m"),
        )
        .count()
    )
    last_export = (
        db.query(ExportLog)
        .filter(ExportLog.researcher_id == researcher.id)
        .order_by(ExportLog.created_at.desc())
        .first()
    )
    total_exports = db.query(ExportLog).filter(ExportLog.researcher_id == researcher.id).count()

    return {
        "stats": {
            "availableDatasets": len(DATASET_DEFINITIONS),
            "exportsThisMonth": exports_this_month_count,
            "lastExport": last_export.created_at.strftime("%d %b %Y") if last_export else "—",
            "successfulExports": "100%" if total_exports else "N/A",
        },
        "datasets": [
            {
                "id": key,
                "name": name,
                "records": record_counts.get(key, 0),
                "format": "CSV",
            }
            for key, name in DATASET_DEFINITIONS.items()
        ],
    }


def _build_csv(dataset_key: str, db: Session, doctor_ids: list[int]) -> tuple[io.StringIO, int, str]:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    record_count = 0
    dataset_name = DATASET_DEFINITIONS.get(dataset_key)

    if dataset_key == "patient-demographics":
        writer.writerow(["Patient ID", "Age", "Gender", "Condition", "Risk Level"])
        patients = db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).all() if doctor_ids else []
        for p in patients:
            writer.writerow([f"PT-{1000 + p.id}", p.age, p.gender, p.condition, p.risk_level])
        record_count = len(patients)

    elif dataset_key == "readmission-trends":
        writer.writerow(["Date", "Result", "Confidence", "Risk Level"])
        preds = db.query(Prediction).filter(Prediction.doctor_id.in_(doctor_ids)).all() if doctor_ids else []
        for pr in preds:
            writer.writerow([
                pr.created_at.strftime("%Y-%m-%d") if pr.created_at else "",
                pr.result, pr.confidence, pr.risk_level,
            ])
        record_count = len(preds)

    elif dataset_key == "treatment-effectiveness":
        writer.writerow(["Treatment Plan", "Effectiveness", "Recovery Trend", "Adherence"])
        treatments = db.query(Treatment).filter(Treatment.doctor_id.in_(doctor_ids)).all() if doctor_ids else []
        for t in treatments:
            writer.writerow([t.treatment_plan, t.effectiveness, t.recovery_trend, t.adherence or ""])
        record_count = len(treatments)

    elif dataset_key == "population-health":
        writer.writerow(["Condition", "Age Group", "Risk Level", "Readmission Probability"])
        patients = db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).all() if doctor_ids else []
        for p in patients:
            writer.writerow([p.condition, _age_bucket(p.age), p.risk_level, p.readmission_probability or ""])
        record_count = len(patients)

    else:
        raise HTTPException(status_code=404, detail="Unknown dataset")

    buffer.seek(0)
    return buffer, record_count, dataset_name


@router.get("/export/{dataset_key}")
def export_dataset(
    dataset_key: str,
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    if dataset_key not in DATASET_DEFINITIONS:
        raise HTTPException(status_code=404, detail="Unknown dataset")

    doctor_ids = get_hospital_doctor_ids(db, researcher)
    buffer, record_count, dataset_name = _build_csv(dataset_key, db, doctor_ids)

    log = ExportLog(
        researcher_id=researcher.id,
        dataset_key=dataset_key,
        dataset_name=dataset_name,
        format="csv",
        record_count=record_count,
    )
    db.add(log)
    db.commit()

    filename = f"{dataset_key}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export-history")
def get_export_history(
    db: Session = Depends(get_db),
    researcher: User = Depends(require_researcher),
):
    logs = (
        db.query(ExportLog)
        .filter(ExportLog.researcher_id == researcher.id)
        .order_by(ExportLog.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "dataset": log.dataset_name,
            "date": log.created_at.strftime("%d %b %Y") if log.created_at else "",
            "format": log.format.upper(),
            "status": "Completed",
        }
        for log in logs
    ]