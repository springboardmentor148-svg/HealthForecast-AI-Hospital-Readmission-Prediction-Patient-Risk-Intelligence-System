import os
from datetime import datetime, timedelta

from jose import jwt
from dotenv import load_dotenv

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)


# Create JWT access token
def create_access_token(data: dict):

    # Copy user data
    payload = data.copy()

    # Set token expiry time
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Add expiry to payload
    payload.update({"exp": expire})

    # Generate JWT token
    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token



# OAuth2 token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Verify JWT token
def verify_token(token: str = Depends(oauth2_scheme)):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )