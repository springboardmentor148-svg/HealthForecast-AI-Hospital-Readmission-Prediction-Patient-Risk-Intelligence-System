from __future__ import annotations

from functools import wraps
from typing import Any, Callable, TypeVar

from flask_jwt_extended import get_jwt_identity

from ..errors import APIError
from ..extensions import db
from ..models import User, UserRole

F = TypeVar("F", bound=Callable[..., Any])


def _normalize_role(role: str | UserRole) -> str:
    return role.value if isinstance(role, UserRole) else str(role).strip().lower()


def get_current_user() -> User:
    identity = get_jwt_identity()
    if identity is None:
        raise APIError("Authentication required", 401)

    try:
        user_id = int(identity)
    except (TypeError, ValueError) as exc:
        raise APIError("Invalid authentication token", 401) from exc

    user = db.session.get(User, user_id)
    if user is None:
        raise APIError("User not found", 404)
    if not user.is_active:
        raise APIError("User account is inactive", 403)
    return user


def require_roles(*roles: str | UserRole):
    allowed_roles = {_normalize_role(role) for role in roles}

    def decorator(fn: F) -> F:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if user.role is None or user.role.value not in allowed_roles:
                raise APIError("You do not have permission to access this resource", 403)
            return fn(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorator
