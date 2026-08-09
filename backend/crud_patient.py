from sqlalchemy.orm import Session

from models import Patient

from schemas import PatientCreate


def get_all_patients(db: Session):

    return db.query(Patient).all()


def get_patient_by_id(db: Session, patient_id: int):

    return (

        db.query(Patient)

        .filter(Patient.patient_id == patient_id)

        .first()

    )


def create_patient(

    db: Session,

    patient: PatientCreate,

    user_id: int

):

    new_patient = Patient(

        patient_name=patient.patient_name,

        age=patient.age,

        gender=patient.gender,

        race=patient.race,

        admission_type=patient.admission_type,

        discharge_disposition=patient.discharge_disposition,

        admission_source=patient.admission_source,

        created_by=user_id

    )

    db.add(new_patient)

    db.commit()

    db.refresh(new_patient)

    return new_patient


def update_patient(

    db: Session,

    patient_id: int,

    patient_data: dict

):

    patient = get_patient_by_id(

        db,

        patient_id

    )

    if not patient:

        return None

    for key, value in patient_data.items():

        setattr(

            patient,

            key,

            value

        )

    db.commit()

    db.refresh(patient)

    return patient


def delete_patient(

    db: Session,

    patient_id: int

):

    patient = get_patient_by_id(

        db,

        patient_id

    )

    if not patient:

        return False

    db.delete(patient)

    db.commit()

    return True