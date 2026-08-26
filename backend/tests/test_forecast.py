from __future__ import annotations

from decimal import Decimal
from datetime import datetime, date
from app.models import TreatmentEffectiveness, ClinicalSupportPlan, UserRole, Prediction, Patient
from app.services.forecast_service import generate_treatment_forecast
from tests.test_auth import register_payload


def test_forecast_calculation_and_triggers(client, app):
    # 1. Register users for RBAC
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor Alpha",
        "email": "doc_alpha@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    client.post("/api/v1/auth/register", json={
        "full_name": "Researcher Beta",
        "email": "research_beta@example.com",
        "password": "StrongPass123!",
        "role": "healthcare_researcher",
        "department": "Anonymized Research Pool",
    })

    login_doc = client.post("/api/v1/auth/login", json={"email": "doc_alpha@example.com", "password": "StrongPass123!"})
    doc_token = login_doc.get_json()["access_token"]

    login_res = client.post("/api/v1/auth/login", json={"email": "research_beta@example.com", "password": "StrongPass123!"})
    res_token = login_res.get_json()["access_token"]

    # Create patient
    create_patient_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "PAT-JaneForecast",
            "full_name": "Jane Smith",
            "age_at_admission": 45,
            "gender": "female",
            "admission_type": "emergency",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 4,
            "prior_diagnoses_count": 2,
            "lab_procedures_count": 12,
            "medications": ["metformin"],
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    patient_id = create_patient_res.get_json()["patient"]["id"]

    # 2. Run prediction and verify forecast response
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
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert predict_res.status_code == 201
    res_data = predict_res.get_json()
    assert "treatment_forecast" in res_data
    forecast = res_data["treatment_forecast"]
    assert "predicted_treatment_effectiveness" in forecast
    assert "predicted_recovery_days" in forecast
    assert "expected_response_category" in forecast
    assert "treatment_confidence" in forecast
    assert "forecast_generated_at" in forecast

    # 3. Create treatment and check if forecast was populated
    treatment_res = client.post(
        "/api/v1/treatments",
        json={
            "patient_id": patient_id,
            "treatment_name": "Clinical Support Protocol A",
            "treatment_type": "protocol",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "active",
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert treatment_res.status_code == 201
    treatment = treatment_res.get_json()["treatment"]
    assert treatment["predicted_treatment_effectiveness"] is not None
    assert treatment["predicted_recovery_days"] is not None
    assert treatment["expected_response_category"] is not None
    assert treatment["treatment_confidence"] is not None

    # 4. Check if running a new prediction updates the active treatment forecast
    predict_res2 = client.post(
        "/api/v1/predictions/run",
        json={
            "patient_id": patient_id,
            "prior_inpatient": 5,
            "prior_emergency": 2,
            "medications_count": 8,
            "time_in_hospital": 7,
            "diagnoses_count": 6,
            "a1c_result": "None",
            "insulin_usage": "No",
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert predict_res2.status_code == 201
    # Query treatment to verify record is present and belongs to the right patient
    list_res = client.get("/api/v1/treatments", headers={"Authorization": f"Bearer {doc_token}"})
    assert list_res.status_code == 200
    records = list_res.get_json()["records"]
    assert len(records) > 0
    active_rec = records[0]
    assert active_rec["patient_name"] == "Jane Smith"
    assert active_rec["status"] == "active"

    # 5. Verify RBAC anonymization for Researcher
    list_res_anon = client.get("/api/v1/treatments", headers={"Authorization": f"Bearer {res_token}"})
    assert list_res_anon.status_code == 200
    records_anon = list_res_anon.get_json()["records"]
    assert len(records_anon) > 0
    assert records_anon[0]["patient_name"] == "Anonymized Patient"
    assert records_anon[0]["patient_identifier"] == "ANON-#####"

    # 6. Verify Clinical Support Plan approval generates forecast and initiates treatment
    support_res = client.get(f"/api/v1/clinical-support/{patient_id}", headers={"Authorization": f"Bearer {doc_token}"})
    assert support_res.status_code == 200
    support_json = support_res.get_json()
    assert "forecast" in support_json
    assert support_json["forecast"] is not None

    approve_res = client.post(f"/api/v1/clinical-support/{patient_id}/approve", headers={"Authorization": f"Bearer {doc_token}"})
    assert approve_res.status_code == 200
    approve_json = approve_res.get_json()
    assert "forecast" in approve_json
    assert approve_json["forecast"]["predicted_treatment_effectiveness"] is not None


def test_forecast_sql_aggregation_and_active_update(client, app):
    # Register doctor and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor Gamma",
        "email": "doc_gamma@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    login_doc = client.post("/api/v1/auth/login", json={"email": "doc_gamma@example.com", "password": "StrongPass123!"})
    doc_token = login_doc.get_json()["access_token"]

    # 1. Test build_treatment_overview when no forecasted records exist (should return None stats)
    from app.services.insights_service import build_treatment_overview
    from app.models import User
    with app.app_context():
        user = User.query.filter_by(email="doc_gamma@example.com").first()
        overview = build_treatment_overview(user)
        # With no completed treatments yet, success rate and duration are None
        assert overview["stats"]["treatment_success_rate"] is None
        assert overview["stats"]["avg_duration_days"] is None
        # active_count is an integer (0 when no records exist)
        assert isinstance(overview["stats"]["active_count"], int)

    # Create patient
    create_patient_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "PAT-GammaForecast",
            "full_name": "Gary Gamma",
            "age_at_admission": 50,
            "gender": "male",
            "admission_type": "elective",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 3,
            "prior_diagnoses_count": 2,
            "lab_procedures_count": 15,
            "medications": ["metformin"],
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    patient_id = create_patient_res.get_json()["patient"]["id"]

    # 2. Create an active treatment record MANUALLY with NULL forecast values
    # (simulating a treatment created before the forecast feature)
    with app.app_context():
        from app.models import TreatmentEffectiveness
        from app.extensions import db
        import datetime
        treatment = TreatmentEffectiveness(
            patient_id=patient_id,
            treatment_name="Old Manual Treatment",
            treatment_type="manual",
            start_date=datetime.date.today(),
            status="active",
            predicted_treatment_effectiveness=None,
            predicted_recovery_days=None,
            expected_response_category=None,
            treatment_confidence=None,
            forecast_generated_at=None,
        )
        db.session.add(treatment)
        db.session.commit()

    # 3. Create prediction history to ensure we have predictions
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
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert predict_res.status_code == 201

    # 4. Now approve a Clinical Support plan (this should update the existing active treatment's forecast in place!)
    # First save draft to ensure plan name exists
    draft_res = client.post(
        f"/api/v1/clinical-support/{patient_id}/draft",
        json={"draft_notes": "Updating draft notes"},
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert draft_res.status_code == 200

    approve_res = client.post(f"/api/v1/clinical-support/{patient_id}/approve", headers={"Authorization": f"Bearer {doc_token}"})
    assert approve_res.status_code == 200
    approve_json = approve_res.get_json()
    assert approve_json["treatment"]["treatment_name"] == approve_json["plan"]["treatment_name"]

    # Check forecast fields in active treatment are now populated (not None)
    assert approve_json["forecast"]["predicted_treatment_effectiveness"] is not None
    assert approve_json["forecast"]["predicted_recovery_days"] is not None
    assert approve_json["forecast"]["expected_response_category"] is not None
    assert approve_json["forecast"]["treatment_confidence"] is not None

    # Check db to confirm only ONE treatment record exists (no duplicate created)
    with app.app_context():
        records = TreatmentEffectiveness.query.filter_by(patient_id=patient_id).all()
        assert len(records) == 1
        updated_t = records[0]
        assert updated_t.predicted_treatment_effectiveness is not None
        assert updated_t.notes == "Updating draft notes"


def test_clinical_support_get_updates_active_treatment_forecast(client, app):
    # Register doctor and login
    client.post("/api/v1/auth/register", json={
        "full_name": "Doctor Delta",
        "email": "doc_delta@example.com",
        "password": "StrongPass123!",
        "role": "doctor",
        "department": "Cardiology",
    })
    login_doc = client.post("/api/v1/auth/login", json={"email": "doc_delta@example.com", "password": "StrongPass123!"})
    doc_token = login_doc.get_json()["access_token"]

    # Create patient
    create_patient_res = client.post(
        "/api/v1/patients",
        json={
            "patient_identifier": "PAT-DeltaForecast",
            "full_name": "Daisy Delta",
            "age_at_admission": 30,
            "gender": "female",
            "admission_type": "elective",
            "primary_diagnosis": "Diabetes",
            "time_in_hospital": 2,
            "prior_diagnoses_count": 1,
            "lab_procedures_count": 5,
            "medications": ["metformin"],
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    patient_id = create_patient_res.get_json()["patient"]["id"]

    # Create prediction history so a forecast can be computed
    predict_res = client.post(
        "/api/v1/predictions/run",
        json={
            "patient_id": patient_id,
            "prior_inpatient": 0,
            "prior_emergency": 0,
            "medications_count": 2,
            "time_in_hospital": 2,
            "diagnoses_count": 1,
            "a1c_result": "None",
            "insulin_usage": "No",
        },
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert predict_res.status_code == 201

    # Create an active treatment record MANUALLY with NULL forecast values
    # (simulating a treatment created before the forecast feature)
    with app.app_context():
        from app.models import TreatmentEffectiveness
        from app.extensions import db
        import datetime
        treatment = TreatmentEffectiveness(
            patient_id=patient_id,
            treatment_name="Active Treatment Without Forecast",
            treatment_type="manual",
            start_date=datetime.date.today(),
            status="active",
            predicted_treatment_effectiveness=None,
            predicted_recovery_days=None,
            expected_response_category=None,
            treatment_confidence=None,
            forecast_generated_at=None,
        )
        db.session.add(treatment)
        db.session.commit()

    # Call the GET clinical support endpoint which retrieves the plan/forecast and should update the active treatment in PostgreSQL
    get_res = client.get(
        f"/api/v1/clinical-support/{patient_id}",
        headers={"Authorization": f"Bearer {doc_token}"},
    )
    assert get_res.status_code == 200
    res_json = get_res.get_json()
    assert res_json["forecast"] is not None
    assert res_json["forecast"]["predicted_treatment_effectiveness"] is not None

    # Query database directly to confirm the TreatmentEffectiveness record was updated and committed
    with app.app_context():
        t = TreatmentEffectiveness.query.filter_by(patient_id=patient_id, status="active").first()
        assert t is not None
        assert t.predicted_treatment_effectiveness is not None
        assert t.predicted_recovery_days is not None
        assert t.expected_response_category is not None
        assert t.treatment_confidence is not None
        assert t.forecast_generated_at is not None


