from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, Department, Patient, Prediction, Treatment, Report
from auth_utils import get_current_user
from schemas import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    HospitalProfileResponse,
    HospitalProfileUpdate,
    HospitalOverviewResponse,
    DepartmentPerformanceItem,
    OverviewAlertItem,
    DoctorOption,
    OutcomeSummaryItem,
    PatientOutcomeItem,
    HospitalOutcomesResponse,
    RiskSummaryItem,
    DepartmentForecastItem,
    HospitalRiskForecastResponse,
    EffectivenessSummaryItem,
    DepartmentEffectivenessItem,
    HospitalTreatmentEffectivenessResponse,
    PopulationStatItem,
    ConditionBreakdownItem,
    HospitalPopulationHealthResponse,
    ReportItem,
    ReportListResponse,
    GenerateReportRequest,
)

router = APIRouter(prefix="/hospital-admin", tags=["Hospital Administrator"])


def require_hospital_admin(current_user: User = Depends(get_current_user)) -> User:
    """Sirf Hospital Administrator role wale users ko allow karega."""
    if current_user.user_role != "Hospital Administrator":
        raise HTTPException(status_code=403, detail="Not authorized — Hospital Admin access required")
    return current_user


def get_hospital_doctors(db: Session, admin: User) -> List[User]:
    """Admin ke hospital ke saare doctors, case-insensitive + trimmed match ke saath."""
    normalized_admin_hospital = admin.hospital_name.strip().lower()
    return (
        db.query(User)
        .filter(
            func.lower(func.trim(User.hospital_name)) == normalized_admin_hospital,
            User.user_role == "Doctor",
        )
        .all()
    )


def parse_percentage(value: Optional[str]) -> Optional[float]:
    """'53.47%' jaisi string ko 53.47 float me convert karta hai. Invalid/None pe None deta hai."""
    if not value:
        return None
    try:
        return float(str(value).replace("%", "").strip())
    except (ValueError, TypeError):
        return None


def to_department_response(dept: Department, db: Session) -> DepartmentResponse:
    head_name = None
    if dept.head_doctor_id:
        head = db.query(User).filter(User.id == dept.head_doctor_id).first()
        head_name = head.full_name if head else None

    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        headDoctorName=head_name,
        isActive=dept.is_active,
    )


