"""Tests for patient CRUD endpoints."""

SAMPLE_PATIENT = {
    "patient_name": "Test Patient",
    "gender": "female",
    "age": 65,
    "race": "Caucasian",
    "admission_type": "Emergency",
    "discharge_disposition": "Home",
    "admission_source": "Emergency Room",
    "time_in_hospital": 4,
    "num_lab_procedures": 40,
    "num_procedures": 1,
    "num_medications": 15,
    "number_outpatient": 0,
    "number_emergency": 1,
    "number_inpatient": 0,
    "diagnosis_1": "250.01",
    "diabetes_med": "Yes",
    "insulin": "Steady",
    "a1c_result": ">7",
    "glucose_result": "Norm",
    "attending_doctor": "Dr. Jane Doe",
}


def test_create_patient(client, auth_headers):
    response = client.post("/api/v1/patients", json=SAMPLE_PATIENT, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["patient_name"] == SAMPLE_PATIENT["patient_name"]
    assert "id" in body


def test_create_patient_requires_auth(client):
    response = client.post("/api/v1/patients", json=SAMPLE_PATIENT)
    assert response.status_code == 401


def test_get_patient(client, auth_headers):
    create_resp = client.post("/api/v1/patients", json=SAMPLE_PATIENT, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/patients/{patient_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == patient_id


def test_list_patients_with_pagination(client, auth_headers):
    client.post("/api/v1/patients", json=SAMPLE_PATIENT, headers=auth_headers)
    response = client.get("/api/v1/patients?page=1&page_size=10", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert isinstance(body["items"], list)


def test_update_patient(client, auth_headers):
    create_resp = client.post("/api/v1/patients", json=SAMPLE_PATIENT, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/patients/{patient_id}", json={"age": 70}, headers=auth_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["age"] == 70


def test_delete_patient(client, auth_headers):
    create_resp = client.post("/api/v1/patients", json=SAMPLE_PATIENT, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/patients/{patient_id}", headers=auth_headers)
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/patients/{patient_id}", headers=auth_headers)
    assert get_resp.status_code == 404
