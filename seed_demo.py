from database import SessionLocal
import models
from auth import hash_password


db = SessionLocal()

try:

    # =========================================================
    # DEMO USERS
    # =========================================================

    demo_users = [
        {
            "email": "doctor@healthforecastai.com",
            "password": "doctor123",
            "full_name": "Dr. Demo User",
            "role": "doctor"
        },
        {
            "email": "hospitaladmin@healthforecastai.com",
            "password": "admin123",
            "full_name": "Hospital Demo Admin",
            "role": "hospital_admin"
        },
        {
            "email": "researcher@healthforecastai.com",
            "password": "researcher123",
            "full_name": "Demo Researcher",
            "role": "researcher"
        }
    ]

    for user_data in demo_users:

        existing = db.query(models.User).filter(
            models.User.email == user_data["email"]
        ).first()

        if not existing:

            user = models.User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"]
            )

            db.add(user)

    db.commit()


    # =========================================================
    # DEMO PATIENTS
    # =========================================================

    patients = [

        {
            "patient_name": "Demo Patient 01",
            "race": "Caucasian",
            "gender": "Female",
            "age": "50-60",
            "time_in_hospital": 3,
            "num_medications": 8,
            "insulin": "No",
            "change": 0,
            "readmission_probability": "12.5%",
            "risk_category": "Low"
        },

        {
            "patient_name": "Demo Patient 02",
            "race": "AfricanAmerican",
            "gender": "Male",
            "age": "60-70",
            "time_in_hospital": 5,
            "num_medications": 12,
            "insulin": "Yes",
            "change": 1,
            "readmission_probability": "28.4%",
            "risk_category": "Medium"
        },

        {
            "patient_name": "Demo Patient 03",
            "race": "Caucasian",
            "gender": "Male",
            "age": "70-80",
            "time_in_hospital": 7,
            "num_medications": 15,
            "insulin": "Yes",
            "change": 1,
            "readmission_probability": "72.6%",
            "risk_category": "High"
        },

        {
            "patient_name": "Demo Patient 04",
            "race": "Asian",
            "gender": "Female",
            "age": "40-50",
            "time_in_hospital": 2,
            "num_medications": 6,
            "insulin": "No",
            "change": 0,
            "readmission_probability": "8.7%",
            "risk_category": "Low"
        },

        {
            "patient_name": "Demo Patient 05",
            "race": "Caucasian",
            "gender": "Male",
            "age": "60-70",
            "time_in_hospital": 6,
            "num_medications": 13,
            "insulin": "Yes",
            "change": 1,
            "readmission_probability": "45.3%",
            "risk_category": "Medium"
        },

        {
            "patient_name": "Demo Patient 06",
            "race": "AfricanAmerican",
            "gender": "Female",
            "age": "70-80",
            "time_in_hospital": 9,
            "num_medications": 18,
            "insulin": "Yes",
            "change": 1,
            "readmission_probability": "81.2%",
            "risk_category": "High"
        },

        {
            "patient_name": "Demo Patient 07",
            "race": "Caucasian",
            "gender": "Female",
            "age": "30-40",
            "time_in_hospital": 2,
            "num_medications": 5,
            "insulin": "No",
            "change": 0,
            "readmission_probability": "6.4%",
            "risk_category": "Low"
        },

        {
            "patient_name": "Demo Patient 08",
            "race": "Asian",
            "gender": "Male",
            "age": "50-60",
            "time_in_hospital": 4,
            "num_medications": 10,
            "insulin": "No",
            "change": 1,
            "readmission_probability": "34.8%",
            "risk_category": "Medium"
        },

        {
            "patient_name": "Demo Patient 09",
            "race": "AfricanAmerican",
            "gender": "Male",
            "age": "80-90",
            "time_in_hospital": 10,
            "num_medications": 20,
            "insulin": "Yes",
            "change": 1,
            "readmission_probability": "89.5%",
            "risk_category": "High"
        },

        {
            "patient_name": "Demo Patient 10",
            "race": "Caucasian",
            "gender": "Female",
            "age": "50-60",
            "time_in_hospital": 3,
            "num_medications": 7,
            "insulin": "No",
            "change": 0,
            "readmission_probability": "15.2%",
            "risk_category": "Low"
        }

    ]


    # Get an account to mark who added the demo patients
    demo_admin = db.query(models.User).filter(
        models.User.role == "system_admin"
    ).first()

    admitted_by = (
        demo_admin.email
        if demo_admin
        else "admin1@hospital.com"
    )


    for patient_data in patients:

        existing_patient = db.query(
            models.PatientAdmission
        ).filter(
            models.PatientAdmission.patient_name
            == patient_data["patient_name"]
        ).first()

        if not existing_patient:

            patient = models.PatientAdmission(
                patient_name=patient_data["patient_name"],
                admitted_by=admitted_by,
                race=patient_data["race"],
                gender=patient_data["gender"],
                age=patient_data["age"],
                time_in_hospital=patient_data["time_in_hospital"],
                num_medications=patient_data["num_medications"],
                insulin=patient_data["insulin"],
                change=patient_data["change"],
                readmission_probability=patient_data[
                    "readmission_probability"
                ],
                risk_category=patient_data["risk_category"]
            )

            db.add(patient)

    db.commit()


    print()
    print("========================================")
    print("      DEMO DATA CREATED SUCCESSFULLY")
    print("========================================")
    print()

    print("DEMO USERS")
    print("----------------------------------------")
    print("Doctor:")
    print("  Email: doctor@healthforecastai.com")
    print("  Password: doctor123")
    print()

    print("Hospital Admin:")
    print("  Email: hospitaladmin@healthforecastai.com")
    print("  Password: admin123")
    print()

    print("Researcher:")
    print("  Email: researcher@healthforecastai.com")
    print("  Password: researcher123")
    print()

    print("System Admin:")
    print("  Use your existing admin account")
    print()

    print("10 fake patients added.")
    print()
    print("Risk distribution:")
    print("  Low:    4")
    print("  Medium: 3")
    print("  High:   3")
    print()

except Exception as e:

    db.rollback()
    print("ERROR:", e)

finally:

    db.close()