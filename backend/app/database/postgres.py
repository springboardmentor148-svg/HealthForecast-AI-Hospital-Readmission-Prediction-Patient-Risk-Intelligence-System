from sqlalchemy import create_engine

from sqlalchemy.orm import (
    sessionmaker,
    declarative_base
)

from app.config import DATABASE_URL


# ==========================================
# POSTGRESQL ENGINE
# ==========================================

engine = create_engine(

    DATABASE_URL,

    pool_pre_ping=True,

    echo=False

)


# ==========================================
# DATABASE SESSION
# ==========================================

SessionLocal = sessionmaker(

    autocommit=False,

    autoflush=False,

    bind=engine

)


# ==========================================
# BASE CLASS
# ==========================================

Base = declarative_base()


# ==========================================
# DATABASE DEPENDENCY
# ==========================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()