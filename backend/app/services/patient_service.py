from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from math import ceil
from typing import Any

from sqlalchemy import asc, desc, func, or_
from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import (
    AdmissionType,
    Gender,
    Patient,
    Prediction,
    PredictionHistory,
    RiskBand,
    TreatmentEffectiveness,
    User,
)

MAX_PATIENT_PAGE_SIZE = 100
DEFAULT_PATIENT_PAGE_SIZE = 25
PATIENT_SORT_FIELDS = {
    "id": Patient.id,
    "patient_identifier": Patient.patient_identifier,
    "full_name": (Patient.last_name, Patient.first_name),
    "age_at_admission": Patient.age_at_admission,
    "gender": Patient.gender,
    "admission_type": Patient.admission_type,
    "primary_diagnosis": Patient.primary_diagnosis,
    "admission_date": Patient.admission_date,
    "discharge_date": Patient.discharge_date,
    "risk_band": Patient.risk_band,
    "readmission_probability": Patient.readmission_probability,
    "created_at": Patient.created_at,
    "updated_at": Patient.updated_at,
}


def _normalize_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str):
        raise APIError(f"{field_name} is required", 400)
    cleaned = value.strip()
    if not cleaned:
        raise APIError(f"{field_name} is required", 400)
    return cleaned


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise APIError("Input values must be strings where applicable", 400)
    cleaned = value.strip()
    return cleaned or None


def _optional_int(value: Any, field_name: str) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise APIError(f"{field_name} must be an integer", 400) from exc


def _required_int(value: Any, field_name: str) -> int:
    parsed = _optional_int(value, field_name)
    if parsed is None:
        raise APIError(f"{field_name} is required", 400)
    return parsed


def _optional_decimal(value: Any, field_name: str) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except Exception as exc:  # noqa: BLE001
        raise APIError(f"{field_name} must be a number", 400) from exc


def _optional_bool(value: Any, field_name: str) -> bool | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes", "on"}:
            return True
        if lowered in {"false", "0", "no", "off"}:
            return False
    raise APIError(f"{field_name} must be a boolean", 400)


def _optional_date(value: Any, field_name: str) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if not isinstance(value, str):
        raise APIError(f"{field_name} must be a date string", 400)
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise APIError(f"{field_name} must be in YYYY-MM-DD format", 400) from exc


def _validate_email_format(value: str) -> str:
    if "@" not in value or value.count("@") != 1:
        raise APIError("email must be a valid email address", 400)
    local_part, domain_part = value.split("@", 1)
    if not local_part.strip() or not domain_part.strip() or "." not in domain_part:
        raise APIError("email must be a valid email address", 400)
    return value


def _parse_full_name(payload: dict[str, Any]) -> tuple[str, str]:
    full_name = payload.get("full_name")
    first_name = _optional_text(payload.get("first_name"))
    last_name = _optional_text(payload.get("last_name"))

    if full_name is not None:
        cleaned_full_name = _normalize_text(full_name, "full_name")
        parts = cleaned_full_name.split()
        if not first_name:
            first_name = parts[0]
        if not last_name:
            last_name = " ".join(parts[1:]) if len(parts) > 1 else parts[0]

    if not first_name or not last_name:
        raise APIError("full_name or first_name and last_name are required", 400)

    return first_name, last_name


def _parse_enum(value: Any, enum_type, field_name: str):
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise APIError(f"{field_name} must be a string", 400)
    cleaned = value.strip().lower()
    try:
        return enum_type(cleaned)
    except ValueError as exc:
        raise APIError(f"Invalid {field_name}", 400) from exc


def _parse_medications(value: Any) -> list[str]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        medications = []
        for item in value:
            if not isinstance(item, str):
                raise APIError("medications must be an array of strings", 400)
            cleaned = item.strip()
            if cleaned:
                medications.append(cleaned)
        return medications
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    raise APIError("medications must be a list or comma-separated string", 400)


