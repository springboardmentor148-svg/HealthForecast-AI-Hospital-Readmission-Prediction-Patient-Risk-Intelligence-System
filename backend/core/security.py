"""
Security primitives: password hashing and JWT creation/verification.

Kept framework-agnostic (no FastAPI imports) so it can be unit tested in
isolation and reused by services.

NOTE: passlib 1.7.x is incompatible with bcrypt 4.x (missing __about__ module).
We use bcrypt directly instead, which is already installed and works correctly.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from core.config import settings


# ---------------------------------------------------------------------------
# Password hashing (using bcrypt directly — passlib 1.7 incompatible with bcrypt 4.x)
# ---------------------------------------------------------------------------
def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------
def _create_token(subject: str, expires_delta: timedelta, extra_claims: Optional[dict] = None,
                   token_type: str = "access") -> str:
    now = datetime.now(timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str, role: str, extra_claims: Optional[dict] = None) -> str:
    """Create a short-lived JWT access token embedding the user id and role."""
    claims = {"role": role}
    if extra_claims:
        claims.update(extra_claims)
    return _create_token(
        subject,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims=claims,
        token_type="access",
    )


def create_refresh_token(subject: str) -> str:
    """Create a long-lived JWT refresh token."""
    return _create_token(
        subject,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT. Raises jose.JWTError on any failure
    (expired, bad signature, malformed, etc.) — callers should catch this.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def is_token_type(payload: dict, expected_type: str) -> bool:
    return payload.get("type") == expected_type
