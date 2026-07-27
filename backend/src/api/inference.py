import logging
import re
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from src.pipeline.preprocessing import clean_df, engineer_features, get_feature_target
from src.pipeline.config import AGE_MAP, MODELS_DIR

logger = logging.getLogger(__name__)


ADMISSION_TYPE_MAP = {
    "Emergency": 1,
    "Urgent": 2,
    "Elective": 3,
    "Newborn": 4,
    "Not Available": 5,
    "Unknown": 6,
    "Trauma Center": 7,
    "Not Mapped": 8,
}

DISCHARGE_DISPOSITION_MAP = {
    "Discharged to Home": 1,
    "Discharged/transferred to another short-term hospital": 2,
    "SNF (Skilled Nursing Facility)": 3,
    "Discharged/transferred to ICF": 4,
    "Discharged/transferred to another inpatient care": 5,
    "Discharged to Home with Home Health": 6,
    "Left against medical advice": 7,
    "Discharged/transferred to home under Home IV provider": 8,
    "Admitted as inpatient": 9,
    "Expired": 11,
    "Re-admitted to Acute Care": 9,
}

ADMISSION_SOURCE_MAP = {
    "Physician Referral": 1,
    "Clinic Referral": 2,
    "HMO Referral": 3,
    "Transfer from a hospital": 4,
    "Transfer from SNF": 5,
    "Transfer from another health care facility": 6,
    "Emergency Room": 7,
    "Court/Law Enforcement": 8,
    "Information not available": 9,
    "Transfer from critical access hospital": 10,
}

ALL_MEDICATION_COLS = [
    "insulin", "metformin", "repaglinide", "nateglinide", "chlorpropamide",
    "glimepiride", "acetohexamide", "glipizide", "glyburide", "tolbutamide",
    "pioglitazone", "rosiglitazone", "acarbose", "miglitol", "troglitazone",
    "tolazamide", "examide", "citoglipton", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone",
]


def _extract_icd9_code(diagnosis_str: str) -> str:
    if not diagnosis_str or diagnosis_str.strip() == "":
        return "?"
    diagnosis_str = diagnosis_str.strip()
    parts = re.split(r"\s+-\s+", diagnosis_str, maxsplit=1)
    code = parts[0].strip()
    return code


def _build_dataframe(data: dict) -> pd.DataFrame:
    meds = data.get("medications", {}) or {}
    raw = {
        "age": data.get("age", "[60-70)"),
        "race": data.get("race", "Caucasian"),
        "gender": data.get("gender", "Male"),
        "time_in_hospital": int(data.get("timeInHospital", 4)),
        "num_lab_procedures": int(data.get("numLabProcedures", 40)),
        "num_procedures": int(data.get("numProcedures", 1)),
        "num_medications": int(data.get("numMedications", 15)),
        "number_outpatient": int(data.get("numOutpatientVisits", 0)),
        "number_emergency": int(data.get("numEmergencyVisits", 0)),
        "number_inpatient": int(data.get("numInpatientVisits", 0)),
        "number_diagnoses": int(data.get("numberDiagnoses", 5) or 5),
        "admission_type_id": ADMISSION_TYPE_MAP.get(
            data.get("admissionType", "Emergency"), 6
        ),
        "discharge_disposition_id": DISCHARGE_DISPOSITION_MAP.get(
            data.get("dischargeDisposition", "Discharged to Home"), 1
        ),
        "admission_source_id": ADMISSION_SOURCE_MAP.get(
            data.get("admissionSource", "Emergency Room"), 9
        ),
        "max_glu_serum": data.get("glucoseTest", "Normal"),
        "A1Cresult": data.get("a1cResult", "Normal"),
        "diag_1": _extract_icd9_code(data.get("primaryDiagnosis", "")),
        "diag_2": _extract_icd9_code(data.get("secondaryDiagnosis1", "")),
        "diag_3": _extract_icd9_code(data.get("secondaryDiagnosis2", "")),
        "change": meds.get("changeInDiabetesMed", "No"),
        "diabetesMed": meds.get("diabetesMedPrescribed", "No"),
        "medical_specialty": data.get("medicalSpecialty") or "?",
        "payer_code": data.get("payerCode") or "?",
        "weight": data.get("weight") or "?",
    }
    for drug in ALL_MEDICATION_COLS:
        raw[drug] = meds.get(drug, "No")
    return pd.DataFrame([raw])