# ---------- HOSPITAL PROFILE ----------
@router.get("/profile", response_model=HospitalProfileResponse)
def get_hospital_profile(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    return HospitalProfileResponse(
        hospitalName=admin.hospital_name,
        hospitalType=admin.hospital_type,
        ownershipType=admin.ownership_type,
        hospitalContact=admin.hospital_contact,
        hospitalAddress=admin.hospital_address,
    )


@router.patch("/profile", response_model=HospitalProfileResponse)
def update_hospital_profile(
    payload: HospitalProfileUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    old_hospital_name = admin.hospital_name

    if payload.hospitalName is not None:
        admin.hospital_name = payload.hospitalName
    if payload.hospitalType is not None:
        admin.hospital_type = payload.hospitalType
    if payload.ownershipType is not None:
        admin.ownership_type = payload.ownershipType
    if payload.hospitalContact is not None:
        admin.hospital_contact = payload.hospitalContact
    if payload.hospitalAddress is not None:
        admin.hospital_address = payload.hospitalAddress

    db.commit()
    db.refresh(admin)

    if payload.hospitalName is not None and payload.hospitalName != old_hospital_name:
        db.query(Department).filter(Department.hospital_name == old_hospital_name).update(
            {"hospital_name": payload.hospitalName}
        )
        db.commit()

    return HospitalProfileResponse(
        hospitalName=admin.hospital_name,
        hospitalType=admin.hospital_type,
        ownershipType=admin.ownership_type,
        hospitalContact=admin.hospital_contact,
        hospitalAddress=admin.hospital_address,
    )


# ---------- DOCTORS (for department head dropdown) ----------
@router.get("/doctors", response_model=List[DoctorOption])
def list_hospital_doctors(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctors = sorted(doctors, key=lambda d: d.full_name)
    return [DoctorOption(id=d.id, fullName=d.full_name) for d in doctors]


# ---------- DEPARTMENTS ----------
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    depts = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name)
        .order_by(Department.name)
        .all()
    )
    return [to_department_response(d, db) for d in depts]


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    existing = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name, Department.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")

    new_dept = Department(
        hospital_name=admin.hospital_name,
        name=payload.name,
        head_doctor_id=payload.head_doctor_id,
        is_active=True,
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    return to_department_response(new_dept, db)


@router.patch("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    dept = (
        db.query(Department)
        .filter(Department.id == dept_id, Department.hospital_name == admin.hospital_name)
        .first()
    )
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if payload.name is not None:
        dept.name = payload.name
    if payload.head_doctor_id is not None:
        dept.head_doctor_id = payload.head_doctor_id
    if payload.is_active is not None:
        dept.is_active = payload.is_active

    db.commit()
    db.refresh(dept)
    return to_department_response(dept, db)


@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    dept = (
        db.query(Department)
        .filter(Department.id == dept_id, Department.hospital_name == admin.hospital_name)
        .first()
    )
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(dept)
    db.commit()
    return {"message": "Department removed successfully"}


# ---------- OVERVIEW ----------
READMISSION_THRESHOLD = 10.0  # percent


@router.get("/overview", response_model=HospitalOverviewResponse)
def get_hospital_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    total_patients = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).count()
        if doctor_ids else 0
    )

    all_predictions = (
        db.query(Prediction).filter(Prediction.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )
    total_predictions = len(all_predictions)
    readmission_count = sum(1 for p in all_predictions if p.result == "Readmission")
    overall_rate = (readmission_count / total_predictions * 100) if total_predictions else 0.0

    active_departments = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name, Department.is_active == True)
        .all()
    )

    dept_performance = []
    alerts = []

    for dept in active_departments:
        dept_doctor_ids = [
            d.id for d in doctors
            if d.department and d.department.strip().lower() == dept.name.strip().lower()
        ]
        dept_predictions = [p for p in all_predictions if p.doctor_id in dept_doctor_ids]

        dept_total = len(dept_predictions)
        dept_readmit = sum(1 for p in dept_predictions if p.result == "Readmission")
        dept_rate = (dept_readmit / dept_total * 100) if dept_total else 0.0

        is_high = dept_rate > READMISSION_THRESHOLD
        dept_performance.append(
            DepartmentPerformanceItem(
                name=dept.name,
                readmissionRate=f"{dept_rate:.1f}%",
                outcome="Needs review" if is_high else "Good",
                status="High" if is_high else "Low",
            )
        )

        if is_high:
            alerts.append(
                OverviewAlertItem(
                    text=f"{dept.name} readmission rate above target threshold.",
                    tone="warning",
                )
            )

    if not alerts:
        alerts.append(
            OverviewAlertItem(text="All departments within readmission threshold.", tone="info")
        )

    return HospitalOverviewResponse(
        totalPatients=total_patients,
        readmissionRate=f"{overall_rate:.1f}%",
        bedOccupancy="N/A",
        departmentsMonitored=len(active_departments),
        departmentPerformance=dept_performance,
        alerts=alerts,
    )


# ---------- PATIENT OUTCOMES ----------
TREND_MAP = {
    "Improving": ("Improved", "up"),
    "Stable": ("Stable", "flat"),
    "Declining": ("Declined", "down"),
}


