"""Patient CRUD, search, filter, and pagination endpoints."""
import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import RequireRoles, get_current_user
from models.user import User
from schemas.patient import (
    PatientCreate,
    PatientFilterParams,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)
from services.patient_service import PatientService
from utils.constants import PATIENT_WRITE_ROLES
from utils.helpers import get_client_ip

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=201,
             dependencies=[Depends(RequireRoles(*PATIENT_WRITE_ROLES))])
def create_patient(
    payload: PatientCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new patient record."""
    service = PatientService(db)
    return service.create_patient(payload, current_user, get_client_ip(request), str(request.url.path))


@router.get("", response_model=PatientListResponse)
def list_patients(
    filters: PatientFilterParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List patients with search, filtering, sorting, and pagination."""
    service = PatientService(db)
    items, total = service.list_patients(filters)
    return PatientListResponse(total=total, page=filters.page, page_size=filters.page_size, items=items)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single patient by ID."""
    service = PatientService(db)
    return service.get_patient(patient_id, current_user, get_client_ip(request), str(request.url.path))


@router.put("/{patient_id}", response_model=PatientResponse,
            dependencies=[Depends(RequireRoles(*PATIENT_WRITE_ROLES))])
def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing patient's fields."""
    service = PatientService(db)
    return service.update_patient(patient_id, payload, current_user, get_client_ip(request), str(request.url.path))


@router.delete("/{patient_id}", status_code=204,
               dependencies=[Depends(RequireRoles(*PATIENT_WRITE_ROLES))])
def delete_patient(
    patient_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a patient record."""
    service = PatientService(db)
    service.delete_patient(patient_id, current_user, get_client_ip(request), str(request.url.path))
