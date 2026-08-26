from fastapi import APIRouter, Depends

from app.models.user import User
from app.security.rbac import require_roles


# ============================================================
# ADMIN / ROLE BASED ACCESS ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Role Based Access Control"],
)


# ============================================================
# DOCTOR
# ============================================================

@router.get("/doctor")
def doctor_dashboard(
    current_user: User = Depends(
        require_roles(
            [
                "doctor",
                "system_admin",
            ]
        )
    ),
):
    return {
        "message": "Doctor dashboard access granted",
        "user": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }


# ============================================================
# HOSPITAL ADMINISTRATOR
# ============================================================

@router.get("/hospital-admin")
def hospital_admin_dashboard(
    current_user: User = Depends(
        require_roles(
            [
                "hospital_admin",
                "system_admin",
            ]
        )
    ),
):
    return {
        "message": "Hospital Administrator dashboard access granted",
        "user": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }


# ============================================================
# HEALTHCARE RESEARCHER
#
# IMPORTANT:
# Database currently stores this role as:
#
#     researcher
#
# We therefore accept both "researcher" and
# "healthcare_researcher" for backward compatibility.
# ============================================================

@router.get("/researcher")
def researcher_dashboard(
    current_user: User = Depends(
        require_roles(
            [
                "researcher",
                "healthcare_researcher",
                "system_admin",
            ]
        )
    ),
):
    return {
        "message": "Healthcare Researcher dashboard access granted",
        "user": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }


# ============================================================
# SYSTEM ADMINISTRATOR
# ============================================================

@router.get("/system-admin")
def system_admin_dashboard(
    current_user: User = Depends(
        require_roles(
            [
                "system_admin",
            ]
        )
    ),
):
    return {
        "message": "System Administrator dashboard access granted",
        "user": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }