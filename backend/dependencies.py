from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = "HealthForecastAISecretKey"
ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    print("\n========== AUTH DEBUG ==========")
    print("TOKEN:", token)

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("PAYLOAD:", payload)

        email = payload.get("sub")

        print("EMAIL:", email)

        if email is None:
            print("❌ Email is None")
            raise HTTPException(
                status_code=401,
                detail="Email missing in token"
            )

        user = db.query(User).filter(
            User.email == email
        ).first()

        print("USER:", user)

        if user is None:
            print("❌ User not found")
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        print("✅ Authentication Success")
        print("==============================\n")

        return user

    except JWTError as e:

        print("JWT ERROR:", e)

        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )
