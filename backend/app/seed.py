"""
Seeds the database with one user per role (for demo/login purposes) and a
few sample patients with risk assessments already computed.

Run with:  python -m app.seed
"""
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.db_models import User, Patient, RiskAssessment
from app.ml.predictor import ReadmissionPredictor

DEMO_USERS = [
    dict(username="admin", email="admin@healthforecast.ai", full_name="Ava System",
         role="system_admin", department="IT", password="Admin@123"),
    dict(username="dr.patel", email="dr.patel@healthforecast.ai", full_name="Dr. Meera Patel",
         role="doctor", department="Internal Medicine", password="Doctor@123"),
    dict(username="dr.james", email="dr.james@healthforecast.ai", full_name="Dr. Leo James",
         role="doctor", department="Cardiology", password="Doctor@123"),
    dict(username="hospitaladmin", email="admin.ops@healthforecast.ai", full_name="Rosa Fernandes",
         role="hospital_administrator", department="Hospital Operations", password="Admin@123"),
    dict(username="researcher", email="researcher@healthforecast.ai", full_name="Dr. Kenji Sato",
         role="healthcare_researcher", department="Clinical Research", password="Research@123"),
]

SAMPLE_PATIENTS = [
    dict(
        mrn="MRN-100234", full_name="John Whitfield", race="Caucasian", gender="Male",
        age_bracket="[70-80)", doctor_username="dr.patel",
        features=dict(
            race="Caucasian", gender="Male", age="[70-80)", admission_type_id=1,
            discharge_disposition_id=1, admission_source_id=7, time_in_hospital=6,
            num_lab_procedures=55, num_procedures=2, num_medications=18,
            number_outpatient=0, number_emergency=2, number_inpatient=3,
            diag_1="428", diag_2="250", diag_3="401", number_diagnoses=9,
            max_glu_serum="nan", A1Cresult=">8", metformin="Steady", repaglinide="No",
            nateglinide="No", chlorpropamide="No", glimepiride="No", acetohexamide="No",
            glipizide="No", glyburide="No", tolbutamide="No", pioglitazone="No",
            rosiglitazone="No", acarbose="No", miglitol="No", troglitazone="No",
            tolazamide="No", examide="No", citoglipton="No", insulin="Up",
            **{"glyburide-metformin": "No", "glipizide-metformin": "No",
               "glimepiride-pioglitazone": "No", "metformin-rosiglitazone": "No",
               "metformin-pioglitazone": "No"},
            change="Ch", diabetesMed="Yes",
        ),
    ),
    dict(
        mrn="MRN-100235", full_name="Amara Okafor", race="AfricanAmerican", gender="Female",
        age_bracket="[50-60)", doctor_username="dr.patel",
        features=dict(
            race="AfricanAmerican", gender="Female", age="[50-60)", admission_type_id=2,
            discharge_disposition_id=1, admission_source_id=1, time_in_hospital=2,
            num_lab_procedures=30, num_procedures=0, num_medications=9,
            number_outpatient=1, number_emergency=0, number_inpatient=0,
            diag_1="250", diag_2="nan", diag_3="nan", number_diagnoses=4,
            max_glu_serum="Norm", A1Cresult="Norm", metformin="Steady", repaglinide="No",
            nateglinide="No", chlorpropamide="No", glimepiride="No", acetohexamide="No",
            glipizide="No", glyburide="No", tolbutamide="No", pioglitazone="No",
            rosiglitazone="No", acarbose="No", miglitol="No", troglitazone="No",
            tolazamide="No", examide="No", citoglipton="No", insulin="No",
            **{"glyburide-metformin": "No", "glipizide-metformin": "No",
               "glimepiride-pioglitazone": "No", "metformin-rosiglitazone": "No",
               "metformin-pioglitazone": "No"},
            change="No", diabetesMed="Yes",
        ),
    ),
    dict(
        mrn="MRN-100236", full_name="Ethan Brooks", race="Caucasian", gender="Male",
        age_bracket="[80-90)", doctor_username="dr.james",
        features=dict(
            race="Caucasian", gender="Male", age="[80-90)", admission_type_id=1,
            discharge_disposition_id=3, admission_source_id=7, time_in_hospital=10,
            num_lab_procedures=70, num_procedures=3, num_medications=24,
            number_outpatient=0, number_emergency=3, number_inpatient=4,
            diag_1="410", diag_2="428", diag_3="276", number_diagnoses=9,
            max_glu_serum=">200", A1Cresult=">7", metformin="No", repaglinide="No",
            nateglinide="No", chlorpropamide="No", glimepiride="Steady", acetohexamide="No",
            glipizide="No", glyburide="No", tolbutamide="No", pioglitazone="No",
            rosiglitazone="No", acarbose="No", miglitol="No", troglitazone="No",
            tolazamide="No", examide="No", citoglipton="No", insulin="Up",
            **{"glyburide-metformin": "No", "glipizide-metformin": "No",
               "glimepiride-pioglitazone": "No", "metformin-rosiglitazone": "No",
               "metformin-pioglitazone": "No"},
            change="Ch", diabetesMed="Yes",
        ),
    ),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    predictor = ReadmissionPredictor.get()

    try:
        users_by_username = {}
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                users_by_username[u["username"]] = existing
                continue
            user = User(
                username=u["username"], email=u["email"], full_name=u["full_name"],
                role=u["role"], department=u["department"],
                hashed_password=hash_password(u["password"]),
            )
            db.add(user)
            db.flush()
            users_by_username[u["username"]] = user
            print(f"Created user {u['username']} ({u['role']}) / password: {u['password']}")

        for p in SAMPLE_PATIENTS:
            if db.query(Patient).filter(Patient.mrn == p["mrn"]).first():
                continue
            doctor = users_by_username[p["doctor_username"]]
            patient = Patient(
                mrn=p["mrn"], full_name=p["full_name"], race=p["race"], gender=p["gender"],
                age_bracket=p["age_bracket"], attending_doctor_id=doctor.id,
                clinical_features=p["features"],
            )
            db.add(patient)
            db.flush()

            result = predictor.predict(p["features"])
            db.add(RiskAssessment(
                patient_id=patient.id,
                readmission_probability=result["readmission_probability"],
                risk_category=result["risk_category"],
                input_snapshot=p["features"],
                recommendations=result["recommendations"],
                created_by_id=doctor.id,
            ))
            print(f"Seeded patient {p['mrn']} -> risk={result['risk_category']} "
                  f"({result['readmission_probability']})")

        db.commit()
        print("\nSeed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
