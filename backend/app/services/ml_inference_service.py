from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
import numpy as np

for _alias, _target in {
    "long": "int_",
    "ulong": "uint",
    "int": "int_",
    "float": "float64",
    "complex": "complex128",
}.items():
    if not hasattr(np, _alias) and hasattr(np, _target):
        setattr(np, _alias, getattr(np, _target))

from ..errors import APIError
from ..models import AdmissionType, Gender, RiskBand

MODEL_NAME = "Weighted Stacking Ensemble"
MODEL_VERSION = "v1.2"
DEFAULT_THRESHOLD = Decimal("0.15")
DATASET_FILENAME = "dataset/diabetic_data.csv"
DEFAULT_DISCHARGE_DISPOSITION_ID = 1.0
DEFAULT_ADMISSION_SOURCE_ID = 7.0
DIAGNOSIS_COLUMNS = ("diag_1", "diag_2", "diag_3")
_DIAGNOSIS_CODE_PATTERN = re.compile(r"\b([VE]?\d{1,3}(?:\.\d+)?)\b", re.IGNORECASE)
_MEDICATION_NORMALIZER = re.compile(r"[^a-z0-9-]+")
_FEATURE_NAME_CLEANUP = re.compile(r"[^A-Za-z0-9_]")

MEDICATION_FAMILIES: dict[str, tuple[str, tuple[str, ...]]] = {
    "metformin": ("metformin", ("No", "Steady", "Up")),
    "repaglinide": ("repaglinide", ("No", "Steady", "Up")),
    "nateglinide": ("nateglinide", ("No", "Steady", "Up")),
    "chlorpropamide": ("chlorpropamide", ("No", "Steady", "Up")),
    "glimepiride": ("glimepiride", ("No", "Steady", "Up")),
    "acetohexamide": ("acetohexamide", ("Steady",)),
    "glipizide": ("glipizide", ("No", "Steady", "Up")),
    "glyburide": ("glyburide", ("No", "Steady", "Up")),
    "tolbutamide": ("tolbutamide", ("Steady",)),
    "pioglitazone": ("pioglitazone", ("No", "Steady", "Up")),
    "rosiglitazone": ("rosiglitazone", ("No", "Steady", "Up")),
    "acarbose": ("acarbose", ("No", "Steady", "Up")),
    "miglitol": ("miglitol", ("No", "Steady", "Up")),
    "troglitazone": ("troglitazone", ("Steady",)),
    "tolazamide": ("tolazamide", ("Steady", "Up")),
    "insulin": ("insulin", ("No", "Steady", "Up")),
    "glyburide-metformin": ("glyburide_metformin", ("No", "Steady", "Up")),
    "glipizide-metformin": ("glipizide_metformin", ("Steady",)),
    "glimepiride-pioglitazone": ("glimepiride_pioglitazone", ("Steady",)),
    "metformin-rosiglitazone": ("metformin_rosiglitazone", ("Steady",)),
    "metformin-pioglitazone": ("metformin_pioglitazone", ("Steady",)),
}

DIABETES_MEDICATION_NAMES = {
    "metformin",
    "repaglinide",
    "nateglinide",
    "chlorpropamide",
    "glimepiride",
    "acetohexamide",
    "glipizide",
    "glyburide",
    "tolbutamide",
    "pioglitazone",
    "rosiglitazone",
    "acarbose",
    "miglitol",
    "troglitazone",
    "tolazamide",
    "insulin",
    "glyburide-metformin",
    "glipizide-metformin",
    "glimepiride-pioglitazone",
    "metformin-rosiglitazone",
    "metformin-pioglitazone",
}


@dataclass(frozen=True)
class PredictionOutput:
    probability: float
    confidence: Decimal
    risk_band: RiskBand
    threshold: Decimal
    predicted_label: str
    model_name: str
    model_version: str
    explanation: str
    features_snapshot: dict[str, Any]
    analysis: dict[str, list[dict[str, Any]] | list[str]]


def _clean_feature_name(value: str) -> str:
    return _FEATURE_NAME_CLEANUP.sub("_", value)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value in (None, ""):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value in (None, ""):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_text(value: Any) -> str:
    if value in (None, ""):
        return ""
    return str(value).strip()


