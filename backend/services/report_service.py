"""
Business logic for generating and managing downloadable reports
(PDF / CSV / Excel) summarising patients and predictions.
"""
import os
import uuid
from datetime import datetime

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import NotFoundException
from models.audit import AuditLog
from models.report import Report
from repositories.audit_repository import AuditRepository
from repositories.prediction_repository import PredictionRepository
from repositories.report_repository import ReportRepository
from schemas.report import ReportGenerateRequest
from utils.constants import AuditAction, ReportType


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.reports = ReportRepository(db)
        self.predictions = PredictionRepository(db)
        self.audits = AuditRepository(db)
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    def _fetch_dataset(self, payload: ReportGenerateRequest) -> pd.DataFrame:
        if payload.patient_id:
            items, _ = self.predictions.list_for_patient(payload.patient_id, page=1, page_size=1000)
        else:
            rows = self.predictions.list_recent(limit=500)
            items = [p for p, _ in rows]

        records = [
            {
                "prediction_id": str(p.id),
                "patient_id": str(p.patient_id),
                "probability": p.probability,
                "risk_category": p.risk_category,
                "confidence": p.confidence,
                "recommendation": p.recommendation,
                "model_version": p.model_version,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in items
        ]
        return pd.DataFrame(records)

    def _generate_csv(self, df: pd.DataFrame, filename: str) -> str:
        path = os.path.join(settings.REPORTS_DIR, filename)
        df.to_csv(path, index=False)
        return path

    def _generate_excel(self, df: pd.DataFrame, filename: str) -> str:
        path = os.path.join(settings.REPORTS_DIR, filename)
        df.to_excel(path, index=False, engine="openpyxl")
        return path

    def _generate_pdf(self, df: pd.DataFrame, filename: str, title: str) -> str:
        path = os.path.join(settings.REPORTS_DIR, filename)
        doc = SimpleDocTemplate(path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

        if df.empty:
            elements.append(Paragraph("No data available for this report.", styles["Normal"]))
        else:
            display_df = df.head(200)  # keep PDF readable
            data = [list(display_df.columns)] + display_df.astype(str).values.tolist()
            table = Table(data, repeatRows=1)
            table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
                ])
            )
            elements.append(table)

        doc.build(elements)
        return path

    def generate_report(self, payload: ReportGenerateRequest, current_user, ip: str, endpoint: str) -> Report:
        df = self._fetch_dataset(payload)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        base_name = f"report_{payload.report_type.value}_{timestamp}"
        title = payload.title or "HealthForecast AI - Readmission Prediction Report"

        if payload.report_type == ReportType.CSV:
            path = self._generate_csv(df, f"{base_name}.csv")
        elif payload.report_type == ReportType.EXCEL:
            path = self._generate_excel(df, f"{base_name}.xlsx")
        else:
            path = self._generate_pdf(df, f"{base_name}.pdf", title)

        report = Report(
            id=uuid.uuid4(),
            report_type=payload.report_type.value,
            file_path=path,
            status="completed",
            title=title,
            created_by=current_user.id,
        )
        report = self.reports.create(report)

        self.audits.create(
            AuditLog(
                user_id=current_user.id,
                action=AuditAction.GENERATE_REPORT,
                endpoint=endpoint,
                ip_address=ip,
                status="success",
                details=str(report.id),
            )
        )
        return report

    def get_report(self, report_id: uuid.UUID) -> Report:
        report = self.reports.get_by_id(report_id)
        if not report:
            raise NotFoundException("Report not found")
        return report

    def list_reports(self, page: int, page_size: int, current_user):
        return self.reports.list_reports(page, page_size, created_by=current_user.id)

    def delete_report(self, report_id: uuid.UUID, current_user, ip: str, endpoint: str) -> None:
        report = self.reports.get_by_id(report_id)
        if not report:
            raise NotFoundException("Report not found")

        if os.path.isfile(report.file_path):
            os.remove(report.file_path)

        self.reports.delete(report)
        self.audits.create(
            AuditLog(
                user_id=current_user.id,
                action=AuditAction.DELETE_REPORT,
                endpoint=endpoint,
                ip_address=ip,
                status="success",
                details=str(report_id),
            )
        )