@router.get("/outcomes", response_model=HospitalOutcomesResponse)
def get_hospital_outcomes(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id.in_(doctor_ids))
        .order_by(Patient.created_at.desc())
        .all()
        if doctor_ids else []
    )

    improved_count = 0
    stable_count = 0
    declined_count = 0
    outcome_items = []

    for patient in patients:
        latest_treatment = (
            db.query(Treatment)
            .filter(Treatment.patient_id == patient.id)
            .order_by(Treatment.created_at.desc())
            .first()
        )

        if latest_treatment and latest_treatment.recovery_trend in TREND_MAP:
            outcome, trend = TREND_MAP[latest_treatment.recovery_trend]
        else:
            outcome, trend = "Stable", "flat"

        if outcome == "Improved":
            improved_count += 1
        elif outcome == "Declined":
            declined_count += 1
        else:
            stable_count += 1

        outcome_items.append(
            PatientOutcomeItem(
                patientId=f"PT-{10000 + patient.id}",
                name=patient.name,
                department=patient.admitting_department,
                admitted=patient.admission_date,
                outcome=outcome,
                trend=trend,
                readmissionRisk=patient.risk_level or "Moderate",
            )
        )

    summary = [
        OutcomeSummaryItem(label="Improved", value=improved_count, tone="low"),
        OutcomeSummaryItem(label="Stable", value=stable_count, tone="low"),
        OutcomeSummaryItem(label="Declined", value=declined_count, tone="high"),
    ]

    return HospitalOutcomesResponse(summary=summary, patients=outcome_items)


# ---------- RISK & READMISSION FORECAST ----------
@router.get("/risk-forecast", response_model=HospitalRiskForecastResponse)
def get_hospital_risk_forecast(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    all_patients = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )

    total_scored = len(all_patients)
    high_risk_count = sum(1 for p in all_patients if p.risk_level == "High")

    readmission_values = [
        parse_percentage(p.readmission_probability) for p in all_patients
    ]
    readmission_values = [v for v in readmission_values if v is not None]
    avg_readmission = (
        sum(readmission_values) / len(readmission_values) if readmission_values else 0.0
    )

    confidence_values = [parse_percentage(p.confidence) for p in all_patients]
    confidence_values = [v for v in confidence_values if v is not None]
    avg_confidence = (
        sum(confidence_values) / len(confidence_values) if confidence_values else 0.0
    )

    summary = [
        RiskSummaryItem(label="Patients Scored This Month", value=str(total_scored)),
        RiskSummaryItem(label="High Risk Patients", value=str(high_risk_count)),
        RiskSummaryItem(label="Avg. Readmission Probability", value=f"{avg_readmission:.1f}%"),
        RiskSummaryItem(
            label="Forecast Accuracy",
            value=f"{avg_confidence:.1f}%" if confidence_values else "N/A",
        ),
    ]

    active_departments = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name, Department.is_active == True)
        .all()
    )

    department_forecast = []
    for dept in active_departments:
        dept_patients = [
            p for p in all_patients
            if p.admitting_department and p.admitting_department.strip().lower() == dept.name.strip().lower()
        ]

        dept_total = len(dept_patients)
        dept_high_risk = sum(1 for p in dept_patients if p.risk_level == "High")

        dept_readmission_values = [
            parse_percentage(p.readmission_probability) for p in dept_patients
        ]
        dept_readmission_values = [v for v in dept_readmission_values if v is not None]
        dept_avg_readmission = (
            sum(dept_readmission_values) / len(dept_readmission_values)
            if dept_readmission_values else 0.0
        )

        trend = "up" if dept_avg_readmission > READMISSION_THRESHOLD else "down"

        department_forecast.append(
            DepartmentForecastItem(
                department=dept.name,
                patientsScored=dept_total,
                highRisk=dept_high_risk,
                forecastedReadmission=f"{dept_avg_readmission:.1f}%",
                trend=trend,
            )
        )

    return HospitalRiskForecastResponse(summary=summary, departmentForecast=department_forecast)


