from __future__ import annotations

from app.models import Notification, User, Patient
from app.extensions import db


def auth_header(client, email="doctor.notif@example.com", name="Doctor Notif") -> dict[str, str]:
    client.post("/api/v1/auth/register", json={
        "full_name": name,
        "email": email,
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123!"},
    )
    token = login.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_notifications_endpoints(client, app):
    headers1 = auth_header(client, "doc1@example.com", "Doctor One")
    headers2 = auth_header(client, "doc2@example.com", "Doctor Two")

    # 1. Registering doc1 and doc2 should have generated notifications
    res1 = client.get("/api/v1/notifications", headers=headers1)
    assert res1.status_code == 200
    data1 = res1.get_json()["notifications"]
    assert len(data1) >= 1
    
    # Check that there is a USER_REGISTERED notification
    reg_notifs = [n for n in data1 if n["notification_type"] == "USER_REGISTERED"]
    assert len(reg_notifs) >= 1
    notif_id = reg_notifs[0]["id"]
    assert reg_notifs[0]["read_status"] is False

    # 2. Mark notification as read for doc1
    patch_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers1)
    assert patch_res.status_code == 200
    assert patch_res.get_json()["notification"]["read_status"] is True

    # 3. Mark all read for doc2
    res2 = client.get("/api/v1/notifications", headers=headers2)
    assert res2.status_code == 200
    data2 = res2.get_json()["notifications"]
    assert any(n["read_status"] is False for n in data2)

    post_res = client.post("/api/v1/notifications/mark-all-read", headers=headers2)
    assert post_res.status_code == 200

    res2_after = client.get("/api/v1/notifications", headers=headers2)
    data2_after = res2_after.get_json()["notifications"]
    assert all(n["read_status"] is True for n in data2_after)


def test_patient_created_trigger(client, app):
    headers = auth_header(client, "patient_doc@example.com", "Patient Doc")

    # Create patient via API
    payload = {
        "patient_identifier": "PAT-NOTIF-1",
        "full_name": "John Alert",
        "age_at_admission": 35,
        "gender": "male",
        "admission_type": "elective",
        "primary_diagnosis": "Diabetes",
        "time_in_hospital": 3,
        "prior_diagnoses_count": 1,
        "lab_procedures_count": 5,
        "medications": [],
        "risk_band": "low",
        "readmission_probability": 12.5
    }
    
    create_res = client.post("/api/v1/patients", json=payload, headers=headers)
    assert create_res.status_code == 201

    # Get notifications and verify Patient Created exists
    notif_res = client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifications = notif_res.get_json()["notifications"]
    
    patient_created_notifs = [n for n in notifications if n["notification_type"] == "PATIENT_CREATED"]
    assert len(patient_created_notifs) == 1
    assert "John Alert" in patient_created_notifs[0]["message"]
