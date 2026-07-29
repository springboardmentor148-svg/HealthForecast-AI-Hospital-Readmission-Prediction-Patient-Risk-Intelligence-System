from __future__ import annotations

from io import BytesIO

from app.models import Patient, UserRole
from tests.test_auth import register_payload


def test_import_endpoints_require_system_admin(client):
    # Register Doctor
    client.post("/api/v1/auth/register", json=register_payload(email="doc@example.com"))
    doc_login = client.post(
        "/api/v1/auth/login",
        json={"email": "doc@example.com", "password": "StrongPass123!"},
    )
    doc_token = doc_login.get_json()["access_token"]

    # Register System Admin
    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="admin@example.com")
        | {"role": "system_administrator", "full_name": "Admin User"},
    )
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "StrongPass123!"},
    )
    admin_token = admin_login.get_json()["access_token"]

    csv_data = b"patient_identifier,first_name,last_name,gender,admission_type,primary_diagnosis\n"

    # Test Validation endpoint with Doctor -> Should be 403
    res = client.post(
        "/api/v1/patients/import/validate",
        data={"file": (BytesIO(csv_data), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert res.status_code == 403

    # Test Import endpoint with Doctor -> Should be 403
    res = client.post(
        "/api/v1/patients/import",
        data={"file": (BytesIO(csv_data), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert res.status_code == 403

    # Test Validation endpoint with Admin -> Should be 200/400 (not 403)
    res = client.post(
        "/api/v1/patients/import/validate",
        data={"file": (BytesIO(csv_data), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code in {200, 400}


def test_csv_validation_and_preview(client):
    # Register and login System Admin
    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="admin@example.com")
        | {"role": "system_administrator", "full_name": "Admin User"},
    )
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "StrongPass123!"},
    )
    admin_token = admin_login.get_json()["access_token"]

    # 1. Invalid columns CSV
    bad_csv = b"patient_id,first_name,last_name\n1,John,Doe\n"
    res = client.post(
        "/api/v1/patients/import/validate",
        data={"file": (BytesIO(bad_csv), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.get_json()["success"] is False
    assert "Missing required columns" in res.get_json()["error"]

    # 2. Valid CSV with correct template columns
    good_csv = (
        b"patient_identifier,first_name,last_name,age_at_admission,gender,admission_type,primary_diagnosis\n"
        b"EMP-TEST1,John,Doe,45,male,emergency,Type 2 Diabetes\n"
        b"EMP-TEST2,Jane,Smith,,female,elective,Type 2 Diabetes\n"
        b"EMP-TEST3,,Smith,60,female,elective,Type 2 Diabetes\n"  # missing first_name
    )
    res = client.post(
        "/api/v1/patients/import/validate",
        data={"file": (BytesIO(good_csv), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    payload = res.get_json()
    assert payload["success"] is True
    assert payload["total_rows"] == 3
    assert payload["valid_rows_count"] == 2
    assert payload["invalid_rows_count"] == 1
    assert len(payload["validation_errors"]) == 1
    assert payload["validation_errors"][0]["row"] == 3
    assert "first_name" in payload["validation_errors"][0]["reason"]


def test_csv_import_execution(client, app):
    # Register and login System Admin
    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="admin@example.com")
        | {"role": "system_administrator", "full_name": "Admin User"},
    )
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "StrongPass123!"},
    )
    admin_token = admin_login.get_json()["access_token"]

    # Valid import CSV
    good_csv = (
        b"patient_identifier,first_name,last_name,age_at_admission,gender,admission_type,primary_diagnosis,medications\n"
        b"EMP-IMP1,John,Doe,45,male,emergency,Type 2 Diabetes,Metformin\n"
        b"EMP-IMP2,Jane,Smith,,female,elective,Type 2 Diabetes,Insulin\n"
    )

    res = client.post(
        "/api/v1/patients/import",
        data={"file": (BytesIO(good_csv), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    payload = res.get_json()
    assert payload["success"] is True
    assert payload["imported"] == 2
    assert payload["skipped"] == 0
    assert payload["failed"] == 0

    # Verify they exist in the DB
    with app.app_context():
        p1 = Patient.query.filter_by(patient_identifier="EMP-IMP1").first()
        assert p1 is not None
        assert p1.first_name == "John"
        assert p1.last_name == "Doe"
        assert p1.age_at_admission == 45
        assert p1.medications == ["Metformin"]

    # Re-run same import, they should be skipped as duplicates
    res = client.post(
        "/api/v1/patients/import",
        data={"file": (BytesIO(good_csv), "test.csv")},
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    payload = res.get_json()
    assert payload["success"] is True
    assert payload["imported"] == 0
    assert payload["skipped"] == 2
