from __future__ import annotations

from io import BytesIO

import joblib

from app.extensions import db
from app.models import Patient
from tests.test_auth import register_payload


def admin_auth_header(client) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="admin.parity@example.com") | {"role": "system_administrator", "full_name": "Admin Parity"},
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin.parity@example.com", "password": "StrongPass123!"},
    )
    return {"Authorization": f"Bearer {login.get_json()['access_token']}"}


def parity_patient_payload() -> dict[str, object]:
    return {
        "patient_identifier": "PARITY-1001",
        "full_name": "Parity Patient",
        "age_at_admission": 58,
        "gender": "female",
        "admission_type": "emergency",
        "primary_diagnosis": "Type 2 Diabetes Mellitus",
        "secondary_diagnosis": "Hypertension",
        "admission_date": "2026-07-17",
        "discharge_date": "2026-07-21",
        "time_in_hospital": 4,
        "prior_diagnoses_count": 6,
        "lab_procedures_count": 10,
        "admission_source_id": 17,
        "discharge_disposition_id": 1,
        "number_inpatient": 2,
        "number_emergency": 1,
        "number_outpatient": 3,
        "num_procedures": 4,
        "num_medications": 23,
        "diag_3": "250.00",
        "a1c_result": ">8",
        "max_glu_serum": ">300",
        "insulin_usage": "Steady",
        "medications": ["Metformin", "Insulin Glargine"],
        "risk_band": "moderate",
        "readmission_probability": 44.0,
    }


def test_patient_feature_fields_persist_and_serialize(client, app):
    headers = admin_auth_header(client)

    response = client.post("/api/v1/patients", json=parity_patient_payload(), headers=headers)
    assert response.status_code == 201
    body = response.get_json()["patient"]

    assert body["number_inpatient"] == 2
    assert body["number_emergency"] == 1
    assert body["number_outpatient"] == 3
    assert body["num_procedures"] == 4
    assert body["admission_source_id"] == 17
    assert body["discharge_disposition_id"] == 1
    assert body["num_medications"] == 23
    assert body["diag_3"] == "250"
    assert body["a1c_result"] == ">8"
    assert body["max_glu_serum"] == ">300"
    assert body["insulin_usage"] == "Steady"

    with app.app_context():
        patient = Patient.query.filter_by(patient_identifier="PARITY-1001").one()
        assert patient.number_inpatient == 2
        assert patient.number_emergency == 1
        assert patient.number_outpatient == 3
        assert patient.num_procedures == 4
        assert patient.admission_source_id == 17
        assert patient.discharge_disposition_id == 1
        assert patient.num_medications == 23
        assert patient.diag_3 == "250"
        assert patient.a1c_result == ">8"
        assert patient.max_glu_serum == ">300"
        assert patient.insulin_usage == "Steady"


def test_patient_aliases_are_accepted(client):
    headers = admin_auth_header(client)

    payload = parity_patient_payload() | {
        "patient_identifier": "PARITY-1002",
        "prior_inpatient": 5,
        "prior_emergency": 4,
        "A1Cresult": "Normal",
        "insulin": "Up",
    }
    payload.pop("number_inpatient")
    payload.pop("number_emergency")
    payload.pop("a1c_result")
    payload.pop("insulin_usage")

    response = client.post("/api/v1/patients", json=payload, headers=headers)
    assert response.status_code == 201
    body = response.get_json()["patient"]
    assert body["number_inpatient"] == 5
    assert body["number_emergency"] == 4
    assert body["a1c_result"] == "Normal"
    assert body["insulin_usage"] == "Up"


