from __future__ import annotations

from app.models import ClinicalSupportPlan, Patient, UserRole
from tests.test_auth import register_payload


def test_clinical_support_plan_persistence_and_rbac(client, app):
    # 1. Register a doctor and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor Support",
        "email": "doc_support@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "doc_support@example.com", "password": "StrongPass123!"},
    )
    doc_token = login_res.get_json()["access_token"]

    # 2. Register a researcher and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Researcher Support",
        "email": "research_support@example.com",
        "password": "StrongPass123!",
        "role": "healthcare_researcher",
        "department": "Clinical Research",
    })
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": "research_support@example.com", "password": "StrongPass123!"},
    )
    researcher_token = res_login.get_json()["access_token"]

    # 3. Create a patient as the doctor
    create_pat_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "CS-PAT-001",
            "full_name": "Charlie Support",
            "age_at_admission": 60,
            "gender": "male",
            "admission_type": "emergency",
            "primary_diagnosis": "Type 1 Diabetes",
            "time_in_hospital": 3,
            "prior_diagnoses_count": 0,
            "lab_procedures_count": 10,
            "risk_band": "high",
            "readmission_probability": 65.0,
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert create_pat_res.status_code == 201
    patient_id = create_pat_res.get_json()["patient"]["id"]

    # 4. Get clinical support initially -> plan should be null
    get_res = client.get(
        f"/api/v1/clinical-support/{patient_id}",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.get_json()["plan"] is None

    # 5. Try to save draft as researcher -> Should be forbidden
    draft_notes = "Glycemic control looks sub-optimal, recommend dose increase."
    draft_res_researcher = client.post(
        f"/api/v1/clinical-support/{patient_id}/draft",
        json={"draft_notes": draft_notes},
        headers={"Authorization": f"Bearer {researcher_token}"},
    )
    assert draft_res_researcher.status_code == 403

    # 6. Save draft as doctor -> Should succeed
    draft_res = client.post(
        f"/api/v1/clinical-support/{patient_id}/draft",
        json={"draft_notes": draft_notes},
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert draft_res.status_code == 200
    plan_info = draft_res.get_json()["plan"]
    assert plan_info["is_approved"] is False
    assert plan_info["draft_notes"] == draft_notes
    assert plan_info["updated_by"] == "Doctor Support"

    # 7. Get clinical support as doctor -> plan should be populated
    get_res2 = client.get(
        f"/api/v1/clinical-support/{patient_id}",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert get_res2.status_code == 200
    plan_info2 = get_res2.get_json()["plan"]
    assert plan_info2["is_approved"] is False
    assert plan_info2["draft_notes"] == draft_notes
    assert plan_info2["updated_by"] == "Doctor Support"

    # 8. Try to approve as researcher -> Should be forbidden
    approve_res_researcher = client.post(
        f"/api/v1/clinical-support/{patient_id}/approve",
        headers={"Authorization": f"Bearer {researcher_token}"},
    )
    assert approve_res_researcher.status_code == 403

    # 9. Approve as doctor -> Should succeed
    approve_res = client.post(
        f"/api/v1/clinical-support/{patient_id}/approve",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert approve_res.status_code == 200
    plan_info3 = approve_res.get_json()["plan"]
    assert plan_info3["is_approved"] is True
    assert plan_info3["approved_by"] == "Doctor Support"
    assert plan_info3["approved_at"] is not None

    # 10. Verify persisted plan in Database
    with app.app_context():
        persisted = ClinicalSupportPlan.query.filter_by(patient_id=patient_id).first()
        assert persisted is not None
        assert persisted.is_approved is True
        assert persisted.draft_notes == draft_notes


def test_clinical_support_doctor_assignment_check(client, app):
    # 1. Register Doc A and Doc B and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor A",
        "email": "doca@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    doca_token = client.post(
        "/api/v1/auth/login",
        json={"email": "doca@example.com", "password": "StrongPass123!"},
    ).get_json()["access_token"]

    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor B",
        "email": "docb@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    docb_token = client.post(
        "/api/v1/auth/login",
        json={"email": "docb@example.com", "password": "StrongPass123!"},
    ).get_json()["access_token"]

    # 2. Doc A creates patient -> assigned to Doc A automatically
    create_pat_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "DOC-ASSIGN-01",
            "full_name": "Assigned Patient",
            "age_at_admission": 35,
            "gender": "male",
            "admission_type": "elective",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 3,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 5,
            "risk_band": "low",
            "readmission_probability": 10.0,
        },
        headers={"Authorization": f"Bearer {doca_token}"},
    )
    patient_id = create_pat_res.get_json()["patient"]["id"]

    # 3. Doc B tries to save draft for Doc A's patient -> 403 Forbidden
    draft_res = client.post(
        f"/api/v1/clinical-support/{patient_id}/draft",
        json={"draft_notes": "Attempting cross-doctor draft edit"},
        headers={"Authorization": f"Bearer {docb_token}"},
    )
    assert draft_res.status_code == 403

    # 4. Doc B tries to approve plan for Doc A's patient -> 403 Forbidden
    approve_res = client.post(
        f"/api/v1/clinical-support/{patient_id}/approve",
        headers={"Authorization": f"Bearer {docb_token}"},
    )
    assert approve_res.status_code == 403