def _clean_identifier(value: Any) -> str:
    identifier = _normalize_text(value, "patient_identifier")
    return identifier


def _validate_required_patient_fields(payload: dict[str, Any], errors: dict[str, str]) -> None:
    if "patient_identifier" not in payload or payload.get("patient_identifier") in (None, ""):
        errors["patient_identifier"] = "patient_identifier is required"
    if "primary_diagnosis" not in payload or payload.get("primary_diagnosis") in (None, ""):
        errors["primary_diagnosis"] = "primary_diagnosis is required"
    if "gender" not in payload or payload.get("gender") in (None, ""):
        errors["gender"] = "gender is required"


def _validate_patient_common_fields(payload: dict[str, Any], errors: dict[str, str]) -> None:
    if "email" in payload and payload.get("email") not in (None, ""):
        email = payload.get("email")
        if not isinstance(email, str):
            errors["email"] = "email must be a valid email address"
        else:
            try:
                _validate_email_format(email.strip().lower())
            except APIError as exc:
                errors["email"] = exc.message

    if "age_at_admission" in payload:
        age = payload.get("age_at_admission")
        try:
            parsed_age = _optional_int(age, "age_at_admission")
            if parsed_age is not None and parsed_age < 0:
                raise APIError("age_at_admission must be greater than or equal to 0", 400)
        except APIError as exc:
            errors["age_at_admission"] = exc.message

    if "admission_date" in payload:
        try:
            _optional_date(payload.get("admission_date"), "admission_date")
        except APIError as exc:
            errors["admission_date"] = exc.message

    if "discharge_date" in payload:
        try:
            _optional_date(payload.get("discharge_date"), "discharge_date")
        except APIError as exc:
            errors["discharge_date"] = exc.message


def _build_patient_query(args: Any):
    query = Patient.query
    search = args.get("search") or args.get("q")
    if isinstance(search, str) and search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Patient.patient_identifier).like(pattern),
                func.lower(Patient.first_name).like(pattern),
                func.lower(Patient.last_name).like(pattern),
                func.lower(Patient.primary_diagnosis).like(pattern),
                func.lower(Patient.secondary_diagnosis).like(pattern),
                func.lower(Patient.follow_up_schedule).like(pattern),
                func.lower(Patient.discharge_plan).like(pattern),
            )
        )

    def _apply_enum_filter(field_name: str, enum_type, column):
        value = args.get(field_name)
        if value in (None, ""):
            return
        if not isinstance(value, str):
            raise APIError(f"{field_name} must be a string", 400)
        try:
            parsed = enum_type(value.strip().lower())
        except ValueError as exc:
            raise APIError(f"Invalid {field_name}", 400) from exc
        return column == parsed

    filters = [
        _apply_enum_filter("gender", Gender, Patient.gender),
        _apply_enum_filter("admission_type", AdmissionType, Patient.admission_type),
        _apply_enum_filter("risk_band", RiskBand, Patient.risk_band),
    ]
    for criterion in filters:
        if criterion is not None:
            query = query.filter(criterion)

    if args.get("is_active") not in (None, ""):
        is_active = _optional_bool(args.get("is_active"), "is_active")
        query = query.filter(Patient.is_active.is_(is_active))

    if args.get("assigned_doctor_id") not in (None, ""):
        query = query.filter(Patient.assigned_doctor_id == _required_int(args.get("assigned_doctor_id"), "assigned_doctor_id"))

    if args.get("admission_date_from") not in (None, ""):
        query = query.filter(Patient.admission_date >= _optional_date(args.get("admission_date_from"), "admission_date_from"))
    if args.get("admission_date_to") not in (None, ""):
        query = query.filter(Patient.admission_date <= _optional_date(args.get("admission_date_to"), "admission_date_to"))
    if args.get("discharge_date_from") not in (None, ""):
        query = query.filter(Patient.discharge_date >= _optional_date(args.get("discharge_date_from"), "discharge_date_from"))
    if args.get("discharge_date_to") not in (None, ""):
        query = query.filter(Patient.discharge_date <= _optional_date(args.get("discharge_date_to"), "discharge_date_to"))

    sort_by = str(args.get("sort_by") or "admission_date").strip().lower()
    sort_order = str(args.get("sort_order") or "desc").strip().lower()
    sort_is_desc = sort_order != "asc"
    sort_field = PATIENT_SORT_FIELDS.get(sort_by)
    if sort_field is None:
        raise APIError("Invalid sort_by value", 400)

    if sort_by == "full_name":
        order_columns = [desc(Patient.last_name), desc(Patient.first_name)] if sort_is_desc else [asc(Patient.last_name), asc(Patient.first_name)]
    else:
        order_columns = [desc(sort_field), desc(Patient.id)] if sort_is_desc else [asc(sort_field), asc(Patient.id)]
    query = query.order_by(*order_columns)
    return query