DEFAULT_FEATURE_VALUES: dict = {
    "repaglinide": "No",
    "nateglinide": "No",
    "chlorpropamide": "No",
    "glimepiride": "No",
    "acetohexamide": "No",
    "tolbutamide": "No",
    "pioglitazone": "No",
    "rosiglitazone": "No",
    "acarbose": "No",
    "miglitol": "No",
    "troglitazone": "No",
    "tolazamide": "No",
    "examide": "No",
    "citoglipton": "No",
    "glyburide-metformin": "No",
    "glipizide-metformin": "No",
    "glimepiride-pioglitazone": "No",
    "metformin-rosiglitazone": "No",
    "metformin-pioglitazone": "No",
    "payer_code": "?",
    "weight": "?",
    "medical_specialty": "?",
    "number_diagnoses": 5,
    "race": "Unknown",
    "gender": "Unknown",
    "change": "No",
    "diabetesMed": "No",
    "max_glu_serum": "Not Tested",
    "A1Cresult": "Not Tested",
}

REQUIRED_FEATURES = [
    "age", "time_in_hospital", "num_lab_procedures", "num_procedures",
    "num_medications", "number_outpatient", "number_emergency",
    "number_inpatient", "number_diagnoses",
    "admission_type_id", "discharge_disposition_id", "admission_source_id",
    "race", "gender", "medical_specialty", "change", "diabetesMed",
    "max_glu_serum", "A1Cresult", "insulin", "metformin",
    "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide",
    "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
    "troglitazone", "tolazamide", "examide", "citoglipton",
    "glyburide-metformin", "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone",
    "payer_code", "weight",
    "diag_1_cat", "diag_2_cat", "diag_3_cat",
]


def _fill_missing_features(df: pd.DataFrame) -> pd.DataFrame:
    for col, default in DEFAULT_FEATURE_VALUES.items():
        if col not in df.columns:
            df[col] = default
    for col in REQUIRED_FEATURES:
        if col not in df.columns:
            df[col] = DEFAULT_FEATURE_VALUES.get(col, None)
    return df[REQUIRED_FEATURES]


def _map_glucose(value: str) -> str:
    mapping = {
        "None": "Not Tested",
        "Normal": "Norm",
        ">200": ">200",
        ">300": ">300",
        "Not Tested": "Not Tested",
        "Norm": "Norm",
    }
    return mapping.get(value, "Not Tested")


def _map_a1c(value: str) -> str:
    mapping = {
        "None": "Not Tested",
        "Normal": "Norm",
        ">7": ">7",
        ">8": ">8",
        "Not Tested": "Not Tested",
        "Norm": "Norm",
    }
    return mapping.get(value, "Not Tested")


def _compute_risk_tier(probability: float) -> str:
    if probability >= 0.80:
        return "Critical"
    if probability >= 0.65:
        return "High"
    if probability >= 0.45:
        return "Medium"
    return "Low"


def _compute_readmission_likelihood(probability: float, prediction: int) -> str:
    if prediction == 0:
        return "No Readmission"
    if probability >= 0.75:
        return "<30 Days"
    return ">30 Days"


def _build_care_recommendations(risk_tier: str, probability: float) -> list[str]:
    recs = [
        "Schedule post-discharge primary/specialist consultation within "
        f"{'48 hours' if probability > 0.7 else '7 days'}",
    ]
    if probability > 0.6:
        recs.append(
            "Enroll in Telehealth Continuous Glucose & Vital Signs Monitoring"
        )
    else:
        recs.append(
            "Provide standard diabetes self-management education packet"
        )
    recs.append(
        "Clinical pharmacist reconciliation of discharge prescription list"
    )
    if probability > 0.75:
        recs.append(
            "Home Health Nursing visit on Day 2 post-discharge "
            "for insulin administration audit"
        )
    else:
        recs.append("Routine 30-day follow-up lab panel")
    return recs


