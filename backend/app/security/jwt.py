
# app/security/jwt.py

from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = settings.SECRET_KEY

ALGORITHM = settings.JWT_ALGORITHM

ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
)


# ============================================================
# HTTP BEARER SECURITY
# ============================================================

security = HTTPBearer()


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: Union[int, str],
    email: Optional[str] = None,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token for an authenticated user.
    """

    # Create token payload
    to_encode = {
        "sub": str(user_id),
        "user_id": str(user_id),
    }

    # Add email if available
    if email is not None:
        to_encode["email"] = email

    # Add role if available
    if role is not None:
        to_encode["role"] = role

    # Set expiration time
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Add standard JWT timestamps
    to_encode["exp"] = expire
    to_encode["iat"] = datetime.now(timezone.utc)

    # Generate JWT
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# ============================================================
# DECODE ACCESS TOKEN
# ============================================================

def decode_access_token(
    token: str,
) -> Optional[dict]:
    """
    Decode and validate a JWT token.

    Returns:
        dict: Decoded token payload if valid.
        None: If token is invalid or expired.
    """

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:
        return None


# ============================================================
# VERIFY TOKEN
# ============================================================

def verify_token(
    token: str,
) -> dict:
    """
    Verify and decode a JWT access token.

    This function is used by RBAC
    (Role-Based Access Control).

    Returns:
        dict: Decoded JWT payload.

    Raises:
        HTTPException: If token is invalid or expired.
    """

    payload = decode_access_token(token)

    # Invalid or expired token
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Get user ID
    user_id = payload.get("user_id")

    # Fallback to standard JWT subject
    if user_id is None:
        user_id = payload.get("sub")

    # User ID is required
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID not found",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return payload


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Validate the JWT access token and return
    authenticated user information.

    This function only validates the JWT.
    It does not query PostgreSQL.
    """

    # Get token from Authorization header
    token = credentials.credentials

    # Verify token
    payload = verify_token(token)

    # Get user ID
    user_id = payload.get("user_id")

    # Fallback to "sub"
    if user_id is None:
        user_id = payload.get("sub")

    # Return authenticated user information
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role"),
    }


# ============================================================
# GET USER ID FROM TOKEN
# ============================================================

def get_user_id_from_token(
    token: str,
) -> Optional[str]:
    """
    Extract user ID from JWT token.
    """

    payload = decode_access_token(token)

    if not payload:
        return None

    user_id = payload.get("user_id")

    # Fallback to "sub"
    if user_id is None:
        user_id = payload.get("sub")

    if user_id is None:
        return None

    return str(user_id)


# ============================================================
# GET EMAIL FROM TOKEN
# ============================================================

def get_email_from_token(
    token: str,
) -> Optional[str]:
    """
    Extract email from JWT token.
    """

    payload = decode_access_token(token)

    if not payload:
        return None

    return payload.get("email")


# ============================================================
# GET ROLE FROM TOKEN
# ============================================================

def get_role_from_token(
    token: str,
) -> Optional[str]:
    """
    Extract role from JWT token.
    """

    payload = decode_access_token(token)

    if not payload:
        return None

    return payload.get("role")


# ============================================================
# OPTIONAL HTTP BEARER SECURITY
# ============================================================

optional_security = HTTPBearer(
    auto_error=False
)


# ============================================================
# GET OPTIONAL CURRENT USER
# ============================================================

def get_optional_current_user(
    credentials: Optional[
        HTTPAuthorizationCredentials
    ] = Depends(optional_security),
):
    """
    Return current user if a valid JWT is provided.

    Returns:
        dict: User information if authenticated.
        None: If no valid token is provided.
    """

    # No Authorization header
    if credentials is None:
        return None

    # Get token
    token = credentials.credentials

    # Decode token
    payload = decode_access_token(token)

    # Invalid token
    if not payload:
        return None

    # Get user ID
    user_id = payload.get("user_id")

    if user_id is None:
        user_id = payload.get("sub")

    # Return user information
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role"),
    }