def _paginate_patients(query, args: Any):
    page_value = args.get("page")
    per_page_value = args.get("per_page")
    if page_value in (None, "") and per_page_value in (None, ""):
        patients = query.all()
        return patients, {
            "page": 1,
            "per_page": len(patients),
            "total": len(patients),
            "pages": 1,
            "has_next": False,
            "has_prev": False,
        }

    page = _required_int(page_value if page_value not in (None, "") else 1, "page")
    per_page = _required_int(per_page_value if per_page_value not in (None, "") else DEFAULT_PATIENT_PAGE_SIZE, "per_page")
    if page < 1:
        raise APIError("page must be greater than or equal to 1", 400)
    if per_page < 1 or per_page > MAX_PATIENT_PAGE_SIZE:
        raise APIError(f"per_page must be between 1 and {MAX_PATIENT_PAGE_SIZE}", 400)

    total = query.count()
    pages = max(1, ceil(total / per_page))
    offset = (page - 1) * per_page
    patients = query.offset(offset).limit(per_page).all()
    return patients, {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }


def _collect_patient_validation_errors(
    payload: dict[str, Any],
    *,
    require_required_fields: bool = False,
    current_patient: Patient | None = None,
) -> dict[str, str]:
    errors: dict[str, str] = {}

    if require_required_fields:
        _validate_required_patient_fields(payload, errors)

    _validate_patient_common_fields(payload, errors)

    if "full_name" in payload or "first_name" in payload or "last_name" in payload or require_required_fields:
        try:
            _parse_full_name(payload)
        except APIError as exc:
            errors["full_name"] = exc.message

    if "patient_identifier" in payload and payload.get("patient_identifier") not in (None, ""):
        try:
            _clean_identifier(payload.get("patient_identifier"))
        except APIError as exc:
            errors["patient_identifier"] = exc.message

    if "gender" in payload or require_required_fields:
        try:
            _parse_enum(payload.get("gender"), Gender, "gender")
        except APIError as exc:
            errors["gender"] = exc.message

    if "admission_type" in payload and payload.get("admission_type") not in (None, ""):
        try:
            _parse_enum(payload.get("admission_type"), AdmissionType, "admission_type")
        except APIError as exc:
            errors["admission_type"] = exc.message

    if "risk_band" in payload and payload.get("risk_band") not in (None, ""):
        try:
            _parse_enum(payload.get("risk_band"), RiskBand, "risk_band")
        except APIError as exc:
            errors["risk_band"] = exc.message

    if "primary_diagnosis" in payload or require_required_fields:
        try:
            _normalize_text(payload.get("primary_diagnosis"), "primary_diagnosis")
        except APIError as exc:
            errors["primary_diagnosis"] = exc.message

    if "age_at_admission" in payload:
        try:
            parsed_age = _optional_int(payload.get("age_at_admission"), "age_at_admission")
            if parsed_age is not None and parsed_age < 0:
                raise APIError("age_at_admission must be greater than or equal to 0", 400)
        except APIError as exc:
            errors["age_at_admission"] = exc.message

    if "time_in_hospital" in payload:
        try:
            parsed_value = _required_int(payload.get("time_in_hospital"), "time_in_hospital")
            if parsed_value < 0:
                raise APIError("time_in_hospital must be greater than or equal to 0", 400)
        except APIError as exc:
            errors["time_in_hospital"] = exc.message

    if "prior_diagnoses_count" in payload:
        try:
            parsed_value = _required_int(payload.get("prior_diagnoses_count"), "prior_diagnoses_count")
            if parsed_value < 0:
                raise APIError("prior_diagnoses_count must be greater than or equal to 0", 400)
        except APIError as exc:
            errors["prior_diagnoses_count"] = exc.message

    if "lab_procedures_count" in payload:
        try:
            parsed_value = _required_int(payload.get("lab_procedures_count"), "lab_procedures_count")
            if parsed_value < 0:
                raise APIError("lab_procedures_count must be greater than or equal to 0", 400)
        except APIError as exc:
            errors["lab_procedures_count"] = exc.message

    admission_date = None
    discharge_date = None
    if "admission_date" in payload:
        try:
            admission_date = _optional_date(payload.get("admission_date"), "admission_date")
        except APIError as exc:
            errors["admission_date"] = exc.message
    elif current_patient is not None:
        admission_date = current_patient.admission_date

    if "discharge_date" in payload:
        try:
            discharge_date = _optional_date(payload.get("discharge_date"), "discharge_date")
        except APIError as exc:
            errors["discharge_date"] = exc.message
    elif current_patient is not None:
        discharge_date = current_patient.discharge_date

    if admission_date and discharge_date and discharge_date < admission_date:
        errors["discharge_date"] = "discharge_date must be on or after admission_date"

    if "readmission_probability" in payload:
        try:
            parsed_probability = _optional_decimal(payload.get("readmission_probability"), "readmission_probability")
            if parsed_probability is not None and (parsed_probability < 0 or parsed_probability > 100):
                raise APIError("readmission_probability must be between 0 and 100", 400)
        except APIError as exc:
            errors["readmission_probability"] = exc.message

    if "is_active" in payload and payload.get("is_active") not in (None, ""):
        try:
            _optional_bool(payload.get("is_active"), "is_active")
        except APIError as exc:
            errors["is_active"] = exc.message

    return errors