class InferenceService:
    def __init__(self, model_path: Path = None, pipeline_path: Path = None):
        model_path = model_path or MODELS_DIR / "xgboost_best.pkl"
        pipeline_path = pipeline_path or MODELS_DIR / "preprocessing_pipeline.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not pipeline_path.exists():
            raise FileNotFoundError(f"Pipeline file not found: {pipeline_path}")
        logger.info("Loading model from %s", model_path)
        self.model = joblib.load(model_path)
        logger.info("Loading pipeline from %s", pipeline_path)
        self.pipeline = joblib.load(pipeline_path)
        logger.info(
            "InferenceService ready: %s with %d features",
            type(self.model).__name__,
            self.model.n_features_in_,
        )

    def predict(self, data: dict) -> dict:
        logger.debug("Predict called: age=%s, gender=%s", data.get("age"), data.get("gender"))
        df = _build_dataframe(data)

        df["max_glu_serum"] = df["max_glu_serum"].apply(_map_glucose)
        df["A1Cresult"] = df["A1Cresult"].apply(_map_a1c)

        df = clean_df(df)
        df = engineer_features(df)

        df = _fill_missing_features(df)

        X = self.pipeline.transform(df)

        prediction = int(self.model.predict(X)[0])
        probability = float(self.model.predict_proba(X)[0, 1])
        risk_score = round(probability * 100, 1)
        risk_tier = _compute_risk_tier(probability)
        readmission_likelihood = _compute_readmission_likelihood(probability, prediction)
        readiness = round(max(10, min(95, 100 - risk_score + 10)), 1)

        risk_factors = self._build_risk_factors(data, probability)
        recommendations = _build_care_recommendations(risk_tier, probability)

        return {
            "riskScore": risk_score,
            "riskTier": risk_tier,
            "readmissionLikelihood": readmission_likelihood,
            "readmissionProbability": round(probability, 4),
            "dischargeReadinessScore": readiness,
            "prediction": prediction,
            "riskFactors": risk_factors,
            "careRecommendations": recommendations,
        }

    def _build_risk_factors(self, data: dict, probability: float) -> list[dict]:
        factors = []
        inp = data.get("numInpatientVisits", 0)
        if inp >= 3:
            factors.append({
                "factor": "High Prior Inpatient Admissions (>=3)",
                "impactPercent": 28,
                "description": f"{inp} prior hospital stays in past 12 mo",
                "category": "utilization",
            })
        er = data.get("numEmergencyVisits", 0)
        if er >= 2:
            factors.append({
                "factor": "Multiple Emergency Room Visits (>=2)",
                "impactPercent": 20,
                "description": f"{er} ER visits indicating fragile outpatient management",
                "category": "utilization",
            })
        a1c = data.get("a1cResult", "Normal")
        if a1c == ">8":
            factors.append({
                "factor": "Elevated HbA1c (>8%)",
                "impactPercent": 18,
                "description": "Severe chronic glycemic dysregulation",
                "category": "lab",
            })
        elif a1c == ">7":
            factors.append({
                "factor": "Moderate HbA1c Elevation (>7%)",
                "impactPercent": 8,
                "description": "Sub-optimal blood glucose control",
                "category": "lab",
            })
        glucose = data.get("glucoseTest", "Normal")
        if glucose == ">300":
            factors.append({
                "factor": "Acute Glucose Elevation (>300 mg/dL)",
                "impactPercent": 12,
                "description": "Acute inpatient hyperglycemia",
                "category": "lab",
            })
        meds = data.get("medications", {}) or {}
        med_count = data.get("numMedications", 0)
        if med_count > 20:
            factors.append({
                "factor": "Severe Polypharmacy (>20 Meds)",
                "impactPercent": 12,
                "description": f"{med_count} active prescription drugs",
                "category": "medication",
            })
        elif med_count > 12:
            factors.append({
                "factor": "Polypharmacy (12-20 Meds)",
                "impactPercent": 6,
                "description": f"{med_count} active medications",
                "category": "medication",
            })
        if meds.get("insulin") == "Up":
            factors.append({
                "factor": "Rapid Insulin Dosage Escalation",
                "impactPercent": 15,
                "description": "Inpatient insulin requirement increased",
                "category": "medication",
            })
        los = data.get("timeInHospital", 1)
        if los >= 7:
            factors.append({
                "factor": "Extended Length of Stay (>=7 Days)",
                "impactPercent": 10,
                "description": f"Inpatient stay of {los} days",
                "category": "utilization",
            })
        out = data.get("numOutpatientVisits", 0)
        if out >= 2:
            factors.append({
                "factor": "Active Outpatient Engagement",
                "impactPercent": -10,
                "description": f"{out} outpatient appointments attended",
                "category": "utilization",
            })
        overall_pct = round(
            max(5, sum(abs(f["impactPercent"]) for f in factors)),
            1,
        )
        return factors
