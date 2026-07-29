import os
import tempfile
import sys
from pathlib import Path

# Pre-emptively force SQLite for testing before any other modules are imported
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"
os.environ["JWT_ACCESS_TOKEN_EXPIRES_MINUTES"] = "30"
os.environ["FLASK_ENV"] = "testing"

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture()
def app():
    db_fd, db_path = tempfile.mkstemp(prefix="healthforecast-auth-", suffix=".db")
    os.close(db_fd)

    from app import create_app
    from app.extensions import db

    app = create_app("development")
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{db_path}"
    )

    with app.app_context():
        db.drop_all()
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

    if os.path.exists(db_path):
        os.remove(db_path)


@pytest.fixture()
def client(app):
    return app.test_client()
