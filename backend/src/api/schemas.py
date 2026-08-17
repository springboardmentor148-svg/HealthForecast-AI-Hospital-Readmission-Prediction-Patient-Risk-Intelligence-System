import re
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


VALID_AGE_BRACKETS = frozenset({
    "[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)",
    "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)",
})

VALID_ADMISSION_TYPES = frozenset({
    "Emergency", "Urgent", "Elective", "Newborn", "Not Available",
    "Unknown", "Trauma Center", "Not Mapped",
})

VALID_DISCHARGE_DISPOSITIONS = frozenset({
    "Discharged to Home",
    "Discharged/transferred to another short-term hospital",
    "SNF (Skilled Nursing Facility)",
    "Discharged/transferred to ICF",
    "Discharged/transferred to another inpatient care",
    "Discharged to Home with Home Health",
    "Left against medical advice",
    "Discharged/transferred to home under Home IV provider",
    "Admitted as inpatient",
    "Expired",
    "Re-admitted to Acute Care",
})

VALID_ADMISSION_SOURCES = frozenset({
    "Physician Referral", "Clinic Referral", "HMO Referral",
    "Transfer from a hospital", "Transfer from SNF",
    "Transfer from another health care facility", "Emergency Room",
    "Court/Law Enforcement", "Information not available",
    "Transfer from critical access hospital",
})

ICD9_PATTERN = re.compile(r"^\d{3}(\.\d{1,2})?$")


class MedicationStatus(BaseModel):
    insulin: Literal["No", "Steady", "Up", "Down"] = "No"
    metformin: Literal["No", "Steady", "Up", "Down"] = "No"
    glipizide: Literal["No", "Steady", "Up", "Down"] = "No"
    glyburide: Literal["No", "Steady", "Up", "Down"] = "No"
    changeInDiabetesMed: Literal["No", "Ch"] = "No"
    diabetesMedPrescribed: Literal["Yes", "No"] = "No"

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "insulin": "Up",
                    "metformin": "Steady",
                    "glipizide": "No",
                    "glyburide": "No",
                    "changeInDiabetesMed": "No",
                    "diabetesMedPrescribed": "Yes",
                }
            ]
        }
    }


class RiskFactor(BaseModel):
    factor: str = Field(description="Name of the risk factor")
    impactPercent: float = Field(description="Percentage contribution to overall risk (can be negative for protective factors)")
    description: str = Field(description="Human-readable explanation of this factor")
    category: Literal["clinical", "utilization", "lab", "medication"]


