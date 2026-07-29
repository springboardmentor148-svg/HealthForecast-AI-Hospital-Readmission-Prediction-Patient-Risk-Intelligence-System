from __future__ import annotations

from flask_jwt_extended import decode_token
from werkzeug.security import check_password_hash


def register_payload(email: str = "jane.doe@example.com") -> dict[str, str]:
    return {
        "full_name": "Jane Doe",
        "email": email,
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
        "phone": "+1-555-0100",
    }


def test_register_new_user(client, app):
    response = client.post("/api/v1/auth/register", json=register_payload())

    assert response.status_code == 201
    body = response.get_json()
    assert "user" in body
    assert body["user"]["email"] == "jane.doe@example.com"
    assert body["user"]["full_name"] == "Jane Doe"
    assert body["user"]["role"] == "doctor"
    assert "password_hash" not in body["user"]

    with app.app_context():
        from app.models import User

        user = User.query.filter_by(email="jane.doe@example.com").one()
        assert user.password_hash
        assert user.password_hash != "StrongPass123!"
        assert check_password_hash(user.password_hash, "StrongPass123!")


def test_register_duplicate_email(client):
    first = client.post("/api/v1/auth/register", json=register_payload())
    assert first.status_code == 201

    duplicate = client.post("/api/v1/auth/register", json=register_payload())
    assert duplicate.status_code == 409
    assert duplicate.get_json()["error"]["code"] == 409


def test_login_success(client, app):
    client.post("/api/v1/auth/register", json=register_payload())

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "StrongPass123!"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["access_token"]
    assert body["user"]["email"] == "jane.doe@example.com"

    with app.app_context():
        decoded = decode_token(body["access_token"])
    assert int(decoded["sub"]) > 0

    with app.app_context():
        from app.models import User

        user = User.query.filter_by(email="jane.doe@example.com").one()
        assert user.last_login_at is not None


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json=register_payload())

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "WrongPass123!"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == 401
    assert response.get_json()["error"]["message"] == "Invalid email or password"


def test_login_invalid_email_is_generic(client):
    client.post("/api/v1/auth/register", json=register_payload())

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email", "password": "WrongPass123!"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"]["message"] == "Invalid email or password"


def test_me_endpoint_requires_jwt_and_returns_user(client):
    register_response = client.post("/api/v1/auth/register", json=register_payload())
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "StrongPass123!"},
    )
    token = login_response.get_json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    body = me_response.get_json()
    assert body["user"]["email"] == "jane.doe@example.com"
    assert body["user"]["role"] == "doctor"
    assert "password_hash" not in body["user"]


def test_me_missing_token(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == 401


def test_logout_returns_success_when_authenticated(client):
    client.post("/api/v1/auth/register", json=register_payload())
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "StrongPass123!"},
    )
    token = login_response.get_json()["access_token"]

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Logged out successfully"


def test_admin_routes_require_admin_role(client):
    client.post("/api/v1/auth/register", json=register_payload())
    doctor_login = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "StrongPass123!"},
    )
    doctor_token = doctor_login.get_json()["access_token"]

    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="admin@example.com") | {"role": "system_administrator", "full_name": "Admin User"},
    )
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "StrongPass123!"},
    )
    admin_token = admin_login.get_json()["access_token"]

    forbidden_users = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert forbidden_users.status_code == 403

    allowed_users = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert allowed_users.status_code == 200

    allowed_models_doctor = client.get(
        "/api/v1/models/summary",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert allowed_models_doctor.status_code == 200

    allowed_models_admin = client.get(
        "/api/v1/models/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert allowed_models_admin.status_code == 200


def test_clinical_write_routes_require_clinical_role(client):
    client.post("/api/v1/auth/register", json=register_payload())
    doctor_login = client.post(
        "/api/v1/auth/login",
        json={"email": "jane.doe@example.com", "password": "StrongPass123!"},
    )
    doctor_token = doctor_login.get_json()["access_token"]

    client.post(
        "/api/v1/auth/register",
        json=register_payload(email="researcher@example.com") | {"role": "healthcare_researcher", "full_name": "Research User"},
    )
    researcher_login = client.post(
        "/api/v1/auth/login",
        json={"email": "researcher@example.com", "password": "StrongPass123!"},
    )
    researcher_token = researcher_login.get_json()["access_token"]

    allowed_patient = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "RBAC-1001",
            "full_name": "Role Protected",
            "age_at_admission": 50,
            "gender": "female",
            "admission_type": "urgent",
            "primary_diagnosis": "Hypertension",
            "admission_date": "2026-07-17",
            "time_in_hospital": 2,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 5,
            "risk_band": "moderate",
            "readmission_probability": 33.0,
        },
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert allowed_patient.status_code == 201

    forbidden_patient = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "RBAC-1002",
            "full_name": "Role Protected 2",
            "age_at_admission": 51,
            "gender": "female",
            "admission_type": "urgent",
            "primary_diagnosis": "Hypertension",
            "admission_date": "2026-07-17",
            "time_in_hospital": 2,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 5,
            "risk_band": "moderate",
            "readmission_probability": 33.0,
        },
        headers={"Authorization": f"Bearer {researcher_token}"},
    )
    assert forbidden_patient.status_code == 403
