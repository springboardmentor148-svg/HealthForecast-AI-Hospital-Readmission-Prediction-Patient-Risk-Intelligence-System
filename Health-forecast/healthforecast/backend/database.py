import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Defaults to a local SQLite file for zero-friction local dev (matches the
# quickstart in README.md). Set HF_DATABASE_URL to point at Postgres in
# staging/production, e.g.:
#   postgresql+psycopg2://healthforecast:password@postgres:5432/healthforecast
# (docker-compose.yml sets this automatically for the `--profile postgres` stack.)
DATABASE_URL = os.environ.get("HF_DATABASE_URL", "sqlite:///./healthforecast.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