class PredictionRequest(BaseModel):
    age: str = Field(
        default="[60-70)",
        description="Age range bracket in [lower-upper) format",
        examples=["[60-70)", "[70-80)", "[50-60)"],
    )
    gender: Literal["Male", "Female", "Unknown"] = "Male"
    race: str = Field(default="Caucasian", description="Patient race/ethnicity")
    admissionType: str = Field(
        default="Emergency",
        description="Type of hospital admission",
    )
    dischargeDisposition: str = Field(
        default="Discharged to Home",
        description="Discharge destination/status",
    )
    admissionSource: str = Field(
        default="Emergency Room",
        description="Source of admission referral",
    )
    timeInHospital: int = Field(
        default=4, ge=1, le=14,
        description="Length of hospital stay in days",
    )
    numLabProcedures: int = Field(default=40, ge=0, description="Number of lab procedures performed")
    numProcedures: int = Field(default=1, ge=0, description="Number of non-lab procedures")
    numMedications: int = Field(default=15, ge=0, description="Number of active prescription medications")
    numOutpatientVisits: int = Field(default=0, ge=0, description="Prior outpatient visits in past 12 months")
    numInpatientVisits: int = Field(default=0, ge=0, description="Prior inpatient admissions in past 12 months")
    numEmergencyVisits: int = Field(default=0, ge=0, description="Prior ER visits in past 12 months")
    numberDiagnoses: Optional[int] = Field(default=None, ge=1, description="Number of recorded diagnoses")
    primaryDiagnosis: str = Field(default="", description="Primary ICD-9 diagnosis code and description")
    secondaryDiagnosis1: str = Field(default="", description="Secondary ICD-9 diagnosis code and description")
    secondaryDiagnosis2: str = Field(default="", description="Tertiary ICD-9 diagnosis code and description")
    glucoseTest: Literal["None", "Normal", ">200", ">300"] = "Normal"
    a1cResult: Literal["None", "Normal", ">7", ">8"] = "Normal"
    medicalSpecialty: Optional[str] = Field(default=None, description="Attending medical specialty")
    payerCode: Optional[str] = Field(default=None, description="Insurance payer code")
    weight: Optional[str] = Field(default=None, description="Patient weight range")
    medications: MedicationStatus = MedicationStatus()

    @field_validator("age")
    @classmethod
    def validate_age_format(cls, v: str) -> str:
        if v not in VALID_AGE_BRACKETS:
            valid = sorted(VALID_AGE_BRACKETS, key=lambda x: int(x.strip("[]()").split("-")[0]))
            raise ValueError(
                f"Invalid age bracket '{v}'. Must be one of: {', '.join(valid)}"
            )
        return v

    @field_validator("admissionType")
    @classmethod
    def validate_admission_type(cls, v: str) -> str:
        if v not in VALID_ADMISSION_TYPES:
            raise ValueError(
                f"Invalid admissionType '{v}'. Must be one of: "
                f"{', '.join(sorted(VALID_ADMISSION_TYPES))}"
            )
        return v

    @field_validator("dischargeDisposition")
    @classmethod
    def validate_discharge_disposition(cls, v: str) -> str:
        if v not in VALID_DISCHARGE_DISPOSITIONS:
            raise ValueError(
                f"Invalid dischargeDisposition '{v}'. Must be one of: "
                f"{', '.join(sorted(VALID_DISCHARGE_DISPOSITIONS))}"
            )
        return v

    @field_validator("admissionSource")
    @classmethod
    def validate_admission_source(cls, v: str) -> str:
        if v not in VALID_ADMISSION_SOURCES:
            raise ValueError(
                f"Invalid admissionSource '{v}'. Must be one of: "
                f"{', '.join(sorted(VALID_ADMISSION_SOURCES))}"
            )
        return v

    @field_validator("primaryDiagnosis", "secondaryDiagnosis1", "secondaryDiagnosis2")
    @classmethod
    def validate_icd9_format(cls, v: str) -> str:
        if v and v.strip():
            code_part = v.split(" - ")[0].strip()
            if not ICD9_PATTERN.match(code_part):
                raise ValueError(
                    f"Diagnosis must start with a valid ICD-9 code (e.g. '250.02 - Type 2 Diabetes'), "
                    f"got '{code_part}'"
                )
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "age": "[60-70)",
                    "gender": "Male",
                    "race": "Caucasian",
                    "admissionType": "Emergency",
                    "dischargeDisposition": "Discharged to Home",
                    "admissionSource": "Emergency Room",
                    "timeInHospital": 4,
                    "numLabProcedures": 40,
                    "numProcedures": 1,
                    "numMedications": 15,
                    "numOutpatientVisits": 0,
                    "numInpatientVisits": 0,
                    "numEmergencyVisits": 0,
                    "numberDiagnoses": None,
                    "primaryDiagnosis": "250.02 - Type 2 Diabetes w/ Uncontrolled Hyperglycemia",
                    "secondaryDiagnosis1": "",
                    "secondaryDiagnosis2": "",
                    "glucoseTest": "Normal",
                    "a1cResult": "Normal",
                    "medicalSpecialty": None,
                    "payerCode": None,
                    "weight": None,
                    "medications": {
                        "insulin": "No",
                        "metformin": "No",
                        "glipizide": "No",
                        "glyburide": "No",
                        "changeInDiabetesMed": "No",
                        "diabetesMedPrescribed": "No",
                    },
                }
            ]
        }
    }


class PatientCreateRequest(PredictionRequest):
    """Prediction request extended with the non-model fields stored on a patient record."""

    name: str = Field(default="", description="Patient full name")
    department: str = Field(default="", description="Clinical department")
    medicalRecordNumber: Optional[str] = Field(
        default=None, description="Medical record number (generated when absent)"
    )


class PredictionResponse(BaseModel):
    riskScore: float = Field(
        ..., ge=0, le=100,
        description="Overall readmission risk score (0-100)",
        examples=[72.3, 45.0, 88.1],
    )
    riskTier: Literal["Low", "Medium", "High", "Critical"]
    readmissionLikelihood: Literal["<30 Days", ">30 Days", "No Readmission"]
    readmissionProbability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Raw readmission probability (0.0-1.0)",
    )
    dischargeReadinessScore: float = Field(
        ..., ge=0, le=100,
        description="Discharge readiness score (0-100, higher = more ready)",
    )
    prediction: Literal[0, 1]
    riskFactors: list[RiskFactor]
    careRecommendations: list[str]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "riskScore": 72.3,
                    "riskTier": "High",
                    "readmissionLikelihood": "<30 Days",
                    "readmissionProbability": 0.7234,
                    "dischargeReadinessScore": 37.7,
                    "prediction": 1,
                    "riskFactors": [
                        {
                            "factor": "High Prior Inpatient Admissions (>=3)",
                            "impactPercent": 28.0,
                            "description": "3 prior hospital stays in past 12 mo",
                            "category": "utilization",
                        },
                        {
                            "factor": "Elevated HbA1c (>8%)",
                            "impactPercent": 18.0,
                            "description": "Severe chronic glycemic dysregulation",
                            "category": "lab",
                        },
                    ],
                    "careRecommendations": [
                        "Schedule post-discharge primary/specialist consultation within 48 hours",
                        "Enroll in Telehealth Continuous Glucose & Vital Signs Monitoring",
                        "Clinical pharmacist reconciliation of discharge prescription list",
                        "Home Health Nursing visit on Day 2 post-discharge for insulin administration audit",
                    ],
                }
            ]
        }
    }
