"""
ORM models package. Importing this module registers all mapped classes
on `core.database.Base.metadata`, which Alembic's `env.py` relies on for
autogenerate support.
"""
from models.user import User          # noqa: F401
from models.patient import Patient    # noqa: F401
from models.prediction import Prediction  # noqa: F401
from models.report import Report      # noqa: F401
from models.audit import AuditLog     # noqa: F401
