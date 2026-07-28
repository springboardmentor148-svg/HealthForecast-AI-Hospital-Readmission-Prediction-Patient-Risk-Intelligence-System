from typing import List

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.user import User

from app.security.jwt import verify_token


# ============================================================
# HTTP BEARER AUTHENTICATION
# ============================================================

security = HTTPBearer()


# ============================================================
# GET CURRENT AUTHENTICATED USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(
        get_db
    )
):

    # --------------------------------------------------------
    # GET JWT TOKEN
    # --------------------------------------------------------

    token = credentials.credentials


    # --------------------------------------------------------
    # VERIFY JWT TOKEN
    # --------------------------------------------------------

    payload = verify_token(
        token
    )


    if payload is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid or expired authentication token",

            headers={
                "WWW-Authenticate": "Bearer"
            }

        )


    # --------------------------------------------------------
    # GET USER ID FROM TOKEN
    # --------------------------------------------------------

    user_id = payload.get(
        "sub"
    )


    if user_id is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid token: user ID not found",

            headers={
                "WWW-Authenticate": "Bearer"
            }

        )


    # --------------------------------------------------------
    # FIND USER IN POSTGRESQL
    # --------------------------------------------------------

    try:

        user_id = int(
            user_id
        )

    except ValueError:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid user ID in token"

        )


    user = db.query(

        User

    ).filter(

        User.id == user_id

    ).first()


    # --------------------------------------------------------
    # USER NOT FOUND
    # --------------------------------------------------------

    if user is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="User account not found",

            headers={
                "WWW-Authenticate": "Bearer"
            }

        )


    # --------------------------------------------------------
    # CHECK ACCOUNT STATUS
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="User account is inactive"

        )


    return user


# ============================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================

def require_roles(
    allowed_roles: List[str]
):

    def role_checker(

        current_user: User = Depends(
            get_current_user
        )

    ):

        # ----------------------------------------------------
        # CHECK USER ROLE
        # ----------------------------------------------------

        if current_user.role not in allowed_roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail=(
                    "Access denied. "
                    f"Required roles: {allowed_roles}. "
                    f"Your role: {current_user.role}"
                )

            )


        return current_user


    return role_checker