def _resolve_assigned_doctor(assigned_doctor_id: Any) -> User | None:
    if assigned_doctor_id in (None, ""):
        return None
    doctor_id = _required_int(assigned_doctor_id, "assigned_doctor_id")
    doctor = db.session.get(User, doctor_id)
    if doctor is None:
        raise APIError("assigned_doctor_id is invalid", 400)
    return doctor


def serialize_patient(patient: Patient) -> dict[str, Any]:
    assigned_doctor_name = None
    if patient.assigned_doctor is not None:
        assigned_doctor_name = patient.assigned_doctor.full_name

    prediction_history = []
    for history in sorted(
        patient.prediction_history,
        key=lambda record: record.created_at,
        reverse=True,
    ):
        prediction_history.append(
            {
                "id": history.id,
                "date": history.created_at.date().isoformat() if history.created_at else None,
                "model": history.model_version,
                "prob": float(history.risk_score),
                "risk_band": history.risk_class.value if history.risk_class else None,
                "confidence": float(history.confidence),
                "prediction_type": history.prediction_type.value if history.prediction_type else None,
            }
        )

    treatments = []
    for tr in sorted(
        patient.treatment_effectiveness,
        key=lambda record: record.start_date,
        reverse=True,
    ):
        treatments.append(
            {
                "id": tr.id,
                "treatment_name": tr.treatment_name,
                "treatment_type": tr.treatment_type,
                "start_date": tr.start_date.isoformat(),
                "end_date": tr.end_date.isoformat() if tr.end_date else None,
                "outcome_score": float(tr.outcome_score) if tr.outcome_score is not None else None,
                "effectiveness_level": tr.effectiveness_level.value if tr.effectiveness_level else None,
                "notes": tr.notes,
                "status": tr.status,
                "source": tr.source,
                "approved_by": tr.approver.full_name if tr.approver else None,
                "predicted_treatment_effectiveness": float(tr.predicted_treatment_effectiveness) if tr.predicted_treatment_effectiveness is not None else None,
                "predicted_recovery_days": float(tr.predicted_recovery_days) if tr.predicted_recovery_days is not None else None,
                "expected_response_category": tr.expected_response_category.value if tr.expected_response_category else None,
                "treatment_confidence": float(tr.treatment_confidence) if tr.treatment_confidence is not None else None,
                "forecast_generated_at": tr.forecast_generated_at.isoformat() if tr.forecast_generated_at else None,
            }
        )

    return {
        "id": patient.id,
        "patient_identifier": patient.patient_identifier,
        "full_name": f"{patient.first_name} {patient.last_name}".strip(),
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "age_at_admission": patient.age_at_admission,
        "gender": patient.gender.value if patient.gender else None,
        "admission_type": patient.admission_type.value if patient.admission_type else None,
        "primary_diagnosis": patient.primary_diagnosis,
        "secondary_diagnosis": patient.secondary_diagnosis,
        "admission_date": patient.admission_date.isoformat() if patient.admission_date else None,
        "discharge_date": patient.discharge_date.isoformat() if patient.discharge_date else None,
        "time_in_hospital": patient.time_in_hospital,
        "prior_diagnoses_count": patient.prior_diagnoses_count,
        "lab_procedures_count": patient.lab_procedures_count,
        "medications": patient.medications or [],
        "follow_up_schedule": patient.follow_up_schedule,
        "discharge_plan": patient.discharge_plan,
        "risk_band": patient.risk_band.value if patient.risk_band else None,
        "readmission_probability": float(patient.readmission_probability),
        "last_prediction_at": patient.last_prediction_at.isoformat() if patient.last_prediction_at else None,
        "assigned_doctor_id": patient.assigned_doctor_id,
        "assigned_doctor_name": assigned_doctor_name,
        "is_active": patient.is_active,
        "prediction_history": prediction_history,
        "treatments": treatments,
    }