# ---------- TREATMENT EFFECTIVENESS ----------
@router.get("/treatment-effectiveness", response_model=HospitalTreatmentEffectivenessResponse)
def get_treatment_effectiveness(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    all_treatments = (
        db.query(Treatment).filter(Treatment.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )

    total_treatments = len(all_treatments)
    good_count = sum(1 for t in all_treatments if t.effectiveness == "Good")
    poor_count = sum(1 for t in all_treatments if t.effectiveness == "Poor")
    good_response_rate = (good_count / total_treatments * 100) if total_treatments else 0.0

    summary = [
        EffectivenessSummaryItem(
            label="Treatments Evaluated", value=str(total_treatments), tone="low"
        ),
        EffectivenessSummaryItem(
            label="Good Response Rate", value=f"{good_response_rate:.0f}%", tone="low"
        ),
        EffectivenessSummaryItem(
            label="Needs Review", value=str(poor_count), tone="high"
        ),
    ]

    # Patient lookup, taaki treatment ka department pata chal sake
    patient_ids = list({t.patient_id for t in all_treatments})
    patients = (
        db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        if patient_ids else []
    )
    patient_department_map = {p.id: p.admitting_department for p in patients}

    active_departments = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name, Department.is_active == True)
        .all()
    )

    department_effectiveness = []
    for dept in active_departments:
        dept_treatments = [
            t for t in all_treatments
            if patient_department_map.get(t.patient_id)
            and patient_department_map.get(t.patient_id).strip().lower() == dept.name.strip().lower()
        ]

        dept_total = len(dept_treatments)
        dept_good = sum(1 for t in dept_treatments if t.effectiveness == "Good")
        dept_good_rate = (dept_good / dept_total * 100) if dept_total else 0.0

        dept_adherence_values = [parse_percentage(t.adherence) for t in dept_treatments]
        dept_adherence_values = [v for v in dept_adherence_values if v is not None]
        dept_avg_adherence = (
            sum(dept_adherence_values) / len(dept_adherence_values)
            if dept_adherence_values else 0.0
        )

        if dept_total == 0:
            status = "No Data"
        elif dept_good_rate >= 75:
            status = "Good"
        elif dept_good_rate >= 50:
            status = "Moderate"
        else:
            status = "Needs Review"

        department_effectiveness.append(
            DepartmentEffectivenessItem(
                department=dept.name,
                treatmentsReviewed=dept_total,
                goodResponse=f"{dept_good_rate:.0f}%",
                avgAdherence=f"{dept_avg_adherence:.0f}%",
                status=status,
            )
        )

    return HospitalTreatmentEffectivenessResponse(
        summary=summary,
        departmentEffectiveness=department_effectiveness,
    )


# ---------- POPULATION HEALTH ----------
@router.get("/population-health", response_model=HospitalPopulationHealthResponse)
def get_population_health(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    all_patients = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )

    total_patients = len(all_patients)

    ages = [p.age for p in all_patients if p.age is not None]
    avg_age = (sum(ages) / len(ages)) if ages else 0.0

    # Note: har patient ka 'condition' field required hai, isliye "chronic condition
    # patients" ko total tracked patients ke barabar treat kiya hai (sab patients ka
    # koi na koi documented condition hota hai).
    stats = [
        PopulationStatItem(label="Total Patients Tracked", value=str(total_patients)),
        PopulationStatItem(label="Chronic Condition Patients", value=str(total_patients)),
        PopulationStatItem(label="Avg. Age", value=f"{avg_age:.1f} yrs" if ages else "N/A"),
    ]

    # Condition ke hisaab se group karo (case-insensitive + trimmed)
    condition_groups: dict[str, list[Patient]] = {}
    for p in all_patients:
        if not p.condition:
            continue
        key = p.condition.strip()
        condition_groups.setdefault(key, []).append(p)

    condition_breakdown = []
    for condition_name, patients_in_group in condition_groups.items():
        readmission_values = [
            parse_percentage(p.readmission_probability) for p in patients_in_group
        ]
        readmission_values = [v for v in readmission_values if v is not None]
        avg_readmission = (
            sum(readmission_values) / len(readmission_values) if readmission_values else 0.0
        )

        condition_breakdown.append(
            ConditionBreakdownItem(
                condition=condition_name,
                patients=len(patients_in_group),
                avgReadmission=f"{avg_readmission:.1f}%",
            )
        )

    condition_breakdown.sort(key=lambda item: item.patients, reverse=True)

    return HospitalPopulationHealthResponse(
        stats=stats,
        conditionBreakdown=condition_breakdown,
    )


