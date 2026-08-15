from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.user import User
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# GET ALL USERS
# ============================================================

@router.get(
    "/",
    response_model=List[dict]
)
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Only system admin can view users
    if current_user.get("role") != "system_admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only system administrator can access users"
        )

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
            "status": (
                "Active"
                if user.is_active
                else "Inactive"
            ),
            "created_at": user.created_at
        }
        for user in users
    ]


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/{user_id}"
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "system_admin":

        raise HTTPException(
            status_code=403,
            detail="Only system administrator can access users"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": (
            "Active"
            if user.is_active
            else "Inactive"
        ),
        "created_at": user.created_at
    }