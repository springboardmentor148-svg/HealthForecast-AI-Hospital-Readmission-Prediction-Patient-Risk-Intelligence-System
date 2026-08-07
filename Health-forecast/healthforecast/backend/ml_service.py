"""
Loads the trained XGBoost artifacts and turns a Patient record into a risk
prediction, using the exact same feature engineering as model/train_model.py.
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

# Resolve relative to this file's location (backend/../model) so this works
# regardless of which machine or OS the project is checked out on.
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "model")

# Loaded via XGBoost's native save_model/load_model (JSON), not joblib —
# this format is stable across XGBoost versions, unlike pickling the whole
# sklearn wrapper. See model/train_model.py for the corresponding save call.
model = XGBClassifier()
model.load_model(os.path.join(MODEL_DIR, "xgb_readmission_model.json"))
encoders = joblib.load(os.path.join(MODEL_DIR, "label_encoders.joblib"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_columns.joblib"))
with open(os.path.join(MODEL_DIR, "age_map.json")) as f:
    AGE_MAP = json.load(f)
with open(os.path.join(MODEL_DIR, "metrics.json")) as f:
    METRICS_BLOB = json.load(f)

MED_COLS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "examide", "citoglipton", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone",
]
MED_ORDINAL = {"No": 0, "Down": 1, "Steady": 2, "Up": 3}


def _map_icd9(code: str) -> str:
    if code is None or code == "Missing" or code == "":
        return "Missing"
    code = str(code)
    if code.startswith("V") or code.startswith("E"):
        return "Other"
    try:
        val = float(code)
    except ValueError:
        return "Other"
    if 390 <= val <= 459 or val == 785:
        return "Circulatory"
    if 460 <= val <= 519 or val == 786:
        return "Respiratory"
    if 520 <= val <= 579 or val == 787:
        return "Digestive"
    if 250 <= val < 251:
        return "Diabetes"
    if 800 <= val <= 999:
        return "Injury"
    if 710 <= val <= 739:
        return "Musculoskeletal"
    if 580 <= val <= 629 or val == 788:
        return "Genitourinary"
    if 140 <= val <= 239:
        return "Neoplasms"
    return "Other"


def _encode_cat(col: str, value: str) -> int:
    mapping = encoders[col]
    value = str(value)
    if value in mapping:
        return mapping[value]
    # Unseen category at inference time -> fall back to "Missing" if present,
    # else the most common code (0), rather than raising.
    return mapping.get("Missing", 0)


def build_feature_row(patient: dict) -> pd.DataFrame:
    row = {}
    row["race"] = _encode_cat("race", patient.get("race", "Missing"))
    row["gender"] = _encode_cat("gender", patient.get("gender", "Female"))
    row["admission_type_id"] = _encode_cat("admission_type_id", patient.get("admission_type_id", 1))
    row["discharge_disposition_id"] = _encode_cat("discharge_disposition_id", patient.get("discharge_disposition_id", 1))
    row["admission_source_id"] = _encode_cat("admission_source_id", patient.get("admission_source_id", 1))
    row["time_in_hospital"] = patient.get("time_in_hospital", 1)
    row["payer_code"] = _encode_cat("payer_code", patient.get("payer_code", "Missing"))
    row["medical_specialty"] = _encode_cat("medical_specialty", patient.get("medical_specialty", "Missing"))
    row["num_lab_procedures"] = patient.get("num_lab_procedures", 0)
    row["num_procedures"] = patient.get("num_procedures", 0)
    row["num_medications"] = patient.get("num_medications", 0)
    row["number_outpatient"] = patient.get("number_outpatient", 0)
    row["number_emergency"] = patient.get("number_emergency", 0)
    row["number_inpatient"] = patient.get("number_inpatient", 0)
    row["number_diagnoses"] = patient.get("number_diagnoses", 1)
    row["max_glu_serum"] = {"None": 0, "Norm": 1, ">200": 2, ">300": 3}.get(patient.get("max_glu_serum", "None"), 0)
    row["A1Cresult"] = {"None": 0, "Norm": 1, ">7": 2, ">8": 3}.get(patient.get("A1Cresult", "None"), 0)

    meds = patient.get("medications", {}) or {}
    for m in MED_COLS:
        row[m] = MED_ORDINAL.get(meds.get(m, "No"), 0)

    row["change"] = {"No": 0, "Ch": 1}.get(patient.get("change", "No"), 0)
    row["diabetesMed"] = {"No": 0, "Yes": 1}.get(patient.get("diabetesMed", "No"), 0)
    row["age_numeric"] = AGE_MAP.get(patient.get("age_bracket", "[50-60)"), 55)

    row["diag_1_group"] = _encode_cat("diag_1_group", _map_icd9(patient.get("diag_1", "Missing")))
    row["diag_2_group"] = _encode_cat("diag_2_group", _map_icd9(patient.get("diag_2", "Missing")))
    row["diag_3_group"] = _encode_cat("diag_3_group", _map_icd9(patient.get("diag_3", "Missing")))

    row["num_med_changes"] = sum(1 for m in MED_COLS if row[m] > 0)
    row["prior_visits_total"] = row["number_outpatient"] + row["number_emergency"] + row["number_inpatient"]

    return pd.DataFrame([row])[feature_cols]


RISK_RECOMMENDATIONS = {
    "High": [
        "Schedule a follow-up visit within 7 days of discharge",
        "Enroll patient in a care-transition / case-management program",
        "Conduct a medication reconciliation before discharge",
        "Provide patient education on symptom red-flags and when to seek care",
    ],
    "Medium": [
        "Schedule a follow-up visit within 14-30 days",
        "Confirm patient has access to prescribed medications",
        "Provide standard discharge instructions and a nurse call-back at 48 hours",
    ],
    "Low": [
        "Standard discharge planning",
        "Routine follow-up per primary care schedule",
    ],
}


def risk_category(score: float) -> str:
    if score >= 0.5:
        return "High"
    if score >= 0.25:
        return "Medium"
    return "Low"


def predict_risk(patient: dict) -> dict:
    X = build_feature_row(patient)
    prob = float(model.predict_proba(X)[0, 1])
    category = risk_category(prob)

    # Local, per-patient "top factors" — approximate contribution using the
    # model's global feature importances intersected with this patient's
    # non-default / notable values (lightweight explainability for the
    # Clinical Decision Support module).
    global_importances = METRICS_BLOB["top_features"]
    row = X.iloc[0].to_dict()
    top_factors = []
    for item in global_importances:
        f = item["feature"]
        top_factors.append({"feature": f, "importance": item["importance"], "value": row.get(f)})
    top_factors = top_factors[:6]

    return {
        "risk_score": round(prob, 4),
        "risk_category": category,
        "top_factors": top_factors,
        "care_recommendations": RISK_RECOMMENDATIONS[category],
    }


def get_model_metrics() -> dict:
    return METRICS_BLOB
