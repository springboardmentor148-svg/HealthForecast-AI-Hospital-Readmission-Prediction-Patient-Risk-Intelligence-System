"""User management endpoints (admin-scoped)."""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import RequireRoles, get_current_user
from core.exceptions import NotFoundException
from models.user import User
from repositories.user_repository import UserRepository
from schemas.user import UserListResponse, UserResponse, UserUpdate
from utils.constants import USER_ADMIN_ROLES

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse, dependencies=[Depends(RequireRoles(*USER_ADMIN_ROLES))])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List all users (Hospital Administrator / System Administrator only)."""
    repo = UserRepository(db)
    items, total = repo.list_users(page, page_size)
    return UserListResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific user's profile. Users may view their own profile; admins may view any."""
    if str(current_user.id) != str(user_id) and current_user.role not in {r.value for r in USER_ADMIN_ROLES}:
        from core.exceptions import ForbiddenException
        raise ForbiddenException("You may only view your own profile")

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(RequireRoles(*USER_ADMIN_ROLES))])
def update_user(user_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update a user's profile fields (admin only)."""
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    return repo.update(user)


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(RequireRoles(*USER_ADMIN_ROLES))])
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Deactivate/delete a user account (admin only)."""
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")
    repo.delete(user)
