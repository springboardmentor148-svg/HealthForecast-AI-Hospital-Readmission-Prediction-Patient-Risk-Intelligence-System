# ==========================================
# database.py — PostgreSQL connection setup
#
# Reads the connection string from an environment variable
# rather than hardcoding it, so credentials never end up in
# your code or your git history.
#
# Uses pg8000 as the driver — a pure-Python PostgreSQL client
# with no compiled C extension. psycopg2 (the more common choice)
# ships a native .pyd/.dll binary that some locked-down Windows
# setups block outright via Application Control policy; pg8000
# has no such binary, so there's nothing for that policy to block.
# ==========================================

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()  # reads variables from a local .env file, if present

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/readmission_db",
)

# Accept a plain "postgresql://" URL (e.g. straight from Neon/Supabase)
# and route it through the pg8000 driver automatically, so nobody needs
# to hand-edit their existing .env connection string.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# pg8000 doesn't understand the "channel_binding" query parameter that
# Neon's copy-paste connection strings include — safe to drop, since
# sslmode=require alone already gives an encrypted connection.
if "channel_binding=require" in DATABASE_URL:
    DATABASE_URL = (
        DATABASE_URL
        .replace("&channel_binding=require", "")
        .replace("?channel_binding=require&", "?")
        .replace("?channel_binding=require", "")
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — gives each request its own DB session
    and guarantees it's closed afterward, even if an error occurs."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