def list_patients(args: Any | None = None) -> dict[str, Any]:
    query_args = args or {}
    query = _build_patient_query(query_args)
    patients, pagination = _paginate_patients(query, query_args)
    return {
        "patients": [serialize_patient(patient) for patient in patients],
        "pagination": pagination,
    }


def get_patient(patient_id: int) -> Patient | None:
    return db.session.get(Patient, patient_id)


def create_patient(payload: dict[str, Any], creator_doctor_id: int | None = None) -> Patient:
    errors = _collect_patient_validation_errors(payload, require_required_fields=True)
    if errors:
        raise APIError("Validation failed", 400, {"fields": errors})

    first_name, last_name = _parse_full_name(payload)
    patient_identifier = _clean_identifier(payload.get("patient_identifier"))
    gender = _parse_enum(payload.get("gender"), Gender, "gender") or Gender.unknown
    admission_type = _parse_enum(payload.get("admission_type"), AdmissionType, "admission_type") or AdmissionType.other
    risk_band = _parse_enum(payload.get("risk_band"), RiskBand, "risk_band") or RiskBand.low
    
    if creator_doctor_id is not None:
        assigned_doctor = db.session.get(User, creator_doctor_id)
    else:
        assigned_doctor = _resolve_assigned_doctor(payload.get("assigned_doctor_id"))

    if Patient.query.filter_by(patient_identifier=patient_identifier).first() is not None:
        raise APIError("patient_identifier is already registered", 409, {"fields": {"patient_identifier": "patient_identifier is already registered"}})

    patient = Patient(
        patient_identifier=patient_identifier,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=_optional_date(payload.get("date_of_birth"), "date_of_birth"),
        age_at_admission=_optional_int(payload.get("age_at_admission"), "age_at_admission"),
        gender=gender,
        admission_type=admission_type,
        primary_diagnosis=_normalize_text(payload.get("primary_diagnosis"), "primary_diagnosis"),
        secondary_diagnosis=_optional_text(payload.get("secondary_diagnosis")),
        admission_date=_optional_date(payload.get("admission_date"), "admission_date"),
        discharge_date=_optional_date(payload.get("discharge_date"), "discharge_date"),
        time_in_hospital=_required_int(payload.get("time_in_hospital", 0), "time_in_hospital"),
        prior_diagnoses_count=_required_int(payload.get("prior_diagnoses_count", 0), "prior_diagnoses_count"),
        lab_procedures_count=_required_int(payload.get("lab_procedures_count", 0), "lab_procedures_count"),
        medications=_parse_medications(payload.get("medications")),
        follow_up_schedule=_optional_text(payload.get("follow_up_schedule")),
        discharge_plan=_optional_text(payload.get("discharge_plan")),
        risk_band=risk_band,
        readmission_probability=_optional_decimal(payload.get("readmission_probability", 0), "readmission_probability") or Decimal("0"),
        assigned_doctor=assigned_doctor,
        is_active=_optional_bool(payload.get("is_active"), "is_active") if payload.get("is_active") is not None else True,
    )

    if patient.admission_date and patient.discharge_date and patient.discharge_date < patient.admission_date:
        raise APIError("Validation failed", 400, {"fields": {"discharge_date": "discharge_date must be on or after admission_date"}})

    db.session.add(patient)
    db.session.flush()
    
    from .notification_service import broadcast_notification
    broadcast_notification(
        title="👤 Patient Record Created",
        message=f"Patient {patient.first_name} {patient.last_name} ({patient.patient_identifier}) has been added to the registry.",
        notification_type="PATIENT_CREATED",
        related_entity="Patient",
        related_entity_id=patient.id
    )

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to save patient", 409) from exc

    from .user_service import log_user_activity
    log_user_activity(
        action="create_patient",
        target_type="Patient",
        target_id=patient.id,
        metadata={"patient_name": f"{patient.first_name} {patient.last_name}".strip()},
    )

    return patient



