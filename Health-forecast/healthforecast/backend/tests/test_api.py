"""
End-to-end API tests for the HealthForecast AI backend.

Run from healthforecast/backend/:
    pytest -v

Uses a throwaway SQLite file (test_healthforecast.db) so it never touches
the real dev database, and seeds its own users rather than relying on
seed_db.py having been run first.
"""
import os
import sys

# Point the app at an isolated test database BEFORE importing it, since
# database.py reads HF_DATABASE_URL at import time.
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_healthforecast.db")
os.environ["HF_DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["HF_JWT_SECRET"] = "test-secret"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

import main            # noqa: E402  (must import after env vars are set)
import models          # noqa: E402
import auth             # noqa: E402
from database import SessionLocal  # noqa: E402

client = TestClient(main.app)


@pytest.fixture(scope="session", autouse=True)
def seed_users():
    """Create one user per role, matching the roles in the spec's Access Matrix."""
    db = SessionLocal()
    users = [
        ("Dr. Test Doctor", "doctor@test.local", "pass1234", models.RoleEnum.doctor),
        ("Test Hospital Admin", "hospadmin@test.local", "pass1234", models.RoleEnum.hospital_admin),
        ("Test Researcher", "researcher@test.local", "pass1234", models.RoleEnum.researcher),
        ("Test Sys Admin", "sysadmin@test.local", "pass1234", models.RoleEnum.system_admin),
    ]
    for full_name, email, pw, role in users:
        if not db.query(models.User).filter(models.User.email == email).first():
            db.add(models.User(
                full_name=full_name, email=email,
                hashed_password=auth.hash_password(pw), role=role,
            ))
    db.commit()
    db.close()
    yield
    db = SessionLocal()
    db.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def login(email, password):
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(email, password):
    return {"Authorization": f"Bearer {login(email, password)}"}


# ---------------------------------------------------------------------
# Health / auth
# ---------------------------------------------------------------------
def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_success_and_failure():
    token = login("doctor@test.local", "pass1234")
    assert token

    r = client.post("/auth/login", data={"username": "doctor@test.local", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_token():
    r = client.get("/auth/me")
    assert r.status_code == 401

    h = auth_headers("doctor@test.local", "pass1234")
    r = client.get("/auth/me", headers=h)
    assert r.status_code == 200
    assert r.json()["role"] == "doctor"


# ---------------------------------------------------------------------
# RBAC — Access Matrix from the spec (Section 4)
# ---------------------------------------------------------------------
def test_only_system_admin_can_list_users():
    doctor_h = auth_headers("doctor@test.local", "pass1234")
    admin_h = auth_headers("sysadmin@test.local", "pass1234")

    r = client.get("/users", headers=doctor_h)
    assert r.status_code == 403

    r = client.get("/users", headers=admin_h)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_researcher_cannot_create_patients():
    researcher_h = auth_headers("researcher@test.local", "pass1234")
    r = client.post("/patients", headers=researcher_h, json={
        "mrn": "RBAC-001", "full_name": "Should Fail", "age_bracket": "[50-60)", "gender": "Male",
    })
    assert r.status_code == 403


# ---------------------------------------------------------------------
# Patient lifecycle + prediction (Risk Prediction / Readmission Forecasting Modules)
# ---------------------------------------------------------------------
def test_patient_create_predict_and_scope():
    doctor_h = auth_headers("doctor@test.local", "pass1234")

    r = client.post("/patients", headers=doctor_h, json={
        "mrn": "PT-100", "full_name": "Alex Rivera", "age_bracket": "[70-80)",
        "gender": "Female", "number_inpatient": 3, "number_emergency": 2,
        "num_medications": 25, "A1Cresult": ">8", "time_in_hospital": 9,
    })
    assert r.status_code == 200, r.text
    patient = r.json()
    pid = patient["id"]
    assert patient["mrn"] == "PT-100"

    r = client.post(f"/patients/{pid}/predict", headers=doctor_h, json={
        "age_bracket": "[70-80)", "number_inpatient": 3, "number_emergency": 2,
        "num_medications": 25, "A1Cresult": ">8", "time_in_hospital": 9,
    })
    assert r.status_code == 200, r.text
    pred = r.json()
    assert 0.0 <= pred["risk_score"] <= 1.0
    assert pred["risk_category"] in {"Low", "Medium", "High"}
    assert isinstance(pred["care_recommendations"], list) and pred["care_recommendations"]
    assert isinstance(pred["top_factors"], list) and len(pred["top_factors"]) > 0

    # Doctor sees their own patient
    r = client.get(f"/patients/{pid}", headers=doctor_h)
    assert r.status_code == 200

    # Researcher cannot read raw (non-anonymized) patient records
    researcher_h = auth_headers("researcher@test.local", "pass1234")
    r = client.get(f"/patients/{pid}", headers=researcher_h)
    assert r.status_code == 403


# ---------------------------------------------------------------------
# Analytics Dashboard Module
# ---------------------------------------------------------------------
def test_analytics_endpoints():
    doctor_h = auth_headers("doctor@test.local", "pass1234")

    for path in (
        "/analytics/summary",
        "/analytics/model-performance",
        "/analytics/trends",
        "/analytics/hospital-performance",
    ):
        r = client.get(path, headers=doctor_h)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text}"


def test_model_metrics_are_sane():
    doctor_h = auth_headers("doctor@test.local", "pass1234")
    r = client.get("/analytics/model-performance", headers=doctor_h)
    assert r.status_code == 200
    metrics = r.json()["metrics"]
    for key in ("accuracy", "precision", "recall", "f1_score", "roc_auc"):
        assert 0.0 <= metrics[key] <= 1.0


# ---------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------
def test_audit_log_records_login_and_is_admin_only():
    doctor_h = auth_headers("doctor@test.local", "pass1234")
    admin_h = auth_headers("sysadmin@test.local", "pass1234")

    r = client.get("/audit-logs", headers=doctor_h)
    assert r.status_code == 403

    r = client.get("/audit-logs", headers=admin_h)
    assert r.status_code == 200
    actions = [entry["action"] for entry in r.json()]
    assert "login" in actions
