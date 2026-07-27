"""
Preprocessing pipeline for the real trained XGBoost model.

The model (best_xgboost.pkl) was trained on the UCI Diabetes 130-US Hospitals
dataset and expects 2361 features — a mix of numeric columns and one-hot encoded
categorical columns.

This module:
  1. Loads the feature list once from feature_names.json
  2. Maps API clinical-input fields to the model's expected columns
  3. Returns a single-row DataFrame ready for model.predict_proba()
"""

from __future__ import annotations

import json
import os
from typing import Any, Mapping

import numpy as np
import pandas as pd

# ── Load feature list (once at import time) ────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
_FEATURE_NAMES_PATH = os.path.join(_HERE, "feature_names.json")

with open(_FEATURE_NAMES_PATH, "r") as _f:
    FEATURE_NAMES: list[str] = json.load(_f)

# ── Admission type mapping (API string → model integer ID) ─────────────────
# UCI dataset: 1=Emergency, 2=Urgent, 3=Elective, 4=Newborn, 5-8=Not Available
ADMISSION_TYPE_MAP: dict[str, int] = {
    "emergency": 1, "urgent": 2, "elective": 3,
    "newborn": 4, "not available": 5, "not mapped": 6,
    "null": 5, "": 5,
}

# ── Discharge disposition mapping ──────────────────────────────────────────
# UCI: 1=Home, 2-11=various transfers/SNF, 18=Expired, 19=Hospice, etc.
DISCHARGE_MAP: dict[str, int] = {
    "home": 1, "transferred": 2, "expired": 11,
    "left ama": 7, "other": 18, "": 18,
}

# ── Admission source mapping ────────────────────────────────────────────────
# UCI: 1=Referral, 2=Direct, 3=Emergency Room, 4=Transfer, etc.
ADMISSION_SOURCE_MAP: dict[str, int] = {
    "referral": 1, "direct admission": 2,
    "emergency room": 7, "transfer": 4, "other": 9, "": 9,
}

# ── Age bin → column name ──────────────────────────────────────────────────
# model columns: age__0-10), age__10-20), ..., age__90-100)
def _age_bin_col(age: int | None) -> str:
    if age is None:
        return "age__50-60)"   # default to mid-range
    age = max(0, min(99, age))
    decade = (age // 10) * 10
    return f"age__{decade}-{decade + 10})"


# ── One-hot helpers ────────────────────────────────────────────────────────
def _set_one_hot(row: dict, prefix: str, value: str | None, sep: str = "_") -> None:
    """Set the matching one-hot column to 1, leave all others at 0."""
    if value is None:
        return
    col = f"{prefix}{sep}{value}"
    if col in row:
        row[col] = 1.0


# ── Drug normalization ─────────────────────────────────────────────────────
# All drug columns follow pattern: drugname_No/Down/Steady/Up
_ALL_DRUG_COLS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide",
    "glimepiride", "acetohexamide", "glipizide", "glyburide",
    "tolbutamide", "pioglitazone", "rosiglitazone", "acarbose",
    "miglitol", "troglitazone", "tolazamide", "examide",
    "citoglipton", "insulin",
    "glyburide-metformin", "glipizide-metformin",
    "glimepiride-pioglitazone", "metformin-rosiglitazone",
    "metformin-pioglitazone",
]


