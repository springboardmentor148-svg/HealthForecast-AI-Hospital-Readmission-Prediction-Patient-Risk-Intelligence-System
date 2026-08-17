import random
from typing import Any

from src.db.models import Patient

DEFAULT_MEDICATIONS: dict[str, str] = {
    "insulin": "Steady",
    "metformin": "Steady",
    "glipizide": "No",
    "glyburide": "No",
    "changeInDiabetesMed": "No",
    "diabetesMedPrescribed": "Yes",
}


def api_patient_to_db(p: dict) -> dict:
    """Convert a frontend-shaped (camelCase) patient record to DB column values."""
    return {
        "id": p.get("id"),
        "medical_record_number": p.get("medicalRecordNumber"),
        "name": p.get("name"),
        "age": p.get("age"),
        "gender": p.get("gender"),
        "race": p.get("race"),
        "admission_type": p.get("admissionType"),
        "discharge_disposition": p.get("dischargeDisposition"),
        "admission_source": p.get("admissionSource"),
        "time_in_hospital": int(p.get("timeInHospital") or 0),
        "num_lab_procedures": int(p.get("numLabProcedures") or 0),
        "num_procedures": int(p.get("numProcedures") or 0),
        "num_medications": int(p.get("numMedications") or 0),
        "num_outpatient_visits": int(p.get("numOutpatientVisits") or 0),
        "num_inpatient_visits": int(p.get("numInpatientVisits") or 0),
        "num_emergency_visits": int(p.get("numEmergencyVisits") or 0),
        "primary_diagnosis": p.get("primaryDiagnosis"),
        "secondary_diagnosis1": p.get("secondaryDiagnosis1"),
        "secondary_diagnosis2": p.get("secondaryDiagnosis2"),
        "glucose_test": p.get("glucoseTest"),
        "a1c_result": p.get("a1cResult"),
        "medications": p.get("medications") or {},
        "department": p.get("department"),
        "assigned_doctor": p.get("assignedDoctor"),
        "assigned_doctor_id": p.get("assignedDoctorId"),
        "admission_date": p.get("admissionDate"),
        "discharge_date": p.get("dischargeDate"),
        "risk_score": float(p.get("riskScore") or 0),
        "risk_tier": p.get("riskTier"),
        "readmission_likelihood": p.get("readmissionLikelihood"),
        "readmission_probability": float(p.get("readmissionProbability") or 0),
        "risk_factors": p.get("riskFactors") or [],
        "care_recommendations": p.get("careRecommendations") or [],
        "discharge_readiness_score": float(p.get("dischargeReadinessScore") or 0),
        "last_assessment_date": p.get("lastAssessmentDate"),
    }


def db_patient_to_api(p: Patient) -> dict:
    """Convert a DB Patient row to the frontend-shaped (camelCase) record."""
    return {
        "id": p.id,
        "medicalRecordNumber": p.medical_record_number,
        "name": p.name,
        "age": p.age,
        "gender": p.gender,
        "race": p.race,
        "admissionType": p.admission_type,
        "dischargeDisposition": p.discharge_disposition,
        "admissionSource": p.admission_source,
        "timeInHospital": p.time_in_hospital,
        "numLabProcedures": p.num_lab_procedures,
        "numProcedures": p.num_procedures,
        "numMedications": p.num_medications,
        "numOutpatientVisits": p.num_outpatient_visits,
        "numInpatientVisits": p.num_inpatient_visits,
        "numEmergencyVisits": p.num_emergency_visits,
        "primaryDiagnosis": p.primary_diagnosis,
        "secondaryDiagnosis1": p.secondary_diagnosis1,
        "secondaryDiagnosis2": p.secondary_diagnosis2,
        "glucoseTest": p.glucose_test,
        "a1cResult": p.a1c_result,
        "medications": p.medications,
        "department": p.department,
        "assignedDoctor": p.assigned_doctor,
        "assignedDoctorId": p.assigned_doctor_id,
        "admissionDate": p.admission_date.isoformat() if p.admission_date else None,
        "dischargeDate": p.discharge_date.isoformat() if p.discharge_date else None,
        "riskScore": p.risk_score,
        "riskTier": p.risk_tier,
        "readmissionLikelihood": p.readmission_likelihood,
        "readmissionProbability": p.readmission_probability,
        "riskFactors": p.risk_factors,
        "careRecommendations": p.care_recommendations,
        "dischargeReadinessScore": p.discharge_readiness_score,
        "lastAssessmentDate": p.last_assessment_date.isoformat() if p.last_assessment_date else None,
    }


