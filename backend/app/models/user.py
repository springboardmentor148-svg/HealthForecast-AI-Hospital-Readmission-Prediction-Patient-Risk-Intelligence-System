from __future__ import annotations

from ..extensions import db
from .enums import UserRole
from .mixins import TimestampMixin


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True, index=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    full_name = db.Column(db.String(150), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum(UserRole, name="user_role", native_enum=False, validate_strings=True),
        nullable=False,
        default=UserRole.doctor,
    )
    # Stores the clinician's department or broader operating scope, such as Endocrinology or Hospital-wide.
    department = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(32), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True)

    assigned_patients = db.relationship(
        "Patient",
        back_populates="assigned_doctor",
        foreign_keys="Patient.assigned_doctor_id",
        lazy="selectin",
    )
    created_predictions = db.relationship(
        "Prediction",
        back_populates="created_by",
        foreign_keys="Prediction.created_by_id",
        lazy="selectin",
    )
    activity_logs = db.relationship(
        "ActivityLog",
        back_populates="user",
        lazy="selectin",
    )

    __table_args__ = (
        db.CheckConstraint("length(username) >= 3", name="ck_users_username_length"),
        db.CheckConstraint("length(email) >= 5", name="ck_users_email_length"),
    )

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, username={self.username!r}, role={self.role.value!r})"
