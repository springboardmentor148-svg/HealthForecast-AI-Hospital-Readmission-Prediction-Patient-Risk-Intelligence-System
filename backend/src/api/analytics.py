"""Hospital analytics and treatment outcomes computed from the live database.

"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.models import Patient

READMISSION = "<30 Days"
HIGH_RISK_TIERS = ("High", "Critical")
TIER_ORDER = ("Low", "Medium", "High", "Critical")


def _readmitted(p: Patient) -> bool:
    return p.readmission_likelihood == READMISSION


def build_analytics(db: Session) -> dict:
    """Aggregate hospital-level analytics from the real patient records."""
    rows = db.execute(select(Patient)).scalars().all()
    total = len(rows)

    readmission_rate = round(sum(1 for p in rows if _readmitted(p)) / total * 100, 2) if total else 0
    avg_los = round(sum(p.time_in_hospital for p in rows) / total, 2) if total else 0

    dept_map: dict[str, list[Patient]] = {}
    for p in rows:
        dept_map.setdefault(p.department or "Unknown", []).append(p)
    readmissions_by_department = [
        {
            "department": dept,
            "rate": round(sum(1 for x in ps if _readmitted(x)) / len(ps) * 100, 2),
            "patientCount": len(ps),
        }
        for dept, ps in sorted(dept_map.items(), key=lambda kv: -len(kv[1]))
    ]

    age_map: dict[str, list[Patient]] = {}
    for p in rows:
        age_map.setdefault(p.age or "Unknown", []).append(p)
    readmissions_by_age = [
        {
            "ageGroup": age,
            "rate": round(sum(1 for x in ps if _readmitted(x)) / len(ps) * 100, 2),
            "count": len(ps),
        }
        for age, ps in sorted(age_map.items())
    ]

    tier_counts = {tier: sum(1 for p in rows if p.risk_tier == tier) for tier in TIER_ORDER}
    risk_distribution = [
        {
            "tier": tier,
            "count": count,
            "percentage": round(count / total * 100) if total else 0,
        }
        for tier, count in tier_counts.items()
        if count > 0
    ]

    return {
        "totalPatients": total,
        "highRiskPatientsCount": sum(1 for p in rows if p.risk_tier in HIGH_RISK_TIERS),
        "readmissionRate30Day": readmission_rate,
        "avgLengthOfStayDays": avg_los,
        "readmissionsByDepartment": readmissions_by_department,
        "readmissionsByAge": readmissions_by_age,
        "riskDistribution": risk_distribution,
    }


def _regimen(medications: dict) -> str:
    meds = medications or {}
    insulin = str(meds.get("insulin", "No"))
    metformin = str(meds.get("metformin", "No"))
    on_insulin = insulin in ("Up", "Steady", "Down")
    on_metformin = metformin in ("Up", "Steady", "Down")
    if on_insulin and on_metformin:
        return "Insulin + Metformin"
    if on_insulin:
        return "Insulin Only"
    if on_metformin:
        return "Metformin Only"
    return "No Insulin/Metformin Therapy"


def build_treatment_outcomes(db: Session) -> list[dict]:
    """Aggregate readmission rate / length-of-stay by therapeutic regimen."""
    rows = db.execute(select(Patient)).scalars().all()
    regime_map: dict[str, list[Patient]] = {}
    for p in rows:
        regime_map.setdefault(_regimen(p.medications), []).append(p)

    return [
        {
            "regime": regime,
            "patientCount": len(ps),
            "readmissionRate30Day": round(sum(1 for x in ps if _readmitted(x)) / len(ps) * 100, 2),
            "avgLengthOfStay": round(sum(x.time_in_hospital for x in ps) / len(ps), 2),
        }
        for regime, ps in sorted(regime_map.items(), key=lambda kv: -len(kv[1]))
    ]
