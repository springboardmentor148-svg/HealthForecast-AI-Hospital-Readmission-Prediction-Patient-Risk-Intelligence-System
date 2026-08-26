from __future__ import annotations

import json
from decimal import Decimal
from datetime import datetime, timezone
from app.models import Patient, Prediction, PredictionHistory, ActivityLog, RiskBand, PredictionType, UserRole
from app.extensions import db
from app.services.user_service import log_user_activity, list_user_activity

def register_user(client, email, name, role="doctor") -> str:
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": "Password123!",
            "role": role,
            "department": "Cardiology",
        },
    )
    assert res.status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login.status_code == 200
    return login.get_json()["access_token"]


def test_activity_log_flow(client, app):
    # 1. Register users and get tokens
    token_a = register_user(client, "user_a@example.com", "User Alpha")
    token_b = register_user(client, "user_b@example.com", "User Beta")
    
    with app.app_context():
        from app.models import User
        user_a = User.query.filter_by(email="user_a@example.com").first()
        user_b = User.query.filter_by(email="user_b@example.com").first()
        assert user_a is not None
        assert user_b is not None

    # 2. Verify initial activity state contains only the login event
    res = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    activities = res.get_json()["activities"]
    assert len(activities) == 1
    assert activities[0]["action"] == "login"

    # 3. Add activity manually using log_user_activity and check newest-first sorting
    with app.app_context():
        log1 = log_user_activity(user_id=user_a.id, action="login", target_type="User", target_id=user_a.id)
        assert log1 is not None
        
        log2 = log_user_activity(user_id=user_a.id, action="update_profile", target_type="User", target_id=user_a.id)
        assert log2 is not None

        log3 = log_user_activity(user_id=user_b.id, action="login", target_type="User", target_id=user_b.id)
        assert log3 is not None

    # 4. Verify user A gets only user A's logs and in newest-first ordering
    res = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    activities = res.get_json()["activities"]
    assert len(activities) == 3
    assert activities[0]["action"] == "update_profile"
    assert activities[1]["action"] == "login"
    assert activities[2]["action"] == "login"

    # Verify user B gets only user B's logs (register login + manual login)
    res_b = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200
    activities_b = res_b.get_json()["activities"]
    assert len(activities_b) == 2
    assert activities_b[0]["action"] == "login"
    assert activities_b[1]["action"] == "login"

    # 5. Verify unauthenticated requests are rejected
    res_unauth = client.get("/api/v1/users/me/activity")
    assert res_unauth.status_code == 401

    # 6. Verify logging failure does not crash outer transaction
    with app.app_context():
        # Passing non-JSON-serializable metadata triggers serialization error on flush
        bad_log = log_user_activity(user_id=user_a.id, action="test", target_type="User", target_id=user_a.id, metadata={"invalid": object()})
        assert bad_log is None  # Handled safely without exception bubble


    # 7. Verify patient action creates activity log automatically
    create_patient_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "PAT-ActivityTest",
            "full_name": "Active Jane",
            "age_at_admission": 35,
            "gender": "female",
            "admission_type": "emergency",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 3,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 8,
            "medications": ["metformin"],
        },
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert create_patient_res.status_code == 201
    patient_id = create_patient_res.get_json()["patient"]["id"]

    res_p = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    activities_p = res_p.get_json()["activities"]
    assert any(a["action"] == "create_patient" and str(a["target_id"]) == str(patient_id) for a in activities_p)

    # 8. Verify update patient creates activity
    update_patient_res = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"primary_diagnosis": "Ketoacidosis"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert update_patient_res.status_code == 200

    res_up = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    activities_up = res_up.get_json()["activities"]
    assert any(a["action"] == "update_patient" and str(a["target_id"]) == str(patient_id) for a in activities_up)

    # 9. Verify run prediction creates activity
    predict_res = client.post(
        "/api/v1/predictions/run",
        json={
            "patient_id": patient_id,
            "prior_inpatient": 1,
            "prior_emergency": 0,
            "medications_count": 4,
            "time_in_hospital": 3,
            "diagnoses_count": 3,
            "a1c_result": "None",
            "insulin_usage": "No",
        },
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert predict_res.status_code == 201
    pred_id = predict_res.get_json()["prediction"]["id"]

    res_pred = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    activities_pred = res_pred.get_json()["activities"]
    assert any(a["action"] == "run_prediction" and str(a["target_id"]) == str(pred_id) for a in activities_pred)

    # 10. Verify delete patient creates activity (using a new patient without predictions to avoid append-only cascade error)
    create_patient_res2 = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "PAT-ActivityTest2",
            "full_name": "Active Jane2",
            "age_at_admission": 35,
            "gender": "female",
            "admission_type": "emergency",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 3,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 8,
            "medications": ["metformin"],
        },
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert create_patient_res2.status_code == 201
    patient_id2 = create_patient_res2.get_json()["patient"]["id"]

    delete_patient_res = client.delete(
        f"/api/v1/patients/{patient_id2}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert delete_patient_res.status_code == 204

    res_del = client.get("/api/v1/users/me/activity", headers={"Authorization": f"Bearer {token_a}"})
    activities_del = res_del.get_json()["activities"]
    assert any(a["action"] == "delete_patient" and str(a["target_id"]) == str(patient_id2) for a in activities_del)