def test_treatment_lifecycle_and_validation(client, app):
    # 1. Register a doctor and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor Lifecycle",
        "email": "doc_life@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Endocrinology",
    })
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "doc_life@example.com", "password": "StrongPass123!"},
    )
    doc_token = login_res.get_json()["access_token"]

    # 2. Create patient
    create_pat_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "LIFE-001",
            "full_name": "Lifecycle Patient",
            "age_at_admission": 45,
            "gender": "female",
            "admission_type": "elective",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 4,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 8,
            "risk_band": "moderate",
            "readmission_probability": 25.0,
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert create_pat_res.status_code == 201
    patient_id = create_pat_res.get_json()["patient"]["id"]

    # 3. Save draft to generate treatment_name
    client.post(
        f"/api/v1/clinical-support/{patient_id}/draft",
        json={"draft_notes": "First draft notes"},
        headers={"Authorization": f"Bearer {doc_token}"},
    )

    # 4. Approve once -> Creates 1 TreatmentEffectiveness record
    approve_res1 = client.post(
        f"/api/v1/clinical-support/{patient_id}/approve",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert approve_res1.status_code == 200
    treatment1 = approve_res1.get_json()["treatment"]
    assert treatment1["status"] == "active"
    treatment_id = treatment1["id"]

    # 5. Approve again -> Returns the same active treatment without creating duplicate
    approve_res2 = client.post(
        f"/api/v1/clinical-support/{patient_id}/approve",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert approve_res2.status_code == 200
    treatment2 = approve_res2.get_json()["treatment"]
    assert treatment2["id"] == treatment_id

    # 6. Verify only 1 active treatment in db
    with app.app_context():
        from app.models import TreatmentEffectiveness
        records = TreatmentEffectiveness.query.filter_by(patient_id=patient_id).all()
        assert len(records) == 1

    # 7. Try to complete treatment without required fields -> Should fail
    update_fail1 = client.patch(
        f"/api/v1/treatments/{treatment_id}",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert update_fail1.status_code == 400

    # 8. Try to complete with invalid end_date (before start_date) -> Should fail
    update_fail2 = client.patch(
        f"/api/v1/treatments/{treatment_id}",
        json={
            "status": "completed",
            "end_date": "2020-01-01",
            "outcome_score": 85.0,
            "effectiveness_level": "good"
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert update_fail2.status_code == 400

    # 9. Complete successfully -> Should succeed
    from datetime import datetime
    update_success = client.patch(
        f"/api/v1/treatments/{treatment_id}",
        json={
            "status": "completed",
            "end_date": datetime.now().strftime("%Y-%m-%d"),
            "outcome_score": 90.0,
            "effectiveness_level": "good"
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert update_success.status_code == 200
    assert update_success.get_json()["treatment"]["status"] == "completed"

    # 10. Try to change back to active -> Should be forbidden (400)
    revert_fail = client.patch(
        f"/api/v1/treatments/{treatment_id}",
        json={"status": "active"},
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert revert_fail.status_code == 400
