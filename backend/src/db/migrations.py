import logging
from pathlib import Path

import alembic.command
import alembic.config

from src.db.session import engine

logger = logging.getLogger(__name__)

_BACKEND_DIR = Path(__file__).resolve().parents[2]


def run_migrations() -> None:
    """Apply pending Alembic migrations so the schema exists before seeding.

    Idempotent: it is a no-op once the database is up to date, so it is safe to
    call on every application start (both locally and inside Docker).
    """
    cfg = alembic.config.Config(str(_BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(_BACKEND_DIR / "alembic"))
    cfg.set_main_option(
        "sqlalchemy.url",
        engine.url.render_as_string(hide_password=False),
    )
    alembic.command.upgrade(cfg, "head")
    logger.info("Database migrations are up to date.")