# ---------- REPORTS ----------
def build_report_content(db: Session, admin: User, report_type: str) -> str:
    """Hospital ke current data se ek text report content banata hai."""
    doctors = get_hospital_doctors(db, admin)
    doctor_ids = [d.id for d in doctors]

    total_patients = (
        db.query(Patient).filter(Patient.doctor_id.in_(doctor_ids)).count()
        if doctor_ids else 0
    )

    all_predictions = (
        db.query(Prediction).filter(Prediction.doctor_id.in_(doctor_ids)).all()
        if doctor_ids else []
    )
    total_predictions = len(all_predictions)
    readmission_count = sum(1 for p in all_predictions if p.result == "Readmission")
    overall_rate = (readmission_count / total_predictions * 100) if total_predictions else 0.0

    active_departments = (
        db.query(Department)
        .filter(Department.hospital_name == admin.hospital_name, Department.is_active == True)
        .all()
    )

    lines = [
        f"HealthForecastAI — {report_type} Report",
        f"Hospital: {admin.hospital_name}",
        f"Generated: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}",
        f"Generated By: {admin.full_name}",
        "-" * 50,
        "",
        "HOSPITAL SUMMARY",
        f"  Total Patients: {total_patients}",
        f"  Overall Readmission Rate: {overall_rate:.1f}%",
        f"  Departments Monitored: {len(active_departments)}",
        "",
        "DEPARTMENT BREAKDOWN",
    ]

    if not active_departments:
        lines.append("  No departments added yet.")
    else:
        for dept in active_departments:
            dept_doctor_ids = [
                d.id for d in doctors
                if d.department and d.department.strip().lower() == dept.name.strip().lower()
            ]
            dept_predictions = [p for p in all_predictions if p.doctor_id in dept_doctor_ids]
            dept_total = len(dept_predictions)
            dept_readmit = sum(1 for p in dept_predictions if p.result == "Readmission")
            dept_rate = (dept_readmit / dept_total * 100) if dept_total else 0.0
            lines.append(f"  - {dept.name}: {dept_total} predictions, {dept_rate:.1f}% readmission rate")

    return "\n".join(lines)


@router.get("/reports", response_model=ReportListResponse)
def list_reports(
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    reports = (
        db.query(Report)
        .filter(Report.hospital_name == admin.hospital_name)
        .order_by(Report.created_at.desc())
        .all()
    )
    return ReportListResponse(
        reports=[
            ReportItem(
                id=r.id,
                title=r.title,
                type=r.type,
                period=r.period,
                generatedBy=r.generated_by,
                status=r.status,
                createdAt=r.created_at,
            )
            for r in reports
        ],
        total=len(reports),
    )


@router.post("/reports/generate", response_model=ReportItem)
def generate_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    report_type = payload.type or "Performance"
    content = build_report_content(db, admin, report_type)

    today_label = datetime.utcnow().strftime("%d %b %Y")
    new_report = Report(
        hospital_name=admin.hospital_name,
        title=f"Hospital {report_type} Report",
        type=report_type,
        period=today_label,
        generated_by=admin.full_name,
        status="Ready",
        content=content,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return ReportItem(
        id=new_report.id,
        title=new_report.title,
        type=new_report.type,
        period=new_report.period,
        generatedBy=new_report.generated_by,
        status=new_report.status,
        createdAt=new_report.created_at,
    )


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.hospital_name == admin.hospital_name)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    filename = f"{report.id}-{report.type.lower()}.txt"
    return Response(
        content=report.content or "No content available.",
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_hospital_admin),
):
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.hospital_name == admin.hospital_name)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()
    return {"message": "Report removed successfully"}