def api_audit_to_db(a: dict) -> dict:
    """Convert a frontend-shaped (camelCase) audit log to DB column values."""
    return {
        "id": a["id"],
        "timestamp": a["timestamp"],
        "user_email": a["userEmail"],
        "user_name": a["userName"],
        "user_role": a["userRole"],
        "action": a["action"],
        "target_patient_id": a.get("targetPatientId"),
        "details": a["details"],
    }


def db_audit_to_api(a: Any) -> dict:
    return {
        "id": a.id,
        "timestamp": a.timestamp,
        "userEmail": a.user_email,
        "userName": a.user_name,
        "userRole": a.user_role,
        "action": a.action,
        "targetPatientId": a.target_patient_id,
        "details": a.details,
    }


def build_patient_dict(data: dict, prediction: dict) -> dict:
    """Build a full frontend-shaped patient record from request data + model prediction."""
    return {
        "id": data.get("id") or f"PAT-{random.randint(10000, 99999)}",
        "medicalRecordNumber": data.get("medicalRecordNumber")
        or f"MRN-{random.randint(1000000, 9999999)}",
        "name": data.get("name") or "Anonymous Patient",
        "age": data.get("age") or "[60-70)",
        "gender": data.get("gender") or "Male",
        "race": data.get("race") or "Caucasian",
        "admissionType": data.get("admissionType") or "Emergency",
        "dischargeDisposition": data.get("dischargeDisposition") or "Discharged to Home",
        "admissionSource": data.get("admissionSource") or "Emergency Room",
        "timeInHospital": int(data.get("timeInHospital") or 4),
        "numLabProcedures": int(data.get("numLabProcedures") or 40),
        "numProcedures": int(data.get("numProcedures") or 1),
        "numMedications": int(data.get("numMedications") or 15),
        "numOutpatientVisits": int(data.get("numOutpatientVisits") or 0),
        "numInpatientVisits": int(data.get("numInpatientVisits") or 0),
        "numEmergencyVisits": int(data.get("numEmergencyVisits") or 0),
        "primaryDiagnosis": data.get("primaryDiagnosis") or "250.00 - Type 2 Diabetes Mellitus",
        "secondaryDiagnosis1": data.get("secondaryDiagnosis1") or "",
        "secondaryDiagnosis2": data.get("secondaryDiagnosis2") or "",
        "glucoseTest": data.get("glucoseTest") or "Normal",
        "a1cResult": data.get("a1cResult") or "Normal",
        "medications": data.get("medications") or dict(DEFAULT_MEDICATIONS),
        "department": data.get("department") or "Endocrinology",
        "assignedDoctor": data.get("assignedDoctor") or "Dr. Sarah Lin, MD",
        "assignedDoctorId": data.get("assignedDoctorId") or "u-doc-1",
        "admissionDate": data.get("admissionDate") or _today(),
        "dischargeDate": data.get("dischargeDate"),
        "riskScore": prediction["riskScore"],
        "riskTier": prediction["riskTier"],
        "readmissionLikelihood": prediction["readmissionLikelihood"],
        "readmissionProbability": prediction["readmissionProbability"],
        "riskFactors": prediction["riskFactors"],
        "careRecommendations": prediction["careRecommendations"],
        "dischargeReadinessScore": prediction["dischargeReadinessScore"],
        "lastAssessmentDate": _today(),
    }


def _today() -> str:
    from datetime import date

    return date.today().isoformat()