def test_csv_import_supports_new_feature_columns(client, app):
    headers = admin_auth_header(client)
    csv_data = (
        "patient_identifier,first_name,last_name,gender,admission_type,primary_diagnosis,age_at_admission,time_in_hospital,lab_procedures_count,prior_diagnoses_count,admission_source_id,discharge_disposition_id,number_inpatient,number_emergency,number_outpatient,num_procedures,num_medications,diag_3,a1c_result,max_glu_serum,insulin_usage,medications\n"
        'PARITY-CSV1,Jane,Doe,female,emergency,Type 2 Diabetes,58,4,10,6,17,1,2,1,3,4,23,250.00,>8,>300,Steady,"Metformin,Insulin"\n'
    )

    response = client.post(
        "/api/v1/patients/import/validate",
        data={"file": (BytesIO(csv_data.encode("utf-8")), "parity.csv")},
        content_type="multipart/form-data",
        headers=headers,
    )
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["valid_rows_count"] == 1

    import_response = client.post(
        "/api/v1/patients/import",
        data={"file": (BytesIO(csv_data.encode("utf-8")), "parity.csv")},
        content_type="multipart/form-data",
        headers=headers,
    )
    assert import_response.status_code == 200
    imported = import_response.get_json()
    assert imported["imported"] == 1

    with app.app_context():
        patient = Patient.query.filter_by(patient_identifier="PARITY-CSV1").one()
        assert patient.number_inpatient == 2
        assert patient.number_emergency == 1
        assert patient.number_outpatient == 3
        assert patient.num_procedures == 4
        assert patient.admission_source_id == 17
        assert patient.discharge_disposition_id == 1
        assert patient.num_medications == 23
        assert patient.diag_3 == "250"
        assert patient.a1c_result == ">8"
        assert patient.max_glu_serum == ">300"
        assert patient.insulin_usage == "Steady"


def test_feature_vector_parity_and_missing_handling(client, app):
    headers = admin_auth_header(client)
    response = client.post("/api/v1/patients", json=parity_patient_payload(), headers=headers)
    assert response.status_code == 201
    patient_id = response.get_json()["patient"]["id"]

    with app.app_context():
        service = app.extensions["ml_inference_service"]
        patient = db.session.get(Patient, patient_id)
        vector, row, snapshot = service.preprocess(
            {
                "patient_id": patient.id,
                "number_inpatient": patient.number_inpatient,
                "number_emergency": patient.number_emergency,
                "number_outpatient": patient.number_outpatient,
                "num_procedures": patient.num_procedures,
                "admission_source_id": patient.admission_source_id,
                "discharge_disposition_id": patient.discharge_disposition_id,
                "num_medications": patient.num_medications,
                "diag_3": patient.diag_3,
                "a1c_result": patient.a1c_result,
                "max_glu_serum": patient.max_glu_serum,
                "insulin_usage": patient.insulin_usage,
            },
            patient,
        )

        feature_names = joblib.load("models/feature_names.pkl")
        assert len(feature_names) == 85
        assert len(vector) == 85
        assert snapshot["feature_names"] == feature_names
        assert list(row.keys()) == feature_names
        assert row["number_inpatient"] == 2.0
        assert row["number_emergency"] == 1.0
        assert row["number_outpatient"] == 3.0
        assert row["num_procedures"] == 4.0
        assert row["admission_source_id"] == 17.0
        assert row["discharge_disposition_id"] == 1.0
        assert row["num_medications"] == 23.0
        assert row["A1Cresult__8"] == 1.0
        assert row["max_glu_serum__300"] == 1.0
        assert row["insulin_Steady"] == 1.0
        assert "readmitted" not in row


def test_prediction_smoke_returns_probability_and_band(client, app):
    headers = admin_auth_header(client)
    response = client.post("/api/v1/patients", json=parity_patient_payload(), headers=headers)
    assert response.status_code == 201
    patient = response.get_json()["patient"]

    run_response = client.post(
        "/api/v1/predictions/run",
        json={
            "patient_id": patient["id"],
            "number_inpatient": patient["number_inpatient"],
            "number_emergency": patient["number_emergency"],
            "number_outpatient": patient["number_outpatient"],
            "num_procedures": patient["num_procedures"],
            "admission_source_id": patient["admission_source_id"],
            "discharge_disposition_id": patient["discharge_disposition_id"],
            "num_medications": patient["num_medications"],
            "diag_3": patient["diag_3"],
            "a1c_result": patient["a1c_result"],
            "max_glu_serum": patient["max_glu_serum"],
            "insulin_usage": patient["insulin_usage"],
        },
        headers=headers,
    )
    assert run_response.status_code == 201
    body = run_response.get_json()
    assert 0 <= body["prediction"]["readmission_probability"] <= 100
    assert body["prediction"]["risk_band"] in {"low", "moderate", "high", "critical"}
