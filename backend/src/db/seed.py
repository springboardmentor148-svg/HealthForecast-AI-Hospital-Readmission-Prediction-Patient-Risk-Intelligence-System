import json
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from src.api.serializers import api_audit_to_db, api_patient_to_db
from src.core.config import settings
from src.db.models import AuditLog, Patient
from src.db.session import SessionLocal

logger = logging.getLogger(__name__)

SEED_DATA_PATH = Path(__file__).resolve().parent / "seed_data.json"


def seed_database() -> None:
    """Seed the reference patients/audit logs once, only when the tables are empty."""
    if not settings.seed_db:
        logger.info("Seeding disabled (SEED_DB != true)")
        return
    if not SEED_DATA_PATH.exists():
        logger.warning("Seed data file not found at %s; skipping seed", SEED_DATA_PATH)
        return

    try:
        data = json.loads(SEED_DATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        logger.exception("Failed to read seed data; skipping seed")
        return

    with SessionLocal() as db:
        try:
            patient_count = db.scalar(select(func.count()).select_from(Patient)) or 0
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Database unreachable; skipping seed")
            return

        if patient_count > 0:
            logger.info("Database already seeded (%d patients); skipping", patient_count)
            return

        try:
            patients = data.get("patients", [])
            logs = data.get("auditLogs", [])
            for p in patients:
                db.add(Patient(**api_patient_to_db(p)))
            for a in logs:
                db.add(AuditLog(**api_audit_to_db(a)))
            db.commit()
            logger.info(
                "Seeded database with %d patients and %d audit logs",
                len(patients),
                len(logs),
            )
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Failed to seed database")
