"""Data-access layer for the Patient entity."""
import uuid
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.patient import Patient
from schemas.patient import PatientFilterParams


class PatientRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, patient_id: uuid.UUID) -> Optional[Patient]:
        return self.db.get(Patient, patient_id)

    def create(self, patient: Patient) -> Patient:
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def update(self, patient: Patient) -> Patient:
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def delete(self, patient: Patient) -> None:
        self.db.delete(patient)
        self.db.commit()

    def list_patients(self, filters: PatientFilterParams) -> tuple[list[Patient], int]:
        query = self.db.query(Patient)

        if filters.search:
            like = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Patient.patient_name.ilike(like),
                    Patient.attending_doctor.ilike(like),
                )
            )
        if filters.gender:
            query = query.filter(Patient.gender == filters.gender)
        if filters.min_age is not None:
            query = query.filter(Patient.age >= filters.min_age)
        if filters.max_age is not None:
            query = query.filter(Patient.age <= filters.max_age)
        if filters.admission_type:
            query = query.filter(Patient.admission_type == filters.admission_type)
        if filters.attending_doctor:
            query = query.filter(Patient.attending_doctor == filters.attending_doctor)

        total = query.count()

        sort_column = getattr(Patient, filters.sort_by, Patient.created_at)
        if filters.sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        items = (
            query.offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
            .all()
        )
        return items, total

    def count_all(self) -> int:
        return self.db.query(Patient).count()

    def age_distribution(self) -> list[tuple[int, int]]:
        """Returns raw (age, count) pairs; bucketing is done in the service layer."""
        rows = self.db.query(Patient.age).all()
        return [(r[0], 1) for r in rows]
