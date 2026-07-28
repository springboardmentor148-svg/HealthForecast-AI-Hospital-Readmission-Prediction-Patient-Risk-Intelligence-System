from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from sqlalchemy.sql import func

from app.database.postgres import Base


class User(Base):

    __tablename__ = "users"

    # ==========================================
    # PRIMARY KEY
    # ==========================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ==========================================
    # USER DETAILS
    # ==========================================

    full_name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    # ==========================================
    # PASSWORD
    # ==========================================

    hashed_password = Column(
        String(255),
        nullable=False
    )

    # ==========================================
    # ROLE
    # ==========================================

    role = Column(
        String(50),
        nullable=False,
        index=True
    )

    # ==========================================
    # ACCOUNT STATUS
    # ==========================================

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # ==========================================
    # CREATED DATE
    # ==========================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )