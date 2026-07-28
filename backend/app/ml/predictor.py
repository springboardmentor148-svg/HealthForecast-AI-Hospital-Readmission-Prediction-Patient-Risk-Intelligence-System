"""
Wraps the CatBoost model trained in HealthForecast_AI_Improved_Model.ipynb.

The model was trained directly on the raw (uncoded) Diabetes 130-US Hospitals
feature set, with CatBoost handling categorical columns natively via
`cat_features`. This module reproduces the exact same 43 columns, in the
exact same order, and applies the same "cast categoricals to str" step used
at training time, so predictions are consistent with the notebook.
"""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import pandas as pd

from ..core.config import settings

# Exact training feature order (from model.feature_names_)
FEATURE_COLUMNS: list[str] = [
    "race", "gender", "age", "admission_type_id", "discharge_disposition_id",
    "admission_source_id", "time_in_hospital", "num_lab_procedures",
    "num_procedures", "num_medications", "number_outpatient",
    "number_emergency", "number_inpatient", "diag_1", "diag_2", "diag_3",
    "number_diagnoses", "max_glu_serum", "A1Cresult", "metformin",
    "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "examide", "citoglipton", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone", "change",
    "diabetesMed",
]

CATEGORICAL_COLUMNS: list[str] = [
    "race", "gender", "age", "diag_1", "diag_2", "diag_3", "max_glu_serum",
    "A1Cresult", "metformin", "repaglinide", "nateglinide", "chlorpropamide",
    "glimepiride", "acetohexamide", "glipizide", "glyburide", "tolbutamide",
    "pioglitazone", "rosiglitazone", "acarbose", "miglitol", "troglitazone",
    "tolazamide", "examide", "citoglipton", "insulin",
    "glyburide-metformin", "glipizide-metformin",
    "glimepiride-pioglitazone", "metformin-rosiglitazone",
    "metformin-pioglitazone", "change", "diabetesMed",
]

NUMERIC_COLUMNS = [c for c in FEATURE_COLUMNS if c not in CATEGORICAL_COLUMNS]


class ReadmissionPredictor:
    _instance: "ReadmissionPredictor | None" = None

    def __init__(self, model_path: Path):
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

    @classmethod
    def get(cls) -> "ReadmissionPredictor":
        if cls._instance is None:
            cls._instance = cls(settings.MODEL_PATH)
        return cls._instance

    def _to_frame(self, payload: dict[str, Any]) -> pd.DataFrame:
        row = {col: payload.get(col) for col in FEATURE_COLUMNS}
        df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
        for c in CATEGORICAL_COLUMNS:
            df[c] = df[c].astype(str)
        for c in NUMERIC_COLUMNS:
            df[c] = pd.to_numeric(df[c], errors="coerce")
        return df

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        df = self._to_frame(payload)
        proba = float(self.model.predict_proba(df)[0][1])
        category, recommendations = self._categorize(proba, payload)
        return {
            "readmission_probability": round(proba, 4),
            "risk_category": category,
            "recommendations": recommendations,
        }

    @staticmethod
    def _categorize(proba: float, payload: dict[str, Any]) -> tuple[str, list[str]]:
        if proba >= 0.65:
            category = "Critical"
        elif proba >= 0.45:
            category = "High"
        elif proba >= 0.25:
            category = "Medium"
        else:
            category = "Low"

        recs: list[str] = []
        if category in ("Critical", "High"):
            recs.append("Schedule a follow-up visit within 7 days of discharge.")
            recs.append("Enroll patient in a care-transition / home-health program.")
        if category in ("Critical",):
            recs.append("Flag for case-manager review prior to discharge.")
        try:
            if int(payload.get("number_inpatient", 0)) >= 2:
                recs.append("Review recent inpatient history for recurring admission triggers.")
        except (TypeError, ValueError):
            pass
        try:
            if int(payload.get("number_emergency", 0)) >= 2:
                recs.append("Coordinate with ED to address recurring emergency visits.")
        except (TypeError, ValueError):
            pass
        if str(payload.get("diabetesMed")) == "Yes" and str(payload.get("change")) == "Ch":
            recs.append("Medication regimen was recently changed — schedule medication reconciliation.")
        if not recs:
            recs.append("Continue standard discharge planning and routine follow-up.")
        return category, recs
