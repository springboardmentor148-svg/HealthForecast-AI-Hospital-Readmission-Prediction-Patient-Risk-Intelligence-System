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

from ..errors import APIError
from ..models import AdmissionType, Gender, RiskBand

MODEL_NAME = "Weighted Stacking Ensemble"
MODEL_VERSION = "v1.2"
DEFAULT_THRESHOLD = Decimal("0.15")
_FEATURE_NAME_CLEANUP = re.compile(r"[^A-Za-z0-9_]")


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


class MLInferenceService:
    """Load the deployed model artifacts once and expose a narrow prediction API.

    The preprocessing layer is intentionally kept explicit and replaceable so we can
    swap in the original scaler/encoders later without changing the public endpoint.
    """

    def __init__(self, model_dir: Path):
        self.model_dir = Path(model_dir)
        self.model, self.feature_names, self.threshold, self.model_info = self._load_artifacts()
        self.feature_name_set = set(self.feature_names)
        self.model_name = str(self.model_info.get("model_name", MODEL_NAME))
        self.model_version = MODEL_VERSION

    def _load_artifacts(self) -> tuple[Any, list[str], Decimal, dict[str, Any]]:
        model_path = self.model_dir / "weighted_stacking_model.pkl"
        feature_names_path = self.model_dir / "feature_names.pkl"
        threshold_path = self.model_dir / "best_threshold.pkl"
        model_info_path = self.model_dir / "model_info.json"

        missing = [str(path.name) for path in [model_path, feature_names_path, threshold_path] if not path.exists()]
        if missing:
            raise RuntimeError(f"Missing ML model artifact(s): {', '.join(missing)}")

        try:
            model = joblib.load(model_path)
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

        return model, raw_feature_names, Decimal(str(threshold_value)), model_info

    def _build_feature_row(self, payload: dict[str, Any], patient: Any) -> dict[str, float]:
        row = {name: 0.0 for name in self.feature_names}

        inputs = {
            "prior_inpatient": _to_int(payload.get("prior_inpatient")),
            "prior_emergency": _to_int(payload.get("prior_emergency")),
            "medications_count": _to_int(payload.get("medications_count")),
            "time_in_hospital": _to_int(payload.get("time_in_hospital")),
            "diagnoses_count": _to_int(payload.get("diagnoses_count")),
            "a1c_result": str(payload.get("a1c_result") or "None").strip() or "None",
            "insulin_usage": str(payload.get("insulin_usage") or "No").strip() or "No",
        }

        patient_age = self._patient_age(patient)
        admission_type_id = self._map_admission_type(getattr(patient, "admission_type", None))

        numeric_values = {
            "admission_type_id": float(admission_type_id),
            "discharge_disposition_id": 1.0,
            "admission_source_id": 7.0,
            "time_in_hospital": float(inputs["time_in_hospital"]),
            "num_lab_procedures": float(_to_int(getattr(patient, "lab_procedures_count", 0))),
            "num_procedures": 0.0,
            "num_medications": float(inputs["medications_count"]),
            "number_outpatient": 0.0,
            "number_emergency": float(inputs["prior_emergency"]),
            "number_inpatient": float(inputs["prior_inpatient"]),
            "diag_1": 0.0,
            "diag_2": 0.0,
            "diag_3": 0.0,
            "number_diagnoses": float(inputs["diagnoses_count"]),
        }

        for key, value in numeric_values.items():
            if key in row:
                row[key] = value

        self._set_binary_feature(row, "gender_Male", getattr(patient, "gender", None) == Gender.male)
        self._set_binary_feature(row, "gender_Unknown_Invalid", getattr(patient, "gender", None) in {Gender.other, Gender.unknown})

        self._set_age_bucket(row, patient_age)
        self._set_binary_feature(row, "max_glu_serum_None", True)

        self._set_a1c_feature(row, inputs["a1c_result"])
        self._set_insulin_feature(row, inputs["insulin_usage"])
        self._set_change_feature(row, inputs["insulin_usage"])
        self._set_binary_feature(row, "diabetesMed_Yes", bool(getattr(patient, "medications", None)) or inputs["medications_count"] > 0)

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

    def _set_a1c_feature(self, row: dict[str, float], a1c_result: str) -> None:
        normalized = a1c_result.strip()
        feature_map = {
            ">8": "A1Cresult__8",
            "None": "A1Cresult_None",
            "Norm": "A1Cresult_Norm",
        }
        feature_name = feature_map.get(normalized)
        if feature_name and feature_name in row:
            row[feature_name] = 1.0

    def _set_insulin_feature(self, row: dict[str, float], insulin_usage: str) -> None:
        normalized = insulin_usage.strip()
        feature_map = {
            "No": "insulin_No",
            "Steady": "insulin_Steady",
            "Up": "insulin_Up",
        }
        feature_name = feature_map.get(normalized)
        if feature_name and feature_name in row:
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
        aligned = [float(row.get(name, 0.0)) for name in self.feature_names]
        snapshot = {
            "patient_id": getattr(patient, "id", None),
            "patient_identifier": getattr(patient, "patient_identifier", None),
            "patient_name": f"{getattr(patient, 'first_name', '')} {getattr(patient, 'last_name', '')}".strip(),
            "feature_names": self.feature_names,
            "feature_values": row,
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
        if inputs["prior_inpatient"] > 0:
            factors.append({"label": "Prior inpatient visits", "impact": f"+{inputs['prior_inpatient'] * 8}%", "isPositive": True})
        if inputs["prior_emergency"] > 0:
            factors.append({"label": "Prior emergency visits", "impact": f"+{inputs['prior_emergency'] * 6}%", "isPositive": True})
        if inputs["a1c_result"] != "None":
            factors.append({"label": "A1C result present", "impact": "+12%", "isPositive": True})
        if inputs["medications_count"] < 5:
            factors.append({"label": "Lower medication count", "impact": "-6%", "isPositive": False})
        else:
            factors.append({"label": "Medication regimen load", "impact": "+4%", "isPositive": True})
        if inputs["time_in_hospital"] > 5:
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
            "prior_inpatient": _to_int(payload.get("prior_inpatient")),
            "prior_emergency": _to_int(payload.get("prior_emergency")),
            "medications_count": _to_int(payload.get("medications_count")),
            "time_in_hospital": _to_int(payload.get("time_in_hospital")),
            "diagnoses_count": _to_int(payload.get("diagnoses_count")),
            "a1c_result": str(payload.get("a1c_result") or "None").strip() or "None",
            "insulin_usage": str(payload.get("insulin_usage") or "No").strip() or "No",
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
