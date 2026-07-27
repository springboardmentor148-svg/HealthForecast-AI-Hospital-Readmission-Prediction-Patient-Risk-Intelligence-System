"""Report request/response schemas."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from utils.constants import ReportType


class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    title: Optional[str] = None
    # Optional filters to scope the report content
    patient_id: Optional[uuid.UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_type: str
    title: Optional[str]
    status: str
    # Expose a safe download URL, never the raw disk file_path
    download_url: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime

    @classmethod
    def from_orm_with_url(cls, report) -> "ReportResponse":
        """Build the response, injecting a relative download URL."""
        obj = cls.model_validate(report)
        obj.download_url = f"/api/v1/reports/{report.id}/download"
        return obj


class ReportListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ReportResponse]
