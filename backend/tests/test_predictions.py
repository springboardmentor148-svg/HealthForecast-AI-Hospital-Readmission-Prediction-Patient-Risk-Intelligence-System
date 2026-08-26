from __future__ import annotations


def patient_payload(identifier: str = "PAT-2001", full_name: str = "Prediction Test") -> dict[str, object]:
    return {
        "patient_identifier": identifier,
        "full_name": full_name,
        "age_at_admission": 58,
        "gender": "female",
        "admission_type": "urgent",
        "primary_diagnosis": "Type 2 Diabetes Mellitus",
        "time_in_hospital": 4,
        "prior_diagnoses_count": 6,
        "lab_procedures_count": 10,
        "medications": ["Metformin", "Insulin Glargine"],
        "risk_band": "moderate",
        "readmission_probability": 44.0,
    }


def run_payload(patient_id: int, prior_inpatient: int, prior_emergency: int, medications_count: int, time_in_hospital: int, diagnoses_count: int, a1c_result: str, insulin_usage: str) -> dict[str, object]:
    return {
        "patient_id": patient_id,
        "prior_inpatient": prior_inpatient,
        "prior_emergency": prior_emergency,
        "medications_count": medications_count,
        "time_in_hospital": time_in_hospital,
        "diagnoses_count": diagnoses_count,
        "a1c_result": a1c_result,
        "insulin_usage": insulin_usage,
    }


def auth_header(client) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Auth User",
            "email": "auth.user@example.com",
            "password": "StrongPass123!",
            "role": "doctor",
            "department": "Cardiology",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "auth.user@example.com", "password": "StrongPass123!"},
    )
    token = login.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_predictions_requires_auth(client):
    response = client.get("/api/v1/predictions")
    assert response.status_code == 401


def test_run_prediction_creates_history_and_updates_patient(client):
    headers = auth_header(client)

    create_patient = client.post("/api/v1/patients", json=patient_payload(), headers=headers)
    assert create_patient.status_code == 201
    patient = create_patient.get_json()["patient"]

    run_response = client.post(
        "/api/v1/predictions/run",
        json=run_payload(patient["id"], 2, 1, 3, 4, 6, ">8", "Steady"),
        headers=headers,
    )

    assert run_response.status_code == 201
    body = run_response.get_json()
    assert body["prediction"]["patient_id"] == patient["id"]
    assert body["prediction"]["risk_band"] in {"low", "moderate", "high"}
    assert body["history"]["prediction_id"] == body["prediction"]["id"]
    assert body["analysis"]["factors"]

    history_response = client.get("/api/v1/predictions", headers=headers)
    assert history_response.status_code == 200
    history_body = history_response.get_json()
    predictions = history_body["predictions"]
    assert len(predictions) == 1
    assert predictions[0]["patient_id"] == patient["id"]
    assert predictions[0]["risk_score"] == body["history"]["risk_score"]
    assert predictions[0]["predicted_label"] == body["prediction"]["predicted_label"]
    assert predictions[0]["threshold_used"] == body["history"]["threshold_used"]
    assert history_body["pagination"]["total"] == 1

    patient_response = client.get(f"/api/v1/patients/{patient['id']}", headers=headers)
    assert patient_response.status_code == 200
    updated_patient = patient_response.get_json()["patient"]
    assert updated_patient["risk_band"] == body["history"]["risk_class"]
    assert updated_patient["prediction_history"]

    patient_history_response = client.get(f"/api/v1/patients/{patient['id']}/predictions", headers=headers)
    assert patient_history_response.status_code == 200
    patient_history = patient_history_response.get_json()
    assert patient_history["predictions"][0]["prediction_id"] == body["prediction"]["id"]
    assert patient_history["predictions"][0]["predicted_label"] == body["prediction"]["predicted_label"]

    detail_response = client.get(
        f"/api/v1/predictions/{body['prediction']['id']}",
        headers=headers,
    )
    assert detail_response.status_code == 200
    assert detail_response.get_json()["prediction"]["id"] == body["prediction"]["id"]


def test_prediction_run_validation(client):
    headers = auth_header(client)
    response = client.post("/api/v1/predictions/run", json={"patient_id": 999}, headers=headers)
    assert response.status_code == 404


