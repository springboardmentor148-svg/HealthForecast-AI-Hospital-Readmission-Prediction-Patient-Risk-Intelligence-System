"""Idempotent database seeding and dataset import for the local demo."""
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sqlalchemy import func, insert

from .config import settings
from .database import Base, SessionLocal, engine
from .models import DoctorPatientAssignment, Encounter, ModelVersion, Patient, User
from .security import hash_password

DEMO_USERS = [
    ("doctor@healthforecast.local", "Dr. Ananya Rao", "Doctor"),
    ("admin@healthforecast.local", "Meera Shah", "Hospital Administrator"),
    ("researcher@healthforecast.local", "Arjun Mehta", "Healthcare Researcher"),
    ("system@healthforecast.local", "System Admin", "System Administrator"),
]


def clean_value(value):
    if pd.isna(value) or value in {"?", "None"}:
        return None
    if isinstance(value, np.generic):
        return value.item()
    return value


def seed_users(db):
    for email, name, role in DEMO_USERS:
        if not db.query(User).filter_by(email=email).first():
            db.add(User(email=email, name=name, role=role, password_hash=hash_password("Demo123!")))
    db.commit()


def import_dataset(db):
    if db.query(Encounter).first():
        return
    path = Path(settings.data_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}. Place diabetic_data.csv in data/.")
    df = pd.read_csv(path, dtype=str).replace({"?": None, "None": None})
    patients = df[["patient_nbr", "race", "gender", "age"]].drop_duplicates("patient_nbr")
    db.execute(
        insert(Patient),
        [
            {"patient_nbr": row.patient_nbr, "race": clean_value(row.race), "gender": clean_value(row.gender), "age": clean_value(row.age)}
            for row in patients.itertuples(index=False)
        ],
    )
    db.commit()
    patient_ids = dict(db.query(Patient.patient_nbr, Patient.id).all())
    records = []
    for row in df.to_dict(orient="records"):
        payload = {key: clean_value(value) for key, value in row.items()}
        records.append(
            {
                "encounter_id": row["encounter_id"],
                "patient_id": patient_ids[row["patient_nbr"]],
                "readmitted": row["readmitted"],
                "time_in_hospital": int(row["time_in_hospital"] or 0),
                "age": clean_value(row["age"]),
                "race": clean_value(row["race"]),
                "gender": clean_value(row["gender"]),
                "admission_type_id": clean_value(row["admission_type_id"]),
                "medical_specialty": clean_value(row["medical_specialty"]),
                "a1c_result": clean_value(row["A1Cresult"]),
                "medication_change": clean_value(row["change"]),
                "diabetes_med": clean_value(row["diabetesMed"]),
                "insulin": clean_value(row["insulin"]),
                "number_inpatient": int(row["number_inpatient"] or 0),
                "number_emergency": int(row["number_emergency"] or 0),
                "num_medications": int(row["num_medications"] or 0),
                "payload": payload,
            }
        )
    for index in range(0, len(records), 5000):
        db.execute(insert(Encounter), records[index : index + 5000])
        db.commit()

    doctor = db.query(User).filter_by(role="Doctor").first()
    patient_ids_for_demo = [patient_id for (patient_id,) in db.query(Patient.id).order_by(Patient.id).limit(30)]
    db.execute(insert(DoctorPatientAssignment), [{"doctor_id": doctor.id, "patient_id": patient_id} for patient_id in patient_ids_for_demo])
    db.commit()


def seed_model_record(db):
    if not db.query(ModelVersion).first():
        artifact_path = Path(settings.model_path)
        if artifact_path.exists():
            artifact = joblib.load(artifact_path)
            db.add(ModelVersion(name=artifact["model_name"], metrics=artifact["metrics"], is_active=True))
        else:
            db.add(ModelVersion(name="Readmission baseline", metrics={"status": "Run python -m app.train_model to train the model."}, is_active=True))
        db.commit()


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_users(db)
        import_dataset(db)
        seed_model_record(db)
        print(f"HealthForecast ready: {db.query(func.count(Encounter.id)).scalar()} encounters")


if __name__ == "__main__":
    main()
