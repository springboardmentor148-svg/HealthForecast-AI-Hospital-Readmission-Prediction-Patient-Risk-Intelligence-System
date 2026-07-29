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
