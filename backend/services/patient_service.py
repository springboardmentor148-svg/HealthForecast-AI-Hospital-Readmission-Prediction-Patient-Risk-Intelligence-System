"""Business logic for patient CRUD, search, filtering and pagination."""
import uuid

from sqlalchemy.orm import Session

from core.exceptions import NotFoundException
from models.audit import AuditLog
from models.patient import Patient
from repositories.audit_repository import AuditRepository
from repositories.patient_repository import PatientRepository
from schemas.patient import PatientCreate, PatientFilterParams, PatientUpdate
from utils.constants import AuditAction


class PatientService:
    def __init__(self, db: Session):
        self.db = db
        self.patients = PatientRepository(db)
        self.audits = AuditRepository(db)

    def _log(self, user_id, action: str, endpoint: str, ip: str, details: str = None):
        self.audits.create(
            AuditLog(user_id=user_id, action=action, endpoint=endpoint, ip_address=ip,
                      status="success", details=details)
        )

    def create_patient(self, payload: PatientCreate, current_user, ip: str, endpoint: str) -> Patient:
        patient = Patient(id=uuid.uuid4(), **payload.model_dump())
        patient = self.patients.create(patient)
        self._log(current_user.id, AuditAction.CREATE_PATIENT, endpoint, ip, str(patient.id))
        return patient

    def get_patient(self, patient_id: uuid.UUID, current_user, ip: str, endpoint: str) -> Patient:
        patient = self.patients.get_by_id(patient_id)
        if not patient:
            raise NotFoundException("Patient not found")
        self._log(current_user.id, AuditAction.VIEW_PATIENT, endpoint, ip, str(patient.id))
        return patient

    def update_patient(self, patient_id: uuid.UUID, payload: PatientUpdate, current_user,
                        ip: str, endpoint: str) -> Patient:
        patient = self.patients.get_by_id(patient_id)
        if not patient:
            raise NotFoundException("Patient not found")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(patient, field, value)

        patient = self.patients.update(patient)
        self._log(current_user.id, AuditAction.UPDATE_PATIENT, endpoint, ip, str(patient.id))
        return patient

    def delete_patient(self, patient_id: uuid.UUID, current_user, ip: str, endpoint: str) -> None:
        patient = self.patients.get_by_id(patient_id)
        if not patient:
            raise NotFoundException("Patient not found")
        self.patients.delete(patient)
        self._log(current_user.id, AuditAction.DELETE_PATIENT, endpoint, ip, str(patient_id))

    def list_patients(self, filters: PatientFilterParams) -> tuple[list[Patient], int]:
        return self.patients.list_patients(filters)
