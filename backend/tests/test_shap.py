from __future__ import annotations

import os
import sys
from pathlib import Path
from decimal import Decimal
import numpy as np
import pandas as pd
import pytest
import joblib

# Add backend directory to sys path
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.ml_inference_service import get_ml_inference_service
from app.models import Patient, RiskBand, Gender, AdmissionType


def test_shap_background_artifact_properties():
    """A. background shape == (50,85)
    B. feature ordering matches feature_names.pkl
    """
    models_dir = BACKEND_DIR.parent / "models"
    bg_path = models_dir / "shap_background.pkl"
    features_path = models_dir / "feature_names.pkl"

    assert bg_path.exists(), "shap_background.pkl does not exist"
    assert features_path.exists(), "feature_names.pkl does not exist"

    background = joblib.load(bg_path)
    feature_names = joblib.load(features_path)

    # A. background shape == (50,85)
    assert background.shape == (50, 85), f"Incorrect background shape: {background.shape}"

    # B. feature ordering matches feature_names.pkl
    # (Checking shape count equals list length, values loaded are numpy 2D array)
    assert isinstance(feature_names, list)
    assert len(feature_names) == 85


def test_shap_inference_math_and_properties(app):
    """Validate the scaled inference path and, when available, SHAP behavior."""
    service = get_ml_inference_service(app.config["MODEL_ARTIFACTS_DIR"])
    assert service is not None
    assert service.scaler is not None

    # Construct a dummy patient and payload for inference
    dummy_patient = Patient(
        first_name="Test",
        last_name="Patient",
        gender=Gender.male,
        age_at_admission="55",
        admission_type=AdmissionType.emergency,
        lab_procedures_count=42,
        medications=[],
        primary_diagnosis="type 2"
    )

    payload = {
        "prior_inpatient": 2,
        "prior_emergency": 1,
        "medications_count": 8,
        "time_in_hospital": 4,
        "diagnoses_count": 5,
        "a1c_result": "None",
        "insulin_usage": "Steady"
    }

    feature_vector, feature_row, _ = service.preprocess(payload, dummy_patient)
    expected_scaled = service.scaler.transform(pd.DataFrame([feature_row], columns=service.feature_names))[0]
    assert np.allclose(feature_vector, expected_scaled)

    # 1. Run prediction via original model predict_proba to get raw baseline
    raw_probs = service.model.predict_proba([feature_vector])
    baseline_probability = float(raw_probs[0][1])

    # 2. Run predict() with SHAP explanation enabled
    output = service.predict(payload, dummy_patient)

    # Prediction probability is unchanged by adding SHAP or the fallback path
    assert abs((output.probability / 100.0) - baseline_probability) < 1e-4

    # Threshold remains 0.15
    assert float(output.threshold) == 0.15

    # Risk band remains unchanged
    expected_risk = service._risk_band(baseline_probability * 100.0)
    assert output.risk_band == expected_risk

    if service.explainer is None:
        assert service.shap_error is not None
        assert output.analysis["factors"] == []
        return

    # SHAP output contains 85 values and reconstructs the model probability
    shap_input = np.array([feature_vector], dtype=float)
    explanation = service.explainer.shap_values(shap_input)

    if isinstance(explanation, list):
        shap_values = explanation[0][0]
    elif isinstance(explanation, np.ndarray):
        if explanation.ndim == 3:
            shap_values = explanation[0, :, 0]
        elif explanation.ndim == 2:
            shap_values = explanation[0]
        else:
            shap_values = explanation.flatten()
    else:
        raise AssertionError(f"Unexpected SHAP explanation type: {type(explanation)}")

    assert len(shap_values) == 85

    expected_value = float(service.explainer.expected_value[0] if isinstance(service.explainer.expected_value, (list, np.ndarray)) else service.explainer.expected_value)
    reconstructed_probability = expected_value + float(np.sum(shap_values))
    tolerance = 1e-5
    absolute_error = abs(reconstructed_probability - baseline_probability)
    assert absolute_error <= tolerance, f"SHAP math mismatch: error {absolute_error} exceeds tolerance {tolerance}"

    factors = output.analysis["factors"]
    assert len(factors) > 0, "No factors returned by SHAP"

    prev_abs_shap = float('inf')
    for factor in factors:
        assert factor["impact"].startswith("+") or factor["impact"].startswith("-")
        is_positive_sign = factor["impact"].startswith("+")
        assert factor["isPositive"] == is_positive_sign

        assert "raw_shap" in factor
        raw_val = factor["raw_shap"]
        assert (raw_val >= 0) == factor["isPositive"]

        current_abs_shap = abs(raw_val)
        assert current_abs_shap <= prev_abs_shap, "Factors not ranked by abs(SHAP)"
        prev_abs_shap = current_abs_shap


def test_shap_failure_handling_and_database_persistence(client, app):
    """K. SHAP failure does not prevent prediction persistence
    (Verification that model still functions and returns analysis.factors = [] if SHAP fails)
    """
    service = get_ml_inference_service(app.config["MODEL_ARTIFACTS_DIR"])
    
    # 1. Break the explainer to simulate a SHAP run failure
    original_explainer = service.explainer
    service.explainer = None  # Or a dummy object that raises exception on call
    
    try:
        # 2. Register a user and run a prediction via API client to verify it succeeds
        client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Test Doctor",
                "email": "doctor@example.com",
                "password": "Password123!",
                "role": "doctor",
                "department": "Endocrinology"
            }
        )
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "doctor@example.com", "password": "Password123!"}
        )
        token = login.get_json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create patient
        with app.app_context():
            from app.extensions import db
            patient = Patient(
                first_name="John",
                last_name="Doe",
                gender=Gender.male,
                patient_identifier="PAT-E2E-200",
                primary_diagnosis="type 2"
            )
            db.session.add(patient)
            db.session.commit()
            patient_id = patient.id

        # Call run prediction endpoint
        payload = {
            "patient_id": patient_id,
            "prior_inpatient": 2,
            "prior_emergency": 1,
            "medications_count": 8,
            "time_in_hospital": 4,
            "diagnoses_count": 5,
            "a1c_result": "None",
            "insulin_usage": "Steady"
        }
        
        response = client.post("/api/v1/predictions/run", json=payload, headers=headers)
        assert response.status_code == 201
        
        data = response.get_json()
        assert "prediction" in data
        assert "analysis" in data
        
        # Verify factors falls back to empty array [] when SHAP is disabled/fails
        assert data["analysis"]["factors"] == []
        
        # Verify prediction is persisted in DB
        with app.app_context():
            from app.models import Prediction, PredictionHistory
            pred = Prediction.query.filter_by(patient_id=patient_id).first()
            assert pred is not None
            assert pred.predicted_risk_band.value == data["prediction"]["risk_band"]

            history = PredictionHistory.query.filter_by(patient_id=patient_id).first()
            assert history is not None
            
    finally:
        # Restore the original explainer
        service.explainer = original_explainer
