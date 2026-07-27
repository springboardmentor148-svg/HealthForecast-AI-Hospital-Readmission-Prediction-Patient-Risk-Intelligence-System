"""
Tests for the prediction endpoint.

The real XGBoost model file is not part of the test environment, so
`ml.model_loader.get_model` is monkeypatched with a stub exposing a
`predict_proba` method, matching the real model's interface.
"""
import numpy as np
import pytest


class _StubModel:
    """Deterministic stand-in for the trained XGBoost classifier."""

    def predict_proba(self, X):
        # Return a fixed [P(no_readmit), P(readmit)] pair for every row.
        return np.array([[0.35, 0.65] for _ in range(len(X))])


@pytest.fixture(autouse=True)
def stub_model(monkeypatch):
    import services.prediction_service as prediction_service

    monkeypatch.setattr(prediction_service, "get_model", lambda: _StubModel())
    yield


def test_predict_with_inline_data(client, auth_headers):
    payload = {
        "gender": "male",
        "age": 72,
        "race": "Caucasian",
        "admission_type": "Emergency",
        "time_in_hospital": 5,
        "num_lab_procedures": 45,
        "num_medications": 12,
        "diabetes_med": "Yes",
        "insulin": "Up",
        "a1c_result": ">8",
    }
    response = client.post("/api/v1/predict", json=payload, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["probability"] <= 1.0
    assert body["risk_category"] in {"low", "moderate", "high", "critical"}
    assert body["recommendation"]


def test_predict_requires_auth(client):
    response = client.post("/api/v1/predict", json={"age": 60})
    assert response.status_code == 401


def test_predict_for_existing_patient(client, auth_headers):
    patient_payload = {
        "patient_name": "Prediction Test Patient",
        "gender": "female",
        "age": 58,
        "time_in_hospital": 3,
    }
    create_resp = client.post("/api/v1/patients", json=patient_payload, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    response = client.post(
        "/api/v1/predict", json={"patient_id": patient_id}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["patient_id"] == patient_id
