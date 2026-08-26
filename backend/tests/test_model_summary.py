from __future__ import annotations

import json
from flask import current_app
from app.services.insights_service import build_model_summary
from app.models import UserRole

def admin_auth_header(client) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Admin User",
            "email": "admin.user@example.com",
            "password": "StrongPass123!",
            "role": "system_administrator",
            "department": "IT",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin.user@example.com", "password": "StrongPass123!"},
    )
    token = login.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_model_summary_empty_database_success(client, app):
    """Test that when database has zero predictions, the model summary
    endpoint still returns the correct static ROC-AUC/model metadata
    from the loaded model_info.json artifact, not zero or null values.
    """
    headers = admin_auth_header(client)
    
    # 1. Fetch summary via API endpoint
    response = client.get("/api/v1/models/summary", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    
    # Verify model loaded state is True
    assert data["model_loaded"] is True
    assert data["model_load_error"] is None
    
    # Verify current model is present and has the active status
    current_model = data["current_model"]
    assert current_model is not None
    assert "Weighted Stacking Ensemble" in current_model["version"]
    assert current_model["status"] == "active"
    
    # Verify ROC-AUC score is NOT 0.00% or null, but the expected value from model_info.json
    # In test environment, the loaded model has 0.15 threshold and version v1.2.
    # Let's verify the roc_auc field contains a real percentage value (e.g. 68.34%)
    assert current_model["roc_auc"] != "0.00%"
    assert current_model["roc_auc"].endswith("%")
    assert float(current_model["roc_auc"].replace("%", "")) > 0.0
    
    # 2. Call build_model_summary directly to verify service layer matches
    with app.app_context():
        summary = build_model_summary()
        assert summary["model_loaded"] is True
        assert summary["current_model"] is not None
        assert summary["current_model"]["roc_auc"] != "0.00%"


def test_model_summary_fallback_on_missing_model(client, app):
    """Test that if the model fails to load at startup (simulated by setting
    ml_inference_service to None and configuring an error message),
    the endpoint correctly reports 'no active model' with status model_loaded=False.
    """
    headers = admin_auth_header(client)
    
    # Simulate failed startup model load in app extensions
    original_service = app.extensions.get("ml_inference_service")
    app.extensions["ml_inference_service"] = None
    app.extensions["ml_model_loaded"] = False
    app.extensions["ml_model_load_error"] = "Artifact loaded simulation failure"
    
    try:
        response = client.get("/api/v1/models/summary", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        
        # Verify model loaded state is False
        assert data["model_loaded"] is False
        assert data["model_load_error"] == "Artifact loaded simulation failure"
        
        # Verify current_model is None or reports empty/no active model status
        assert data["current_model"] is None
        assert len(data["model_versions"]) == 0
        
    finally:
        # Restore service to prevent impacting subsequent tests
        app.extensions["ml_inference_service"] = original_service
        app.extensions["ml_model_loaded"] = True
        app.extensions["ml_model_load_error"] = None


def test_unique_model_versions(client, app):
    """Test that GET /api/v1/models/versions retrieves unique, alphabetically
    sorted model versions from the prediction history table, excluding null values,
    and requires proper JWT authentication.
    """
    # 1. Verify empty database state
    headers = admin_auth_header(client)
    response = client.get("/api/v1/models/versions", headers=headers)
    assert response.status_code == 200
    assert response.get_json() == {"versions": []}

    # 2. Add records manually to DB
    from app.models import Patient, Prediction, PredictionHistory, RiskBand, PredictionType
    from app.extensions import db
    from decimal import Decimal

    with app.app_context():
        # Create a patient
        patient = Patient(
            patient_identifier="PAT-VersionsTest",
            first_name="Jane",
            last_name="Versions",
            age_at_admission=40,
            gender="female",
            admission_type="emergency",
            primary_diagnosis="Diabetes",
            time_in_hospital=2,
            prior_diagnoses_count=1,
            lab_procedures_count=10,
            medications=["metformin"],
            readmission_probability=Decimal("35.00"),
            risk_band=RiskBand.moderate,
        )
        db.session.add(patient)
        db.session.flush()

        # Helper to create predictions
        def add_pred_hist(version):
            pred = Prediction(
                patient_id=patient.id,
                model_name="Weighted Stacking Ensemble",
                model_version=version,
                predicted_risk_band=RiskBand.moderate,
                predicted_readmission_probability=Decimal("35.00"),
                predicted_label="Readmission Likely",
                threshold=0.15,
                features_snapshot={},
                explanation="Ex",
                actual_readmitted=None,
            )
            db.session.add(pred)
            db.session.flush()

            hist = PredictionHistory(
                patient_id=patient.id,
                prediction_id=pred.id,
                risk_score=Decimal("35.00"),
                risk_class=RiskBand.moderate,
                confidence=Decimal("85.00"),
                threshold_used=Decimal("0.15"),
                model_version=version,
                prediction_type=PredictionType.binary,
            )
            db.session.add(hist)
            db.session.flush()

        add_pred_hist("v1.2")
        add_pred_hist("v1.2")
        add_pred_hist("v1.1")
        add_pred_hist("v1.3")
        db.session.commit()

    # 3. Query endpoint and verify unique, sorted output
    response = client.get("/api/v1/models/versions", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data == {"versions": ["v1.1", "v1.2", "v1.3"]}

    # 4. Verify authentication policy (unauthenticated request fails)
    response_no_auth = client.get("/api/v1/models/versions")
    assert response_no_auth.status_code == 401

