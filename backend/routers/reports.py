"""Report generation and management endpoints (PDF / CSV / Excel)."""
import os
import uuid

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.exceptions import NotFoundException
from models.user import User
from schemas.report import ReportGenerateRequest, ReportListResponse, ReportResponse
from services.report_service import ReportService
from utils.helpers import get_client_ip

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportResponse, status_code=201)
def generate_report(
    payload: ReportGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a PDF, CSV, or Excel report of predictions/patients."""
    service = ReportService(db)
    report = service.generate_report(payload, current_user, get_client_ip(request), str(request.url.path))
    return ReportResponse.from_orm_with_url(report)


@router.get("", response_model=ReportListResponse)
def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List previously generated reports (scoped to the current user)."""
    service = ReportService(db)
    items, total = service.list_reports(page, page_size, current_user)
    report_items = [ReportResponse.from_orm_with_url(r) for r in items]
    return ReportListResponse(total=total, page=page, page_size=page_size, items=report_items)


@router.get("/{report_id}/download")
def download_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    """Download the generated report file."""
    service = ReportService(db)
    report = service.get_report(report_id)
    if not os.path.isfile(report.file_path):
        raise NotFoundException("Report file is missing on disk")
    return FileResponse(report.file_path, filename=os.path.basename(report.file_path))


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a generated report (and its underlying file)."""
    service = ReportService(db)
    service.delete_report(report_id, current_user, get_client_ip(request), str(request.url.path))