def _first_present(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def _normalize_medication_name(value: Any) -> str:
    text = _normalize_text(value).lower()
    if not text:
        return ""
    text = text.replace("_", "-").replace(" ", "-")
    text = _MEDICATION_NORMALIZER.sub("", text)
    return text.strip("-")


def _extract_diagnosis_code(value: Any) -> str | None:
    text = _normalize_text(value)
    if not text:
        return None
    text = text.replace("ICD-9", " ").replace("ICD9", " ")
    match = _DIAGNOSIS_CODE_PATTERN.search(text)
    if match is None:
        return None
    return match.group(1).upper()


@lru_cache(maxsize=1)
def _load_diagnosis_encoders(dataset_path: str) -> dict[str, dict[str, int]]:
    path = Path(dataset_path)
    if not path.exists():
        return {}

    try:
        frame = pd.read_csv(path, usecols=list(DIAGNOSIS_COLUMNS), keep_default_na=False, na_values=["?"])
    except Exception:
        return {}

    encoders: dict[str, dict[str, int]] = {}
    for column in DIAGNOSIS_COLUMNS:
        cleaned = frame.copy()
        cleaned[column] = cleaned[column].replace("", pd.NA)
        values = cleaned.dropna(subset=list(DIAGNOSIS_COLUMNS))[column].astype(str).map(str.strip)
        classes = sorted(set(value for value in values if value))
        encoders[column] = {label: index for index, label in enumerate(classes)}
    return encoders


def _get_friendly_feature_label(name: str) -> str:
    static_map = {
        "admission_type_id": "Admission Type",
        "discharge_disposition_id": "Discharge Disposition",
        "admission_source_id": "Admission Source",
        "time_in_hospital": "Time in Hospital (days)",
        "num_lab_procedures": "Number of Lab Procedures",
        "num_procedures": "Number of Procedures",
        "num_medications": "Number of Medications",
        "number_outpatient": "Number of Outpatient Visits",
        "number_emergency": "Prior Emergency Visits",
        "number_inpatient": "Prior Inpatient Visits",
        "number_diagnoses": "Number of Diagnoses",
        "diag_1": "Primary Diagnosis Code",
        "diag_2": "Secondary Diagnosis Code",
        "diag_3": "Additional Diagnosis Code",
        "race_Asian": "Race: Asian",
        "race_Caucasian": "Race: Caucasian",
        "race_Hispanic": "Race: Hispanic",
        "race_Other": "Race: Other",
        "gender_Male": "Gender: Male",
        "gender_Unknown_Invalid": "Gender: Unknown/Invalid",
        "max_glu_serum__300": "Max Glucose: >300",
        "max_glu_serum_None": "Max Glucose: None",
        "max_glu_serum_Norm": "Max Glucose: Normal",
        "A1Cresult__8": "A1C Result: >8",
        "A1Cresult_None": "A1C Result: None",
        "A1Cresult_Norm": "A1C Result: Normal",
        "change_No": "No Medication Change",
        "diabetesMed_Yes": "Diabetes Medication Prescribed",
    }
    if name in static_map:
        return static_map[name]

    if name.startswith("age__") and name.endswith("_"):
        parts = name.split("__")[1].strip("_").split("_")
        if len(parts) == 2:
            return f"Age Group: {parts[0]}-{parts[1]}"

    for suffix in ["_No", "_Steady", "_Up"]:
        if name.endswith(suffix):
            drug_part = name[:-len(suffix)]
            drug_name = drug_part.replace("_", "-").title()
            action = suffix[1:].title()
            return f"{drug_name}: {action}"

    return name.replace("_", " ").title()


class MLInferenceService:
    """Load the deployed model artifacts once and expose a narrow prediction API.

    The preprocessing layer is intentionally kept explicit and replaceable so we can
    swap in the original scaler/encoders later without changing the public endpoint.
    """

    def __init__(self, model_dir: Path):
        self.model_dir = Path(model_dir)
        self.model, self.scaler, self.feature_names, self.threshold, self.model_info = self._load_artifacts()
        self.feature_name_set = set(self.feature_names)
        self.model_name = str(self.model_info.get("model_name", MODEL_NAME))
        self.model_version = MODEL_VERSION
        self.dataset_path = self.model_dir.parent / DATASET_FILENAME
        self.diagnosis_encoders = _load_diagnosis_encoders(str(self.dataset_path))

        # Load SHAP background data and initialize KernelExplainer
        background_path = self.model_dir / "shap_background.pkl"
        self.background_data = None
        self.explainer = None
        self.shap_error = None
        self._last_shap_latency = 0.0
        self._last_abs_error = -1.0
        if background_path.exists():
            try:
                self.background_data = joblib.load(background_path)
                if hasattr(self.background_data, "shape") and self.background_data.shape == (50, 85):
                    # Define wrapper for probability prediction
                    def predict_probability(X):
                        return self.model.predict_proba(X)[:, 1]

                    import shap
                    self.explainer = shap.KernelExplainer(predict_probability, self.background_data, keep_index=False)
                else:
                    self.shap_error = f"Invalid background data shape: {getattr(self.background_data, 'shape', 'unknown')}"
            except Exception as exc:
                import logging
                logging.getLogger("flask.app").exception("Failed to initialize SHAP KernelExplainer")
                self.shap_error = str(exc)
        else:
            self.shap_error = f"SHAP background file missing at {background_path}"

    def _load_artifacts(self) -> tuple[Any, Any, list[str], Decimal, dict[str, Any]]:
        model_path = self.model_dir / "weighted_stacking_model.pkl"
        feature_names_path = self.model_dir / "feature_names.pkl"
        scaler_path = self.model_dir / "scaler.pkl"
        threshold_path = self.model_dir / "best_threshold.pkl"
        model_info_path = self.model_dir / "model_info.json"

        missing = [str(path.name) for path in [model_path, feature_names_path, scaler_path, threshold_path] if not path.exists()]
        if missing:
            raise RuntimeError(f"Missing ML model artifact(s): {', '.join(missing)}")

        try:
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            raw_feature_names = joblib.load(feature_names_path)
            threshold_value = joblib.load(threshold_path)
        except Exception as exc:  # pragma: no cover - depends on external model dependencies
            raise RuntimeError(f"Unable to load ML model artifacts: {exc}") from exc

        model_info: dict[str, Any] = {}
        if model_info_path.exists():
            try:
                model_info = json.loads(model_info_path.read_text())
            except Exception:
                model_info = {}

        if not isinstance(raw_feature_names, list) or not all(isinstance(name, str) for name in raw_feature_names):
            raise RuntimeError("feature_names.pkl did not contain a valid feature name list")

        return model, scaler, raw_feature_names, Decimal(str(threshold_value)), model_info

    def _patient_medications(self, patient: Any) -> list[str]:
        medications = getattr(patient, "medications", None)
        if not medications:
            return []
        if isinstance(medications, list):
            return [_normalize_medication_name(medication) for medication in medications if _normalize_medication_name(medication)]
        if isinstance(medications, str):
            return [_normalize_medication_name(part) for part in medications.split(",") if _normalize_medication_name(part)]
        return []

    def _resolve_numeric_value(self, payload: dict[str, Any], patient: Any, field_name: str, *aliases: str, default: int | None = None) -> int | None:
        values: list[Any] = [payload.get(field_name)]
        values.extend(payload.get(alias) for alias in aliases)
        values.append(getattr(patient, field_name, None))
        values.extend(getattr(patient, alias, None) for alias in aliases)
        resolved = _first_present(*values)
        if resolved is None:
            return default
        return _to_int(resolved, default if default is not None else 0)

    def _resolve_diagnosis_value(self, explicit_value: Any, fallback_value: Any, feature_name: str) -> float | None:
        candidate = _extract_diagnosis_code(explicit_value)
        if candidate is None:
            candidate = _extract_diagnosis_code(fallback_value)
        if candidate is None:
            return None

        encoder = self.diagnosis_encoders.get(feature_name)
        if not encoder:
            return None
        encoded = encoder.get(candidate)
        if encoded is not None:
            return float(encoded)
        return None

    def _set_one_hot_category(
        self,
        row: dict[str, float],
        feature_prefix: str,
        category: str | None,
        *,
        default_category: str | None = None,
    ) -> None:
        candidates = [name for name in row if name.startswith(f"{feature_prefix}_")]
        if not candidates:
            return

        if category is None:
            category = default_category

        for name in candidates:
            row[name] = 0.0

        if category is None:
            return

        feature_name = f"{feature_prefix}_{category}"
        if feature_name in row:
            row[feature_name] = 1.0

    def _set_max_glu_feature(self, row: dict[str, float], max_glu_serum: str | None) -> None:
        if not max_glu_serum:
            return
        normalized = max_glu_serum.strip()
        feature_map = {
            ">200": None,
            ">300": "max_glu_serum__300",
            "None": "max_glu_serum_None",
            "Norm": "max_glu_serum_Norm",
        }
        feature_name = feature_map.get(normalized)
        if feature_name is None:
            return
        if feature_name in row:
            row[feature_name] = 1.0

    def _set_medication_family(self, row: dict[str, float], family_key: str, present: bool) -> None:
        feature_prefix, statuses = MEDICATION_FAMILIES[family_key]
        family_features = [name for name in row if name.startswith(f"{feature_prefix}_")]
        if not family_features:
            return

        for name in family_features:
            row[name] = 0.0

        if not present:
            default_feature = f"{feature_prefix}_No"
            if default_feature in row:
                row[default_feature] = 1.0
            return

        if "Steady" in statuses:
            target_feature = f"{feature_prefix}_Steady"
        elif "Up" in statuses:
            target_feature = f"{feature_prefix}_Up"
        else:
            target_feature = f"{feature_prefix}_No"

        if target_feature in row:
            row[target_feature] = 1.0

    def _build_feature_row(self, payload: dict[str, Any], patient: Any) -> dict[str, float]:
        row = {name: 0.0 for name in self.feature_names}

        medications = self._patient_medications(patient)
        medication_set = set(medications)

        medication_count = self._resolve_numeric_value(payload, patient, "num_medications", "medications_count") or 0
        admission_source_id = self._resolve_numeric_value(payload, patient, "admission_source_id", default=int(DEFAULT_ADMISSION_SOURCE_ID))
        discharge_disposition_id = self._resolve_numeric_value(
            payload,
            patient,
            "discharge_disposition_id",
            default=int(DEFAULT_DISCHARGE_DISPOSITION_ID),
        )
        number_inpatient = self._resolve_numeric_value(payload, patient, "number_inpatient", "prior_inpatient")
        number_emergency = self._resolve_numeric_value(payload, patient, "number_emergency", "prior_emergency")
        num_procedures = self._resolve_numeric_value(payload, patient, "num_procedures")
        time_in_hospital = _first_present(payload.get("time_in_hospital"), getattr(patient, "time_in_hospital", None))
        diagnoses_count = _first_present(payload.get("diagnoses_count"), getattr(patient, "prior_diagnoses_count", None))
        a1c_result = _normalize_text(
            _first_present(payload.get("a1c_result"), payload.get("A1Cresult"), getattr(patient, "a1c_result", None))
        ) or "None"
        max_glu_serum = _normalize_text(_first_present(payload.get("max_glu_serum"), getattr(patient, "max_glu_serum", None))) or "None"
        insulin_usage = _normalize_text(
            _first_present(payload.get("insulin_usage"), payload.get("insulin"), getattr(patient, "insulin_usage", None))
        ) or "No"
        diag_3_value = self._resolve_diagnosis_value(
            _first_present(payload.get("diag_3"), getattr(patient, "diag_3", None), payload.get("additional_diagnosis"), payload.get("diagnosis_3")),
            getattr(patient, "diag_3", None),
            "diag_3",
        )

        patient_age = self._patient_age(patient)
        admission_type_id = self._map_admission_type(getattr(patient, "admission_type", None))

        numeric_values = {
            "admission_type_id": float(admission_type_id),
            "discharge_disposition_id": float(discharge_disposition_id) if discharge_disposition_id is not None else float(DEFAULT_DISCHARGE_DISPOSITION_ID),
            "admission_source_id": float(admission_source_id) if admission_source_id is not None else float(DEFAULT_ADMISSION_SOURCE_ID),
            "time_in_hospital": float(time_in_hospital) if time_in_hospital is not None else None,
            "num_lab_procedures": float(_to_int(getattr(patient, "lab_procedures_count", None))) if getattr(patient, "lab_procedures_count", None) is not None else None,
            "num_procedures": float(num_procedures) if num_procedures is not None else None,
            "num_medications": float(medication_count),
            "number_outpatient": float(self._resolve_numeric_value(payload, patient, "number_outpatient") or 0),
            "number_emergency": float(number_emergency) if number_emergency is not None else 0.0,
            "number_inpatient": float(number_inpatient) if number_inpatient is not None else 0.0,
            "number_diagnoses": float(diagnoses_count) if diagnoses_count is not None else None,
        }

        diagnosis_values = {
            "diag_1": self._resolve_diagnosis_value(payload.get("diag_1"), getattr(patient, "primary_diagnosis", None), "diag_1"),
            "diag_2": self._resolve_diagnosis_value(payload.get("diag_2"), getattr(patient, "secondary_diagnosis", None), "diag_2"),
            "diag_3": diag_3_value,
        }

        for key, value in numeric_values.items():
            if key in row and value is not None:
                row[key] = value
        for key, value in diagnosis_values.items():
            if key in row and value is not None:
                row[key] = value

        gender_value = getattr(patient, "gender", None)
        if gender_value == Gender.male:
            self._set_binary_feature(row, "gender_Male", True)
        elif gender_value in {Gender.other, Gender.unknown}:
            self._set_binary_feature(row, "gender_Unknown_Invalid", True)

        race_value = _normalize_text(payload.get("race"))
        if race_value in {"Asian", "Caucasian", "Hispanic", "Other"}:
            self._set_one_hot_category(row, "race", race_value, default_category="Caucasian")
        elif race_value == "AfricanAmerican":
            self._set_one_hot_category(row, "race", None, default_category=None)
        else:
            self._set_one_hot_category(row, "race", None, default_category="Caucasian")
        self._set_age_bucket(row, patient_age)

        self._set_max_glu_feature(row, "Norm" if max_glu_serum == "Normal" else max_glu_serum)
        self._set_a1c_feature(row, a1c_result)
        self._set_insulin_feature(row, insulin_usage)

        if insulin_usage in {"No", "Steady"}:
            self._set_change_feature(row, insulin_usage)

        if any(med in DIABETES_MEDICATION_NAMES for med in medication_set) or medication_count > 0 or (insulin_usage not in (None, "") and insulin_usage != "No"):
            self._set_binary_feature(row, "diabetesMed_Yes", True)
        else:
            self._set_binary_feature(row, "diabetesMed_Yes", False)

        for family_key, (feature_prefix, statuses) in MEDICATION_FAMILIES.items():
            if family_key == "insulin":
                continue
            has_known_medication = family_key in medication_set
            self._set_medication_family(row, family_key, has_known_medication)

        return row

    def _set_binary_feature(self, row: dict[str, float], feature_name: str, enabled: bool) -> None:
        if feature_name in row and enabled:
            row[feature_name] = 1.0

    def _set_age_bucket(self, row: dict[str, float], age: int | None) -> None:
        if age is None or age < 10:
            return
        bucket_start = min(max((age // 10) * 10, 10), 90)
        bucket_end = min(bucket_start + 10, 100)
        feature_name = f"age__{bucket_start}_{bucket_end}_"
        if feature_name in row:
            row[feature_name] = 1.0

    def _set_a1c_feature(self, row: dict[str, float], a1c_result: str | None) -> None:
        if not a1c_result:
            return
        normalized = a1c_result.strip()
        feature_map = {
            ">7": None,
            ">8": "A1Cresult__8",
            "None": "A1Cresult_None",
            "Norm": "A1Cresult_Norm",
            "Normal": "A1Cresult_Norm",
        }
        feature_name = feature_map.get(normalized)
        if feature_name is None:
            return
        if feature_name in row:
            row[feature_name] = 1.0

    def _set_insulin_feature(self, row: dict[str, float], insulin_usage: str | None) -> None:
        if not insulin_usage:
            return
        normalized = insulin_usage.strip()
        feature_map = {
            "Down": None,
            "No": "insulin_No",
            "Steady": "insulin_Steady",
            "Up": "insulin_Up",
        }
        feature_name = feature_map.get(normalized)
        if feature_name is None:
            return
        if feature_name in row:
            row[feature_name] = 1.0

    def _set_change_feature(self, row: dict[str, float], insulin_usage: str) -> None:
        if insulin_usage.strip() in {"No", "Steady"} and "change_No" in row:
            row["change_No"] = 1.0

    def _map_admission_type(self, admission_type: Any) -> int:
        if isinstance(admission_type, AdmissionType):
            admission_type = admission_type.value
        normalized = str(admission_type or "other").strip().lower()
        return {
            "emergency": 1,
            "urgent": 2,
            "elective": 3,
            "newborn": 4,
            "other": 5,
            "trauma": 7,
        }.get(normalized, 5)

    def _patient_age(self, patient: Any) -> int | None:
        age_at_admission = getattr(patient, "age_at_admission", None)
        if age_at_admission not in (None, ""):
            return _to_int(age_at_admission)

        date_of_birth = getattr(patient, "date_of_birth", None)
        admission_date = getattr(patient, "admission_date", None)
        if isinstance(date_of_birth, date) and isinstance(admission_date, date):
            years = admission_date.year - date_of_birth.year - (
                (admission_date.month, admission_date.day) < (date_of_birth.month, date_of_birth.day)
            )
            return max(years, 0)
        return None

    def preprocess(self, payload: dict[str, Any], patient: Any) -> tuple[list[float], dict[str, float], dict[str, Any]]:
        row = self._build_feature_row(payload, patient)
        raw_frame = pd.DataFrame([row], columns=self.feature_names)
        scaled_frame = self.scaler.transform(raw_frame)
        aligned = [float(value) for value in scaled_frame[0].tolist()]
        snapshot = {
            "patient_id": getattr(patient, "id", None),
            "patient_identifier": getattr(patient, "patient_identifier", None),
            "patient_name": f"{getattr(patient, 'first_name', '')} {getattr(patient, 'last_name', '')}".strip(),
            "feature_names": self.feature_names,
            "feature_values": row,
            "scaled_feature_values": aligned,
        }
        return aligned, row, snapshot

    def _risk_band(self, probability: float) -> RiskBand:
        if probability >= 60.0:
            return RiskBand.high
        if probability >= 30.0:
            return RiskBand.moderate
        return RiskBand.low

    def _build_analysis(self, inputs: dict[str, Any], probability: float, risk_band: RiskBand) -> dict[str, list[dict[str, Any]] | list[str]]:
        factors: list[dict[str, Any]] = []
        if (inputs.get("number_inpatient") or 0) > 0:
            factors.append({"label": "Prior inpatient visits", "impact": f"+{(inputs.get('number_inpatient') or 0) * 8}%", "isPositive": True})
        if (inputs.get("number_emergency") or 0) > 0:
            factors.append({"label": "Prior emergency visits", "impact": f"+{(inputs.get('number_emergency') or 0) * 6}%", "isPositive": True})
        if inputs.get("a1c_result") not in (None, ""):
            factors.append({"label": "A1C result present", "impact": "+12%", "isPositive": True})
        if (inputs.get("medications_count") or 0) < 5:
            factors.append({"label": "Lower medication count", "impact": "-6%", "isPositive": False})
        else:
            factors.append({"label": "Medication regimen load", "impact": "+4%", "isPositive": True})
        if (inputs.get("time_in_hospital") or 0) > 5:
            factors.append({"label": "Extended stay duration", "impact": "+8%", "isPositive": True})

        if risk_band == RiskBand.high:
            next_steps = [
                "Coordinate priority care transition and post-discharge clinic scheduling within 3 days.",
                "Arrange urgent home healthcare diabetes nurse training sessions.",
                "Re-evaluate sliding scale insulin settings before final discharge signature.",
            ]
        elif risk_band == RiskBand.moderate:
            next_steps = [
                "Arrange primary care outpatient consult within 10-14 days.",
                "Instruct patient to maintain home blood glucose self-monitoring logs.",
                "Refer to dietitian for diabetes medical nutrition therapy consult.",
            ]
        else:
            next_steps = [
                "Provide standard diabetes discharge materials and instructions.",
                "Resume home care baseline medications. Routine check-up in 30 days.",
            ]

        return {"factors": factors, "next_steps": next_steps}

    def predict(self, payload: dict[str, Any], patient: Any) -> PredictionOutput:
        inputs = {
            "admission_source_id": _to_int(_first_present(payload.get("admission_source_id"), getattr(patient, "admission_source_id", None), DEFAULT_ADMISSION_SOURCE_ID)),
            "discharge_disposition_id": _to_int(_first_present(payload.get("discharge_disposition_id"), getattr(patient, "discharge_disposition_id", None), DEFAULT_DISCHARGE_DISPOSITION_ID)),
            "number_inpatient": _to_int(_first_present(payload.get("number_inpatient"), payload.get("prior_inpatient"), getattr(patient, "number_inpatient", None))),
            "number_emergency": _to_int(_first_present(payload.get("number_emergency"), payload.get("prior_emergency"), getattr(patient, "number_emergency", None))),
            "number_outpatient": _to_int(_first_present(payload.get("number_outpatient"), getattr(patient, "number_outpatient", None))),
            "num_procedures": _to_int(_first_present(payload.get("num_procedures"), getattr(patient, "num_procedures", None))),
            "num_medications": _to_int(_first_present(payload.get("num_medications"), payload.get("medications_count"), getattr(patient, "num_medications", None))),
            "diag_1": _first_present(payload.get("diag_1"), getattr(patient, "primary_diagnosis", None)),
            "diag_2": _first_present(payload.get("diag_2"), getattr(patient, "secondary_diagnosis", None)),
            "diag_3": _first_present(payload.get("diag_3"), getattr(patient, "diag_3", None), payload.get("additional_diagnosis"), payload.get("diagnosis_3")),
            "medications_count": _to_int(_first_present(payload.get("medications_count"), payload.get("num_medications"), getattr(patient, "num_medications", None))),
            "time_in_hospital": _to_int(_first_present(payload.get("time_in_hospital"), getattr(patient, "time_in_hospital", None))),
            "diagnoses_count": _to_int(_first_present(payload.get("diagnoses_count"), getattr(patient, "prior_diagnoses_count", None))),
            "a1c_result": _first_present(payload.get("a1c_result"), payload.get("A1Cresult"), getattr(patient, "a1c_result", None)),
            "max_glu_serum": _first_present(payload.get("max_glu_serum"), getattr(patient, "max_glu_serum", None)),
            "insulin_usage": _first_present(payload.get("insulin_usage"), payload.get("insulin"), getattr(patient, "insulin_usage", None)),
        }

        feature_vector, feature_row, snapshot = self.preprocess(payload, patient)
        try:
            probabilities = self.model.predict_proba([feature_vector])
        except Exception as exc:  # pragma: no cover - depends on model internals
            raise RuntimeError(f"Model inference failed: {exc}") from exc

        if probabilities is None or len(probabilities) == 0 or len(probabilities[0]) < 2:
            raise RuntimeError("Model did not return binary class probabilities")

        raw_probability = float(probabilities[0][1])
        probability = round(raw_probability * 100.0, 2)
        threshold = self.threshold
        predicted_positive = raw_probability >= float(threshold)
        predicted_label = "Readmission Likely" if predicted_positive else "Readmission Unlikely"
        confidence = Decimal(f"{max(raw_probability, 1.0 - raw_probability) * 100.0:.2f}")
        risk_band = self._risk_band(probability)

        analysis = self._build_analysis(inputs, probability, risk_band)
        factors = list(analysis.get("factors", []))

        # 1. SHAP calculation
        if self.explainer is not None:
            try:
                import time as pytime
                import numpy as np
                start_time = pytime.perf_counter()
                
                # Explaining the prediction in the original 85-feature space using the exact aligned feature vector
                shap_input = np.array([feature_vector], dtype=float)
                explanation = self.explainer.shap_values(shap_input)
                
                # Fetch base expected value
                expected_value = self.explainer.expected_value
                if isinstance(expected_value, (list, np.ndarray)):
                    expected_value = float(expected_value[0])
                else:
                    expected_value = float(expected_value)
                
                # Normalize KernelExplainer shape differences
                if isinstance(explanation, list):
                    if len(explanation) > 0 and isinstance(explanation[0], np.ndarray):
                        shap_values = explanation[0][0]
                    else:
                        shap_values = np.array(explanation[0])
                elif isinstance(explanation, np.ndarray):
                    if explanation.ndim == 3:
                        shap_values = explanation[0, :, 0]
                    elif explanation.ndim == 2:
                        shap_values = explanation[0]
                    else:
                        shap_values = explanation.flatten()
                else:
                    raise ValueError(f"Unexpected explanation type: {type(explanation)}")
                
                shap_values = np.asarray(shap_values, dtype=float).flatten()
                if len(shap_values) != 85:
                    raise ValueError(f"Expected 85 SHAP values, got {len(shap_values)}")
                
                # 2. Reconstructed probability validation
                sum_shap_values = float(np.sum(shap_values))
                reconstructed_probability = expected_value + sum_shap_values
                absolute_error = abs(reconstructed_probability - raw_probability)
                
                end_time = pytime.perf_counter()
                shap_latency = end_time - start_time
                
                import logging
                logger = logging.getLogger("flask.app")
                logger.info(
                    f"[SHAP Verification] expected_value={expected_value:.6f}, "
                    f"sum_shap={sum_shap_values:.6f}, reconstructed={reconstructed_probability:.6f}, "
                    f"predicted={raw_probability:.6f}, abs_error={absolute_error:.6e}, "
                    f"latency={shap_latency:.3f}s"
                )
                
                self._last_shap_latency = shap_latency
                self._last_abs_error = absolute_error
                
                # 3. Sort by abs(SHAP) and select top 5 meaningful contributors
                indices = np.argsort(np.abs(shap_values))[::-1]
                for idx in indices:
                    val = shap_values[idx]
                    if abs(val) < 1e-6:
                        continue
                    feat_name = self.feature_names[idx]
                    friendly_label = _get_friendly_feature_label(feat_name)
                    
                    impact_val = val * 100.0
                    sign_str = "+" if impact_val >= 0 else ""
                    factors.append({
                        "label": friendly_label,
                        "impact": f"{sign_str}{impact_val:.2f} percentage points",
                        "isPositive": bool(val >= 0),
                        "raw_shap": float(val)
                    })
                    if len(factors) >= 5:
                        break
            except Exception as exc:
                import logging
                logging.getLogger("flask.app").exception("SHAP prediction explanation failed")
                self._last_shap_latency = 0.0
                self._last_abs_error = -1.0
        else:
            self._last_shap_latency = 0.0
            self._last_abs_error = -1.0

        if factors:
            analysis["factors"] = factors

        patient_name = f"{getattr(patient, 'first_name', '')} {getattr(patient, 'last_name', '')}".strip()
        explanation = (
            f"Prediction generated for {patient_name or 'patient'} using {MODEL_NAME} {MODEL_VERSION}. "
            f"Model probability: {probability:.2f}%. Decision threshold: {float(threshold):.2f}."
        )

        snapshot["raw_probability"] = raw_probability
        snapshot["threshold"] = float(threshold)
        snapshot["predicted_label"] = predicted_label
        snapshot["risk_band"] = risk_band.value

        return PredictionOutput(
            probability=probability,
            confidence=confidence,
            risk_band=risk_band,
            threshold=threshold,
            predicted_label=predicted_label,
            model_name=MODEL_NAME,
            model_version=MODEL_VERSION,
            explanation=explanation,
            features_snapshot=snapshot,
            analysis=analysis,
        )


@lru_cache(maxsize=1)
def get_ml_inference_service(model_dir: str | Path) -> MLInferenceService:
    return MLInferenceService(Path(model_dir))
