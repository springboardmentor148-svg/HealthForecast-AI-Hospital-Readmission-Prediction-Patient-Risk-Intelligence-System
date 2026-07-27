# ==========================================
# auth.py — password hashing + JWT handling
# ==========================================

import os
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
import models

load_dotenv()

# Generate your own with: python -c "import secrets; print(secrets.token_hex(32))"
# and put it in a .env file — never hardcode a real secret in committed code.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
RESET_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    # bcrypt truncates at 72 bytes internally regardless — this is a
    # bcrypt algorithm limit, not a bug, so we cap input length here too
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(user_id: int) -> str:
    """Stateless password-reset token: a short-lived JWT carrying a
    'purpose' claim so it can never be used as a normal login token,
    and vice versa. Simpler than a database-backed token table, at
    the cost of not being individually revocable before it expires —
    a reasonable tradeoff at this project's scale."""
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "purpose": "password_reset", "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verify_reset_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token.")
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None or payload.get("purpose") == "password_reset":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user
