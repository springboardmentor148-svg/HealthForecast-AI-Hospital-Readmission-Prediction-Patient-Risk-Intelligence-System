from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from ..errors import APIError
from ..extensions import db
from ..models import User, UserRole
from .auth_service import normalize_optional_text


def _display_role(role: UserRole | None) -> str | None:
    return role.value if role else None


def _status_for_user(user: User) -> str:
    if not user.is_active:
        return "inactive"
    if user.last_login_at is None:
        return "pending"
    return "active"


def serialize_user_detail(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username,
        "role": _display_role(user.role),
        "department": user.department,
        "phone": user.phone,
        "status": _status_for_user(user),
        "is_active": user.is_active,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "initials": "".join(part[:1].upper() for part in user.full_name.split()[:2]) or "U",
    }


def list_users() -> list[dict[str, Any]]:
    users = User.query.order_by(User.id.asc()).all()
    return [serialize_user_detail(user) for user in users]


def get_user(user_id: int) -> User | None:
    return db.session.get(User, user_id)


def update_user(user: User, payload: dict[str, Any]) -> User:
    if "full_name" in payload:
        full_name = payload.get("full_name")
        if not isinstance(full_name, str) or not full_name.strip():
            raise APIError("full_name is required", 400)
        user.full_name = full_name.strip()

    if "email" in payload:
        email = payload.get("email")
        if not isinstance(email, str) or not email.strip():
            raise APIError("email is required", 400)
        user.email = email.strip().lower()

    if "role" in payload:
        role = payload.get("role")
        if not isinstance(role, str):
            raise APIError("role is required", 400)
        try:
            user.role = UserRole(role.strip().lower())
        except ValueError as exc:
            raise APIError("Invalid role", 400) from exc

    if "department" in payload:
        user.department = normalize_optional_text(payload.get("department"))

    if "phone" in payload:
        user.phone = normalize_optional_text(payload.get("phone"))

    if "is_active" in payload:
        user.is_active = bool(payload.get("is_active"))

    if "password" in payload:
        from werkzeug.security import generate_password_hash
        password = payload.get("password")
        if not isinstance(password, str) or len(password.strip()) < 8:
            raise APIError("Password must be at least 8 characters long", 400)
        user.password_hash = generate_password_hash(password.strip())

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIError("Unable to update user", 409) from exc
    return user


def update_profile(user: User, payload: dict[str, Any]) -> User:
    allowed = {key: payload[key] for key in ("full_name", "department", "phone", "password") if key in payload}
    updated_user = update_user(user, allowed)
    
    log_user_activity(
        user_id=user.id,
        action="update_profile",
        target_type="User",
        target_id=user.id,
        metadata={},
    )
    return updated_user



def create_user(payload: dict[str, Any]) -> User:
    from .auth_service import register_user

    return register_user(payload)


def log_user_activity(
    user_id: int | None = None,
    action: str = "",
    target_type: str = "",
    target_id: Any = "",
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """
    Logs user activity dynamically in a nested transaction savepoint.
    If user_id is None, infers the current authenticated user from JWT context.
    """
    from flask_jwt_extended import get_jwt_identity
    from flask import request
    from ..extensions import db
    from ..models import ActivityLog
    import sys

    # Auto-infer user_id from JWT if not explicitly provided
    if user_id is None:
        try:
            identity = get_jwt_identity()
            if identity is not None:
                user_id = int(identity)
        except Exception:
            pass

    if metadata is None:
        metadata = {}

    try:
        # Resolve client IP address if in request context
        ip_address = None
        try:
            if request:
                ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
                if ip_address and "," in ip_address:
                    ip_address = ip_address.split(",")[0].strip()
        except Exception:
            pass

        log = ActivityLog(
            user_id=user_id,
            action=action[:100],
            target_type=target_type[:100],
            target_id=str(target_id)[:64],
            metadata_json=metadata,
            ip_address=ip_address[:45] if ip_address else None,
        )
        
        # Use nested transaction savepoint to isolate logging write failures
        with db.session.begin_nested():
            db.session.add(log)
        
        db.session.commit()
        return log
    except Exception as exc:
        print(f"WARNING: Activity logging failed: {exc}", file=sys.stderr)
        try:
            db.session.rollback()
        except Exception:
            pass
        return None


def _generate_activity_description(log: Any) -> str:
    action = log.action
    target_id = log.target_id
    meta = log.metadata_json or {}
    
    if action == "create_patient":
        name = meta.get("patient_name") or "New Patient"
        return f"Created Patient profile {name} (ID: #{target_id})"
    elif action == "update_patient":
        name = meta.get("patient_name") or "Patient"
        return f"Updated Patient profile {name} (ID: #{target_id})"
    elif action == "delete_patient":
        name = meta.get("patient_name") or "Patient"
        return f"Deleted Patient profile {name} (ID: #{target_id})"
    elif action == "import_patients":
        count = meta.get("count") or 0
        return f"Imported {count} patients via CSV"
    elif action == "run_prediction":
        name = meta.get("patient_name") or "Patient"
        prob = meta.get("readmission_probability")
        prob_str = f" ({prob:.1f}%)" if prob is not None else ""
        return f"Generated Readmission Prediction for {name}{prob_str}"
    elif action == "create_treatment":
        t_name = meta.get("treatment_name") or "Treatment"
        p_name = meta.get("patient_name") or f"#{meta.get('patient_id')}"
        return f"Initiated treatment {t_name} for Patient {p_name}"
    elif action == "update_treatment":
        t_name = meta.get("treatment_name") or "Treatment"
        status = meta.get("status") or "updated"
        return f"Updated treatment {t_name} status to {status}"
    elif action == "approve_clinical_support":
        p_name = meta.get("patient_name") or f"#{meta.get('patient_id')}"
        return f"Approved Clinical Support Plan for Patient {p_name}"
    elif action == "login":
        return "User logged in"
    elif action == "update_profile":
        return "Updated personal profile details"
    
    target_desc = f" ({log.target_type} #{target_id})" if log.target_type and target_id else ""
    return f"{log.action.replace('_', ' ').capitalize()}{target_desc}"


def _generate_activity_module(log: Any) -> str:
    action = log.action
    if action in ("create_patient", "update_patient", "delete_patient", "import_patients"):
        return "Patient Registry"
    elif action == "run_prediction":
        return "Predict workflow module"
    elif action in ("create_treatment", "update_treatment", "approve_clinical_support"):
        return "Clinical Support documentation"
    elif action == "login":
        return "User Access Security"
    elif action == "update_profile":
        return "User Profile settings"
    return "System Portal Session"


def list_user_activity(user_id: int, page: int = 1, per_page: int = 20) -> list[dict[str, Any]]:
    """
    Retrieves serialized recent activities for the given user, newest first.
    """
    from ..models import ActivityLog

    query = (
        ActivityLog.query.filter_by(user_id=user_id)
        .order_by(ActivityLog.created_at.desc())
    )
    records = query.offset((page - 1) * per_page).limit(per_page).all()
    
    serialized = []
    for log in records:
        description = _generate_activity_description(log)
        module = _generate_activity_module(log)
        
        serialized.append({
            "id": log.id,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "description": description,
            "module": module,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "metadata": log.metadata_json,
        })
    return serialized

