from __future__ import annotations

def patient_payload(
    identifier: str = "PAT-1001",
    full_name: str = "Jane Doe",
    *,
    age: int = 46,
    gender: str = "female",
    admission_type: str = "emergency",
    risk_band: str = "high",
    readmission_probability: float = 84.12,
    primary_diagnosis: str = "Type 2 Diabetes Mellitus",
    secondary_diagnosis: str = "Hypertension",
    admission_date: str = "2026-07-17",
    discharge_date: str = "2026-07-21",
) -> dict[str, object]:
    return {
        "patient_identifier": identifier,
        "full_name": full_name,
        "age_at_admission": age,
        "gender": gender,
        "admission_type": admission_type,
        "primary_diagnosis": primary_diagnosis,
        "secondary_diagnosis": secondary_diagnosis,
        "admission_date": admission_date,
        "discharge_date": discharge_date,
        "time_in_hospital": 4,
        "prior_diagnoses_count": 3,
        "lab_procedures_count": 12,
        "medications": ["Metformin", "Insulin Glargine"],
        "follow_up_schedule": "Follow up within 7 days.",
        "discharge_plan": "Diet and glucose monitoring.",
        "risk_band": risk_band,
        "readmission_probability": readmission_probability,
        "is_active": True,
    }


def auth_header(client) -> dict[str, str]:
    client.post("/api/v1/auth/register", json={
        "full_name": "Auth User",
        "email": "auth.user@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "auth.user@example.com", "password": "StrongPass123!"},
    )
    token = login.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_patient_list_requires_auth(client):
    response = client.get("/api/v1/patients")
    assert response.status_code == 401


def test_patient_crud_flow(client, app):
    headers = auth_header(client)

    create_response = client.post("/api/v1/patients", json=patient_payload(), headers=headers)
    assert create_response.status_code == 201
    created = create_response.get_json()["patient"]
    assert created["patient_identifier"] == "PAT-1001"
    assert created["full_name"] == "Jane Doe"
    assert created["primary_diagnosis"] == "Type 2 Diabetes Mellitus"
    assert created["prediction_history"] == []

    list_response = client.get("/api/v1/patients", headers=headers)
    assert list_response.status_code == 200
    patients = list_response.get_json()["patients"]
    assert len(patients) == 1
    assert patients[0]["patient_identifier"] == "PAT-1001"

    detail_response = client.get(f"/api/v1/patients/{created['id']}", headers=headers)
    assert detail_response.status_code == 200
    assert detail_response.get_json()["patient"]["full_name"] == "Jane Doe"

    update_response = client.put(
        f"/api/v1/patients/{created['id']}",
        json={"full_name": "Jane A. Doe", "primary_diagnosis": "Type 1 Diabetes Mellitus"},
        headers=headers,
    )
    assert update_response.status_code == 200
    updated = update_response.get_json()["patient"]
    assert updated["full_name"] == "Jane A. Doe"
    assert updated["primary_diagnosis"] == "Type 1 Diabetes Mellitus"

    delete_response = client.delete(f"/api/v1/patients/{created['id']}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/patients/{created['id']}", headers=headers)
    assert missing_response.status_code == 404


def test_patient_validation_errors(client):
    headers = auth_header(client)

    bad_response = client.post(
        "/api/v1/patients",
        json={"full_name": "Bad Patient"},
        headers=headers,
    )
    assert bad_response.status_code == 400
    body = bad_response.get_json()
    assert body["error"]["message"] == "Validation failed"
    assert "fields" in body["error"]
    assert body["error"]["fields"]["patient_identifier"] == "patient_identifier is required"
    assert body["error"]["fields"]["primary_diagnosis"] == "primary_diagnosis is required"
    assert body["error"]["fields"]["gender"] == "gender is required"


def test_patient_list_search_filter_sort_and_pagination(client):
    headers = auth_header(client)

    client.post("/api/v1/patients", json=patient_payload(identifier="PAT-2001", full_name="Alice Heart", risk_band="low", readmission_probability=12.5), headers=headers)
    client.post("/api/v1/patients", json=patient_payload(identifier="PAT-2002", full_name="Bob Flow", risk_band="moderate", readmission_probability=44.1, gender="male", admission_type="urgent", primary_diagnosis="Hypertension"), headers=headers)
    client.post("/api/v1/patients", json=patient_payload(identifier="PAT-2003", full_name="Charlie High", risk_band="high", readmission_probability=88.9, gender="male", admission_type="elective", primary_diagnosis="Heart Failure"), headers=headers)

    search_response = client.get("/api/v1/patients?search=Charlie", headers=headers)
    assert search_response.status_code == 200
    search_body = search_response.get_json()
    assert len(search_body["patients"]) == 1
    assert search_body["patients"][0]["patient_identifier"] == "PAT-2003"

    filter_response = client.get("/api/v1/patients?risk_band=moderate&gender=male", headers=headers)
    assert filter_response.status_code == 200
    filter_body = filter_response.get_json()
    assert len(filter_body["patients"]) == 1
    assert filter_body["patients"][0]["patient_identifier"] == "PAT-2002"

    sort_response = client.get("/api/v1/patients?sort_by=readmission_probability&sort_order=asc", headers=headers)
    assert sort_response.status_code == 200
    sort_body = sort_response.get_json()
    assert sort_body["patients"][0]["patient_identifier"] == "PAT-2001"

    page_response = client.get("/api/v1/patients?page=1&per_page=2&sort_by=id&sort_order=asc", headers=headers)
    assert page_response.status_code == 200
    page_body = page_response.get_json()
    assert len(page_body["patients"]) == 2
    assert page_body["pagination"]["page"] == 1
    assert page_body["pagination"]["per_page"] == 2
    assert page_body["pagination"]["total"] == 3
