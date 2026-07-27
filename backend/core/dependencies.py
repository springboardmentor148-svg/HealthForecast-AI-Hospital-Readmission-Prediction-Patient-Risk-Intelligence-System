"""
FastAPI dependency-injection wiring: DB sessions, current-user resolution
from JWT, and role-based access control (RBAC) guards.
"""
from typing import Iterable

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from core.database import get_db
from core.exceptions import ForbiddenException, UnauthorizedException
from core.security import decode_token, is_token_type
from models.user import User
from repositories.user_repository import UserRepository
from utils.helpers import to_uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the authenticated user from the Bearer access token.
    Raises UnauthorizedException on any missing/invalid/expired token,
    unknown user, or inactive account.
    """
    if not token:
        raise UnauthorizedException("Missing authentication token")

    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    if not is_token_type(payload, "access"):
        raise UnauthorizedException("Invalid token type — use an access token")

    user_id = to_uuid(payload.get("sub", ""))
    if user_id is None:
        raise UnauthorizedException("Invalid token subject")

    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedException("User no longer exists")
    if not user.is_active:
        raise UnauthorizedException("This account has been deactivated")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Alias kept for readability at call sites; account activity already enforced above."""
    return current_user


class RequireRoles:
    """
    Dependency factory implementing RBAC. Usage:

        @router.get("/admin-only", dependencies=[Depends(RequireRoles(UserRole.SYSTEM_ADMIN))])
    or
        current_user: User = Depends(RequireRoles(UserRole.DOCTOR, UserRole.SYSTEM_ADMIN))
    """

    def __init__(self, *allowed_roles: Iterable):
        # allow passing either individual roles or an iterable of roles
        flat: list[str] = []
        for r in allowed_roles:
            if isinstance(r, (set, list, tuple)):
                flat.extend(str(x.value if hasattr(x, "value") else x) for x in r)
            else:
                flat.append(str(r.value if hasattr(r, "value") else r))
        self.allowed_roles = set(flat)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise ForbiddenException(
                f"Role '{current_user.role}' is not permitted to access this resource"
            )
        return current_user
