"""Tests for authentication endpoints."""


def test_register_new_user(client):
    payload = {
        "full_name": "Dr. John Smith",
        "email": "john.smith@hospital.example.com",
        "password": "StrongPass123",
        "role": "doctor",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == payload["email"]
    assert "hashed_password" not in body


def test_register_duplicate_email_rejected(client, registered_doctor):
    response = client.post("/api/v1/auth/register", json=registered_doctor)
    assert response.status_code == 409


def test_login_success(client, registered_doctor):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": registered_doctor["email"], "password": registered_doctor["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_wrong_password(client, registered_doctor):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": registered_doctor["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_profile(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "doctor"
