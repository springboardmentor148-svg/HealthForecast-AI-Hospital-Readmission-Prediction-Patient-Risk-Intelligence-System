from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from ..extensions import db
from ..models import Patient, PredictionHistory, TreatmentEffectivenessLevel


def generate_treatment_forecast(patient_id: int) -> dict[str, Any]:
    """
    Computes a deterministic, reproducible treatment outcome forecast
    based on the patient's clinical history and latest prediction results.
    """
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return {}

    # Fetch latest prediction history
    latest_history = (
        db.session.query(PredictionHistory)
        .filter_by(patient_id=patient_id)
        .order_by(PredictionHistory.created_at.desc())
        .first()
    )

    if latest_history:
        prob = float(latest_history.risk_score)
        if prob > 1.0:
            prob = prob / 100.0
        conf = float(latest_history.confidence)

        inputs = {}
        if latest_history.prediction and latest_history.prediction.features_snapshot:
            inputs = latest_history.prediction.features_snapshot.get("inputs") or {}
    else:
        prob = float(patient.readmission_probability)
        if prob > 1.0:
            prob = prob / 100.0
        conf = 85.0
        inputs = {}

    time_h = float(inputs.get("time_in_hospital") or patient.time_in_hospital or 3)
    meds = float(
        inputs.get("medications_count")
        or (len(patient.medications) if patient.medications else 5)
    )
    diags = float(inputs.get("diagnoses_count") or patient.prior_diagnoses_count or 4)

    base_effectiveness = 100.0 * (1.0 - prob)
    penalty = (meds * 0.15) + (diags * 0.25) + (time_h * 0.10)
    predicted_treatment_effectiveness = max(15.00, min(98.00, base_effectiveness - penalty))

    base_recovery = time_h * 1.4 + diags * 0.4
    recovery_adjustment = prob * 8.0
    predicted_recovery_days = max(1.0, min(45.0, base_recovery + recovery_adjustment))

    if predicted_treatment_effectiveness >= 75.0:
        expected_response_category = TreatmentEffectivenessLevel.excellent
    elif predicted_treatment_effectiveness >= 55.0:
        expected_response_category = TreatmentEffectivenessLevel.good
    elif predicted_treatment_effectiveness >= 35.0:
        expected_response_category = TreatmentEffectivenessLevel.fair
    else:
        expected_response_category = TreatmentEffectivenessLevel.poor

    treatment_confidence = max(50.00, min(99.00, conf))

    forecast = {
        "predicted_treatment_effectiveness": round(predicted_treatment_effectiveness, 2),
        "predicted_recovery_days": round(predicted_recovery_days, 2),
        "expected_response_category": expected_response_category,
        "treatment_confidence": round(treatment_confidence, 2),
        "forecast_generated_at": datetime.now(timezone.utc),
    }

    # Automatically update the active TreatmentEffectiveness record in session
    # Import locally to avoid potential circular import issues
    from ..models import TreatmentEffectiveness
    active_treatment = TreatmentEffectiveness.query.filter_by(patient_id=patient_id, status="active").first()
    if active_treatment:
        active_treatment.predicted_treatment_effectiveness = forecast["predicted_treatment_effectiveness"]
        active_treatment.predicted_recovery_days = forecast["predicted_recovery_days"]
        active_treatment.expected_response_category = forecast["expected_response_category"]
        active_treatment.treatment_confidence = forecast["treatment_confidence"]
        active_treatment.forecast_generated_at = forecast["forecast_generated_at"]

    return forecast
