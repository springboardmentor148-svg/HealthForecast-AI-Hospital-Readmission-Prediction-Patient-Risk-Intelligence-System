"""
Authentication business logic: registration, login, token refresh,
logout, and password management. Routers call these methods only —
they never touch the database or JWT internals directly.
"""
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError
from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import BadRequestException, ConflictException, UnauthorizedException
from core.logging import auth_logger
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    is_token_type,
    verify_password,
)
from models.audit import AuditLog
from models.user import User
from repositories.audit_repository import AuditRepository
from repositories.user_repository import UserRepository
from schemas.auth import RegisterRequest
from utils.constants import AuditAction
from utils.helpers import to_uuid
from utils.validators import is_valid_role


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.audits = AuditRepository(db)

    # ------------------------------------------------------------------
    def _log(self, user_id, action: str, endpoint: str, ip: str, status: str, details: str = None):
        self.audits.create(
            AuditLog(
                user_id=user_id,
                action=action,
                endpoint=endpoint,
                ip_address=ip,
                status=status,
                details=details,
            )
        )

    # ------------------------------------------------------------------
    def register(self, payload: RegisterRequest, ip: str, endpoint: str) -> User:
        if not is_valid_role(payload.role):
            raise BadRequestException(f"Invalid role: {payload.role}")

        if self.users.get_by_email(payload.email):
            raise ConflictException("An account with this email already exists")

        user = User(
            id=uuid.uuid4(),
            full_name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            hospital_name=payload.hospital_name,
            department=payload.department,
            phone=payload.phone,
        )
        user = self.users.create(user)
        auth_logger.info("New user registered: %s (%s)", user.email, user.role)
        self._log(user.id, AuditAction.REGISTER, endpoint, ip, "success")
        return user

    # ------------------------------------------------------------------
    def login(self, email: str, password: str, ip: str, endpoint: str) -> tuple[str, str]:
        user = self.users.get_by_email(email)

        if not user or not verify_password(password, user.hashed_password):
            auth_logger.warning("Failed login attempt for email=%s from ip=%s", email, ip)
            # Guard: user may be None if the email doesn't exist — never access user.id directly
            self._log(user.id if user else None, AuditAction.LOGIN_FAILED, endpoint, ip, "failure")
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            self._log(user.id, AuditAction.LOGIN_FAILED, endpoint, ip, "failure", "inactive account")
            raise UnauthorizedException("This account has been deactivated")

        access_token = create_access_token(str(user.id), user.role)
        refresh_token = create_refresh_token(str(user.id))

        auth_logger.info("User logged in: %s", user.email)
        self._log(user.id, AuditAction.LOGIN, endpoint, ip, "success")
        return access_token, refresh_token

    # ------------------------------------------------------------------
    def refresh(self, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedException("Invalid or expired refresh token")

        if not is_token_type(payload, "refresh"):
            raise UnauthorizedException("Invalid token type — use a refresh token")

        user_id = to_uuid(payload.get("sub", ""))
        user = self.users.get_by_id(user_id) if user_id else None
        if not user or not user.is_active:
            raise UnauthorizedException("User no longer exists or is inactive")

        return create_access_token(str(user.id), user.role)

    # ------------------------------------------------------------------
    def logout(self, user: User, ip: str, endpoint: str) -> None:
        """
        Stateless JWT logout: the server does not persist a token blacklist
        in this scaffold. The client is responsible for discarding the
        token(s); the action is still recorded in the audit trail.
        """
        auth_logger.info("User logged out: %s", user.email)
        self._log(user.id, AuditAction.LOGOUT, endpoint, ip, "success")

    # ------------------------------------------------------------------
    def change_password(self, user: User, old_password: str, new_password: str, ip: str, endpoint: str) -> None:
        if not verify_password(old_password, user.hashed_password):
            raise BadRequestException("Old password is incorrect")

        user.hashed_password = hash_password(new_password)
        self.users.update(user)
        auth_logger.info("Password changed for user: %s", user.email)
        self._log(user.id, AuditAction.PASSWORD_CHANGE, endpoint, ip, "success")

    # ------------------------------------------------------------------
    def create_password_reset_token(self, email: str) -> str | None:
        """
        Returns a short-lived reset token if the email exists.
        In production this token would be emailed to the user rather than
        returned directly from the API.
        """
        user = self.users.get_by_email(email)
        if not user:
            # Do not reveal whether the email exists
            return None

        now = datetime.now(timezone.utc)
        from jose import jwt  # local import to avoid polluting module namespace

        token = jwt.encode(
            {"sub": str(user.id), "type": "reset", "iat": now, "exp": now + timedelta(minutes=15)},
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
        auth_logger.info("Password reset token issued for: %s", user.email)
        return token

    def reset_password(self, token: str, new_password: str) -> None:
        try:
            payload = decode_token(token)
        except JWTError:
            raise BadRequestException("Invalid or expired reset token")

        if not is_token_type(payload, "reset"):
            raise BadRequestException("Invalid token type — use a password reset token")

        user_id = to_uuid(payload.get("sub", ""))
        user = self.users.get_by_id(user_id) if user_id else None
        if not user:
            raise BadRequestException("Invalid reset token")

        user.hashed_password = hash_password(new_password)
        self.users.update(user)
        auth_logger.info("Password reset completed for: %s", user.email)
        self._log(user.id, AuditAction.PASSWORD_RESET, "/auth/reset-password", "unknown", "success")
