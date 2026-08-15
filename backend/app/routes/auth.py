from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse
)

from app.services.auth_service import (
    create_user,
    authenticate_user
)

from app.security.jwt import (
    create_access_token
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
prefix="/auth",
    tags=[
        "Authentication"
    ]

)


# ============================================================
# REGISTER
# ============================================================

@router.post(

    "/register",

    response_model=UserResponse,

    status_code=status.HTTP_201_CREATED

)

def register(

    data: RegisterRequest,

    db: Session = Depends(
        get_db
    )

):

    try:

        # ----------------------------------------------------
        # CREATE USER
        # ----------------------------------------------------

        user = create_user(

            db=db,

            full_name=data.full_name,

            email=data.email,

            password=data.password,

            role=data.role

        )


        # ----------------------------------------------------
        # RETURN USER
        # ----------------------------------------------------

        return user


    except ValueError as e:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=str(e)

        )


    except Exception as e:

        # ----------------------------------------------------
        # DATABASE / UNEXPECTED ERROR
        # ----------------------------------------------------

        db.rollback()

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "Registration failed. "
                "Please try again."
            )

        )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # AUTHENTICATE USER
    # --------------------------------------------------------

    user = authenticate_user(
    db=db,
    email=data.email,
    password=data.password,
    role=data.role
    )
    # --------------------------------------------------------
    # INVALID LOGIN
    # --------------------------------------------------------

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # --------------------------------------------------------
    # CREATE JWT TOKEN
    # --------------------------------------------------------

    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role
    )

    # --------------------------------------------------------
    # RETURN TOKEN + USER
    # --------------------------------------------------------

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }