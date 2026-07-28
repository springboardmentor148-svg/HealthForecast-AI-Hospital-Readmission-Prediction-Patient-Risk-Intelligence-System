from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.postgres import (
    get_db
)

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse
)

from app.services.auth_service import (
    get_user_by_email,
    create_user,
    authenticate_user
)

from app.security.jwt import (
    create_access_token
)


router = APIRouter(

    prefix="/auth",

    tags=["Authentication"]

)


# ==========================================
# ALLOWED ROLES
# ==========================================

ALLOWED_ROLES = [

    "doctor",

    "hospital_admin",

    "researcher",

    "system_admin"

]


# ==========================================
# REGISTER
# ==========================================

@router.post(

    "/register",

    response_model=UserResponse

)

def register(

    data: RegisterRequest,

    db: Session = Depends(
        get_db
    )

):

    # --------------------------------------
    # VALIDATE ROLE
    # --------------------------------------

    if data.role not in ALLOWED_ROLES:

        raise HTTPException(

            status_code=
            status.HTTP_400_BAD_REQUEST,

            detail=
            "Invalid role. Allowed roles: "
            "doctor, hospital_admin, "
            "researcher, system_admin"

        )


    # --------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------

    existing_user = get_user_by_email(

        db,

        data.email

    )


    if existing_user:

        raise HTTPException(

            status_code=
            status.HTTP_400_BAD_REQUEST,

            detail=
            "Email already registered"

        )


    # --------------------------------------
    # CREATE USER
    # --------------------------------------

    user = create_user(

        db,

        data.full_name,

        data.email,

        data.password,

        data.role

    )


    return user


# ==========================================
# LOGIN
# ==========================================

@router.post(

    "/login",

    response_model=TokenResponse

)

def login(

    data: LoginRequest,

    db: Session = Depends(
        get_db
    )

):

    user = authenticate_user(

        db,

        data.email,

        data.password

    )


    if not user:

        raise HTTPException(

            status_code=
            status.HTTP_401_UNAUTHORIZED,

            detail=
            "Invalid email or password"

        )


    # --------------------------------------
    # CREATE JWT
    # --------------------------------------

    access_token = create_access_token(

        user_id=user.id,

        email=user.email,

        role=user.role

    )


    return {

        "access_token":
        access_token,

        "token_type":
        "bearer",

        "user":
        user

    }