from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import User, Prediction, Patient, AuditLog
from auth_utils import get_current_user, hash_password
from audit_utils import log_action
from schemas import (
    AdminUserResponse,
    AdminUserListResponse,
    InviteUserRequest,
    UpdateUserRoleRequest,
    ActivateDeactivateResponse,
    AdminOverviewResponse,
    RecentUserItem,
    RecentPredictionItem,
    AdminUserUpdateRequest,
)

router = APIRouter(prefix="/admin", tags=["System Admin - User Management"])

VALID_ROLES = ["Doctor", "Hospital Administrator", "Healthcare Researcher", "System Administrator"]


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Sirf System Administrator role wale users ko allow karega."""
    if current_user.user_role != "System Administrator":
        raise HTTPException(status_code=403, detail="Not authorized — Admin access required")
    return current_user


def to_admin_response(user: User) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        mobileNumber=user.mobile_number,
        hospitalName=user.hospital_name,
        userRole=user.user_role,
        department=user.department,
        isActive=user.is_active,
        createdAt=user.created_at.isoformat() if user.created_at else "",
    )


# ---------- LIST USERS ----------
@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    role: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = db.query(User)
    if role:
        query = query.filter(User.user_role == role)

    users = query.order_by(User.created_at.desc()).all()
    return AdminUserListResponse(
        users=[to_admin_response(u) for u in users],
        total=len(users),
    )


# ---------- INVITE (CREATE) USER ----------
@router.post("/users/invite", response_model=AdminUserResponse)
def invite_user(
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if payload.userRole not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=payload.fullName,
        email=payload.email,
        mobile_number=payload.mobileNumber,
        hospital_name=payload.hospitalName,
        hospital_type=payload.hospitalType,
        ownership_type=payload.ownershipType,
        hospital_contact=payload.hospitalContact,
        hospital_address=payload.hospitalAddress,
        department=payload.department,
        user_role=payload.userRole,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(
        db=db,
        actor=admin,
        action="USER_INVITED",
        category="User Management",
        target=new_user.full_name,
        details=f"Invited as {new_user.user_role}",
    )

    return to_admin_response(new_user)


# ---------- ACTIVATE / DEACTIVATE ----------
@router.patch("/users/{user_id}/toggle-active", response_model=ActivateDeactivateResponse)
def toggle_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    log_action(
        db=db,
        actor=admin,
        action="USER_ACTIVATED" if user.is_active else "USER_DEACTIVATED",
        category="User Management",
        target=user.full_name,
    )

    return ActivateDeactivateResponse(
        id=user.id,
        isActive=user.is_active,
        message=f"User {'activated' if user.is_active else 'deactivated'} successfully",
    )


# ---------- CHANGE ROLE ----------
@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if payload.userRole not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.user_role
    user.user_role = payload.userRole
    db.commit()
    db.refresh(user)

    log_action(
        db=db,
        actor=admin,
        action="ROLE_CHANGED",
        category="User Management",
        target=user.full_name,
        details=f"{old_role} → {user.user_role}",
    )

    return to_admin_response(user)


# ---------- EDIT USER DETAILS ----------
@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def edit_user(
    user_id: int,
    payload: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_email = (
        db.query(User)
        .filter(User.email == payload.email, User.id != user_id)
        .first()
    )
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use by another user")

    user.full_name = payload.fullName
    user.email = payload.email
    user.mobile_number = payload.mobileNumber
    db.commit()
    db.refresh(user)

    log_action(
        db=db,
        actor=admin,
        action="USER_EDITED",
        category="User Management",
        target=user.full_name,
    )

    return to_admin_response(user)


# ---------- REMOVE USER ----------
@router.delete("/users/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot remove your own account")

    removed_name = user.full_name
    db.delete(user)
    db.commit()

    log_action(
        db=db,
        actor=admin,
        action="USER_REMOVED",
        category="User Management",
        target=removed_name,
    )

    return {"message": "User removed successfully"}


# ---------- OVERVIEW STATS ----------
@router.get("/overview", response_model=AdminOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = db.query(User).count()

    active_doctors = (
        db.query(User)
        .filter(User.user_role == "Doctor", User.is_active == True)
        .count()
    )

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    predictions_this_week = (
        db.query(Prediction)
        .filter(Prediction.created_at >= one_week_ago)
        .count()
    )

    total_patients = db.query(Patient).count()

    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    recent_predictions = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(5)
        .all()
    )

    return AdminOverviewResponse(
        totalUsers=total_users,
        activeDoctors=active_doctors,
        predictionsThisWeek=predictions_this_week,
        totalPatients=total_patients,
        recentUsers=[
            RecentUserItem(
                id=u.id,
                fullName=u.full_name,
                userRole=u.user_role,
                isActive=u.is_active,
                createdAt=u.created_at,
            )
            for u in recent_users
        ],
        recentPredictions=[
            RecentPredictionItem(
                id=p.id,
                patientName=p.patient_name,
                result=p.result,
                riskLevel=p.risk_level,
                createdAt=p.created_at,
            )
            for p in recent_predictions
        ],
    )


# ---------- AUDIT LOGS ----------
@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(100)
        .all()
    )

    return {
        "logs": [
            {
                "id": log.id,
                "actorName": log.actor_name,
                "action": log.action,
                "category": log.category,
                "target": log.target,
                "details": log.details,
                "timestamp": log.timestamp.isoformat() + "Z" if log.timestamp else "",
            }
            for log in logs
        ]
    }