def test_prediction_history_filters_and_pagination(client):
    headers = auth_header(client)

    patient_one = client.post("/api/v1/patients", json=patient_payload(identifier="PAT-3001", full_name="Alpha One"), headers=headers)
    patient_two = client.post("/api/v1/patients", json=patient_payload(identifier="PAT-3002", full_name="Beta Two"), headers=headers)
    assert patient_one.status_code == 201
    assert patient_two.status_code == 201

    first_run = client.post(
        "/api/v1/predictions/run",
        json=run_payload(patient_one.get_json()["patient"]["id"], 1, 0, 3, 4, 5, ">8", "Steady"),
        headers=headers,
    )
    second_run = client.post(
        "/api/v1/predictions/run",
        json=run_payload(patient_two.get_json()["patient"]["id"], 0, 1, 4, 6, 7, "Normal", "Down"),
        headers=headers,
    )
    assert first_run.status_code == 201
    assert second_run.status_code == 201
    first_risk_band = first_run.get_json()["history"]["risk_class"]

    list_response = client.get("/api/v1/predictions?page=1&per_page=1&sort_by=prediction_date&sort_order=desc", headers=headers)
    assert list_response.status_code == 200
    list_body = list_response.get_json()
    assert len(list_body["predictions"]) == 1
    assert list_body["pagination"]["page"] == 1
    assert list_body["pagination"]["per_page"] == 1
    assert list_body["pagination"]["total"] == 2

    search_response = client.get("/api/v1/predictions?search=Alpha", headers=headers)
    assert search_response.status_code == 200
    assert len(search_response.get_json()["predictions"]) == 1

    filter_response = client.get(f"/api/v1/predictions?risk_band={first_risk_band}", headers=headers)
    assert filter_response.status_code == 200
    assert len(filter_response.get_json()["predictions"]) >= 1

    patient_history_response = client.get(
        f"/api/v1/patients/{patient_two.get_json()['patient']['id']}/predictions?sort_by=prediction_date&sort_order=desc",
        headers=headers,
    )
    assert patient_history_response.status_code == 200
    assert patient_history_response.get_json()["predictions"][0]["patient_id"] == patient_two.get_json()["patient"]["id"]


def test_batch_predictions_workflow(client, app):
    headers = auth_header(client)

    # 1. Create two patients
    p1 = client.post("/api/v1/patients", json=patient_payload("PAT-Batch1", "Patient One"), headers=headers).get_json()["patient"]
    p2 = client.post("/api/v1/patients", json=patient_payload("PAT-Batch2", "Patient Two"), headers=headers).get_json()["patient"]

    # Verify pending count is 2
    count_res = client.get("/api/v1/predictions/pending-count", headers=headers)
    assert count_res.status_code == 200
    assert count_res.get_json()["pending_count"] == 2

    # 2. Run pending predictions
    run_pending_res = client.post("/api/v1/predictions/run-pending", headers=headers)
    assert run_pending_res.status_code == 200
    res_pending = run_pending_res.get_json()
    assert res_pending["processed"] == 2
    assert res_pending["successful"] == 2
    assert res_pending["failed"] == 0

    # Verify pending count is now 0
    count_res2 = client.get("/api/v1/predictions/pending-count", headers=headers)
    assert count_res2.get_json()["pending_count"] == 0

    # Run pending predictions again, should process 0
    run_pending_res2 = client.post("/api/v1/predictions/run-pending", headers=headers)
    assert run_pending_res2.get_json()["processed"] == 0

    # 3. Run all predictions
    run_all_res = client.post("/api/v1/predictions/run-all", headers=headers)
    assert run_all_res.status_code == 200
    res_all = run_all_res.get_json()
    assert res_all["processed"] == 2
    assert res_all["successful"] == 2
    assert res_all["failed"] == 0

    # Verify that prediction history now has 4 entries (2 from pending, 2 from all)
    history_res = client.get("/api/v1/predictions", headers=headers)
    assert history_res.get_json()["pagination"]["total"] == 4


from unittest.mock import patch
from app.services.prediction_service import run_prediction

def test_batch_predictions_error_handling(client, app):
    headers = auth_header(client)

    # Create two patients
    p1 = client.post("/api/v1/patients", json=patient_payload("PAT-Err1", "Patient ErrOne"), headers=headers).get_json()["patient"]
    p2 = client.post("/api/v1/patients", json=patient_payload("PAT-Err2", "Patient ErrTwo"), headers=headers).get_json()["patient"]

    original_run = run_prediction
    
    def mock_run(payload, created_by_id=None):
        if payload["patient_id"] == p1["id"]:
            raise Exception("Simulated prediction error")
        return original_run(payload, created_by_id=created_by_id)

    with patch("app.routes.predictions.run_prediction", side_effect=mock_run):
        res = client.post("/api/v1/predictions/run-pending", headers=headers)
        assert res.status_code == 200
        body = res.get_json()
        assert body["processed"] == 2
        assert body["successful"] == 1
        assert body["failed"] == 1
        assert body["failed_patient_ids"] == [p1["id"]]

