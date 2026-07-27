"""
Database engine, session factory and declarative base.

All ORM models inherit from `Base`. `get_db` is the FastAPI dependency
used to inject a scoped SQLAlchemy session into routers/services.

Supports both SQLite (local dev) and PostgreSQL (Docker / production).
SQLite requires connect_args={"check_same_thread": False} for use with
FastAPI's async/threaded request handling.
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from core.config import settings

# SQLite requires check_same_thread=False when used with multi-threaded WSGI/ASGI
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, future=True
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db() -> Generator:
    """FastAPI dependency that yields a DB session and guarantees closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
