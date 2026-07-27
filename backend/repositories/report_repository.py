"""Data-access layer for the Report entity."""
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from models.report import Report


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: Report) -> Report:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_by_id(self, report_id: uuid.UUID) -> Optional[Report]:
        return self.db.get(Report, report_id)

    def list_reports(self, page: int, page_size: int, created_by: Optional[uuid.UUID] = None):
        query = self.db.query(Report)
        if created_by:
            query = query.filter(Report.created_by == created_by)
        total = query.count()
        items = (
            query.order_by(Report.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def delete(self, report: Report) -> None:
        self.db.delete(report)
        self.db.commit()
