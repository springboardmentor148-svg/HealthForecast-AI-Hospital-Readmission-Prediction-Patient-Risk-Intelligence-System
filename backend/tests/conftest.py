"""
Shared pytest fixtures.

Uses an in-memory SQLite database for fast, isolated tests instead of a
real PostgreSQL instance. SQLite lacks native UUID/JSON types used by
Postgres-specific columns in some setups, but the models here rely only
on SQLAlchemy's UUID(as_uuid=True) type decorator which SQLAlchemy
emulates portably, so this works for CRUD/route testing purposes.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from core.database import Base, get_db
import models  # noqa: F401
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def registered_doctor(client):
    payload = {
        "full_name": "Dr. Jane Doe",
        "email": "jane.doe@hospital.example.com",
        "password": "StrongPass123",
        "role": "doctor",
        "hospital_name": "General Hospital",
        "department": "Cardiology",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return payload


@pytest.fixture()
def auth_headers(client, registered_doctor):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": registered_doctor["email"], "password": registered_doctor["password"]},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