def build_feature_frame(data: Mapping[str, Any]) -> pd.DataFrame:
    """
    Map raw clinical data (from API / Patient record) into a single-row
    DataFrame with the exact 2361 columns the XGBoost model expects.

    All columns default to 0; only the matching one-hot columns are set to 1.
    """
    # Start with all zeros
    row: dict[str, float] = {col: 0.0 for col in FEATURE_NAMES}

    # ── Numeric fields ────────────────────────────────────────────────────
    def _int(key: str, default: int = 0) -> int:
        v = data.get(key)
        try:
            return int(v) if v is not None else default
        except (TypeError, ValueError):
            return default

    row["admission_type_id"] = float(
        ADMISSION_TYPE_MAP.get(str(data.get("admission_type") or "").strip().lower(), 5)
    )
    row["discharge_disposition_id"] = float(
        DISCHARGE_MAP.get(str(data.get("discharge_disposition") or "").strip().lower(), 18)
    )
    row["admission_source_id"] = float(
        ADMISSION_SOURCE_MAP.get(str(data.get("admission_source") or "").strip().lower(), 9)
    )
    row["time_in_hospital"]    = float(_int("time_in_hospital", 4))
    row["num_lab_procedures"]  = float(_int("num_lab_procedures", 40))
    row["num_procedures"]      = float(_int("num_procedures", 1))
    row["num_medications"]     = float(_int("num_medications", 15))
    row["number_outpatient"]   = float(_int("number_outpatient", 0))
    row["number_emergency"]    = float(_int("number_emergency", 0))
    row["number_inpatient"]    = float(_int("number_inpatient", 0))
    row["number_diagnoses"]    = float(_int("number_diagnoses", 9))

    # ── Race ──────────────────────────────────────────────────────────────
    race_raw = str(data.get("race") or "").strip().lower()
    race_map = {
        "caucasian": "Caucasian",
        "african american": "AfricanAmerican",
        "hispanic": "Hispanic",
        "asian": "Asian",
        "other": "Other",
    }
    race_col = race_map.get(race_raw)
    if race_col:
        _set_one_hot(row, "race", race_col)

    # ── Gender ────────────────────────────────────────────────────────────
    gender_raw = str(data.get("gender") or "").strip().lower()
    gender_map = {"male": "Male", "female": "Female"}
    gender_col = gender_map.get(gender_raw, "Unknown/Invalid")
    _set_one_hot(row, "gender", gender_col)

    # ── Age bin ───────────────────────────────────────────────────────────
    age_col = _age_bin_col(data.get("age"))  # type: ignore[arg-type]
    if age_col in row:
        row[age_col] = 1.0

    # ── A1C result ────────────────────────────────────────────────────────
    # model columns: A1Cresult__7, A1Cresult__8, A1Cresult_Norm
    a1c_raw = str(data.get("a1c_result") or "").strip()
    a1c_map = {">7": "A1Cresult__7", ">8": "A1Cresult__8", "norm": "A1Cresult_Norm", "Norm": "A1Cresult_Norm"}
    a1c_col = a1c_map.get(a1c_raw)
    if a1c_col and a1c_col in row:
        row[a1c_col] = 1.0

    # ── Max glucose serum ─────────────────────────────────────────────────
    # model columns: max_glu_serum__200, max_glu_serum__300, max_glu_serum_Norm
    glu_raw = str(data.get("glucose_result") or "").strip()
    glu_map = {">200": "max_glu_serum__200", ">300": "max_glu_serum__300", "norm": "max_glu_serum_Norm", "Norm": "max_glu_serum_Norm"}
    glu_col = glu_map.get(glu_raw)
    if glu_col and glu_col in row:
        row[glu_col] = 1.0

    # ── Insulin ───────────────────────────────────────────────────────────
    insulin_raw = str(data.get("insulin") or "No").strip().capitalize()
    insulin_col = f"insulin_{insulin_raw}"
    if insulin_col in row:
        row[insulin_col] = 1.0
    else:
        row["insulin_No"] = 1.0

    # ── Diabetes medication ───────────────────────────────────────────────
    dm_raw = str(data.get("diabetes_med") or "No").strip().capitalize()
    dm_col = f"diabetesMed_{dm_raw}"
    if dm_col in row:
        row[dm_col] = 1.0
    else:
        row["diabetesMed_No"] = 1.0

    # ── Medication change ─────────────────────────────────────────────────
    # Default: no change
    if "change_No" in row:
        row["change_No"] = 1.0

    # ── All other drug columns → default to "No" ──────────────────────────
    for drug in _ALL_DRUG_COLS:
        if drug == "insulin":
            continue   # already handled above
        no_col = f"{drug}_No"
        if no_col in row and not any(row.get(f"{drug}_{s}", 0) for s in ("Down", "Steady", "Up")):
            row[no_col] = 1.0

    # ── Diagnoses (ICD-9 codes as strings) ───────────────────────────────
    for diag_field, prefix in [("diagnosis_1", "diag_1"), ("diagnosis_2", "diag_2"), ("diagnosis_3", "diag_3")]:
        diag_val = str(data.get(diag_field) or "").strip().split(".")[0]  # strip decimals
        if diag_val:
            col = f"{prefix}_{diag_val}"
            if col in row:
                row[col] = 1.0

    # ── Build DataFrame in exact column order ─────────────────────────────
    df = pd.DataFrame([row], columns=FEATURE_NAMES)
    return df.astype(np.float32)


# ── Risk thresholds ────────────────────────────────────────────────────────
def risk_category_from_probability(probability: float) -> str:
    """Map readmission probability to a discrete risk band."""
    if probability >= 0.75:
        return "critical"
    if probability >= 0.50:
        return "high"
    if probability >= 0.25:
        return "moderate"
    return "low"


def recommendation_from_risk(risk_category: str) -> str:
    recommendations = {
        "critical": (
            "Immediate clinical review recommended. Consider intensive "
            "discharge planning, close follow-up within 48-72 hours, and "
            "medication reconciliation."
        ),
        "high": (
            "Schedule a follow-up visit within 7 days of discharge and "
            "review medication adherence and home-care support."
        ),
        "moderate": (
            "Routine follow-up within 2-3 weeks recommended. Monitor "
            "for changes in condition."
        ),
        "low": "Standard discharge protocol. No additional intervention indicated.",
    }
    return recommendations.get(risk_category, "Clinical judgement recommended.")