def update_patient(patient: Patient, payload: dict[str, Any]) -> Patient:
    duplicate_identifier_error = None
    errors = _collect_patient_validation_errors(payload, current_patient=patient)
    if "patient_identifier" in payload and payload.get("patient_identifier") not in (None, ""):
        patient_identifier = _clean_identifier(payload.get("patient_identifier"))
        duplicate = Patient.query.filter(
            Patient.patient_identifier == patient_identifier,
            Patient.id != patient.id,
        ).first()
        if duplicate is not None:
            duplicate_identifier_error = "patient_identifier is already registered"

    if errors:
        raise APIError("Validation failed", 400, {"fields": errors})
    if duplicate_identifier_error:
        raise APIError(
            duplicate_identifier_error,
            409,
            {"fields": {"patient_identifier": duplicate_identifier_error}},
        )

    if "full_name" in payload or "first_name" in payload or "last_name" in payload:
        first_name, last_name = _parse_full_name(payload)
        patient.first_name = first_name
        patient.last_name = last_name

    if "patient_identifier" in payload:
        patient_identifier = _clean_identifier(payload.get("patient_identifier"))
        patient.patient_identifier = patient_identifier

    if "date_of_birth" in payload:
        patient.date_of_birth = _optional_date(payload.get("date_of_birth"), "date_of_birth")
    if "age_at_admission" in payload:
        patient.age_at_admission = _optional_int(payload.get("age_at_admission"), "age_at_admission")
    if "gender" in payload:
        patient.gender = _parse_enum(payload.get("gender"), Gender, "gender") or patient.gender
    if "admission_type" in payload:
        patient.admission_type = _parse_enum(payload.get("admission_type"), AdmissionType, "admission_type") or patient.admission_type
    if "primary_diagnosis" in payload:
        patient.primary_diagnosis = _normalize_text(payload.get("primary_diagnosis"), "primary_diagnosis")
    if "secondary_diagnosis" in payload:
        patient.secondary_diagnosis = _optional_text(payload.get("secondary_diagnosis"))
    if "admission_date" in payload:
        patient.admission_date = _optional_date(payload.get("admission_date"), "admission_date")
    if "discharge_date" in payload:
        patient.discharge_date = _optional_date(payload.get("discharge_date"), "discharge_date")
    if "time_in_hospital" in payload:
        patient.time_in_hospital = _required_int(payload.get("time_in_hospital"), "time_in_hospital")
    if "prior_diagnoses_count" in payload:
        patient.prior_diagnoses_count = _required_int(payload.get("prior_diagnoses_count"), "prior_diagnoses_count")
    if "lab_procedures_count" in payload:
        patient.lab_procedures_count = _required_int(payload.get("lab_procedures_count"), "lab_procedures_count")
    if "medications" in payload:
        patient.medications = _parse_medications(payload.get("medications"))
    if "follow_up_schedule" in payload:
        patient.follow_up_schedule = _optional_text(payload.get("follow_up_schedule"))
    if "discharge_plan" in payload:
        patient.discharge_plan = _optional_text(payload.get("discharge_plan"))
    if "risk_band" in payload:
        patient.risk_band = _parse_enum(payload.get("risk_band"), RiskBand, "risk_band") or patient.risk_band
    if "readmission_probability" in payload:
        patient.readmission_probability = _optional_decimal(payload.get("readmission_probability"), "readmission_probability") or Decimal("0")
    if "assigned_doctor_id" in payload:
        assigned_doctor = _resolve_assigned_doctor(payload.get("assigned_doctor_id"))
        patient.assigned_doctor = assigned_doctor
    if "is_active" in payload:
        bool_value = _optional_bool(payload.get("is_active"), "is_active")
        patient.is_active = True if bool_value is None else bool_value

    if patient.admission_date and patient.discharge_date and patient.discharge_date < patient.admission_date:
        raise APIError("Validation failed", 400, {"fields": {"discharge_date": "discharge_date must be on or after admission_date"}})

    from .notification_service import broadcast_notification
    broadcast_notification(
        title="✏️ Patient Record Updated",
        message=f"Patient {patient.first_name} {patient.last_name} ({patient.patient_identifier}) dossier updated.",
        notification_type="PATIENT_UPDATED",
        related_entity="Patient",
        related_entity_id=patient.id
    )

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to save patient", 409) from exc

    from .user_service import log_user_activity
    log_user_activity(
        action="update_patient",
        target_type="Patient",
        target_id=patient.id,
        metadata={"patient_name": f"{patient.first_name} {patient.last_name}".strip()},
    )

    return patient


def delete_patient(patient: Patient) -> None:
    patient_name = f"{patient.first_name} {patient.last_name}".strip()
    patient_id = patient.id

    prediction_ids = [prediction.id for prediction in patient.predictions]
    if prediction_ids:
        PredictionHistory.query.filter(PredictionHistory.prediction_id.in_(prediction_ids)).delete(synchronize_session=False)
        Prediction.query.filter(Prediction.id.in_(prediction_ids)).delete(synchronize_session=False)

    PredictionHistory.query.filter_by(patient_id=patient.id).delete(synchronize_session=False)
    TreatmentEffectiveness.query.filter_by(patient_id=patient.id).delete(synchronize_session=False)

    db.session.delete(patient)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to delete patient", 409) from exc

    from .user_service import log_user_activity
    log_user_activity(
        action="delete_patient",
        target_type="Patient",
        target_id=patient_id,
        metadata={"patient_name": patient_name},
    )

