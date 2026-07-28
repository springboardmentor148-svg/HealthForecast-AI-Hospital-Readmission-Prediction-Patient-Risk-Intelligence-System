from fastapi import (
    APIRouter,
    Depends
)

from app.models.user import User

from app.security.rbac import (
    require_roles
)


router = APIRouter(

    prefix="/admin",

    tags=["System Administration"]

)


# ==========================================
# SYSTEM ADMIN ONLY
# ==========================================

@router.get("/dashboard")

def system_admin_dashboard(

    current_user: User = Depends(

        require_roles(

            [
                "system_admin"
            ]

        )

    )

):

    return {

        "message":
        "Welcome to System Administrator Dashboard",

        "user":
        current_user.full_name,

        "role":
        current_user.role

    }


# ==========================================
# HOSPITAL ADMIN
# ==========================================

@router.get("/hospital-analytics")

def hospital_analytics(

    current_user: User = Depends(

        require_roles(

            [
                "hospital_admin",

                "system_admin"

            ]

        )

    )

):

    return {

        "message":
        "Hospital analytics access granted",

        "user":
        current_user.full_name,

        "role":
        current_user.role

    }


# ==========================================
# RESEARCHER
# ==========================================

@router.get("/research")

def research_dashboard(

    current_user: User = Depends(

        require_roles(

            [
                "researcher",

                "system_admin"

            ]

        )

    )

):

    return {

        "message":
        "Research dashboard access granted",

        "user":
        current_user.full_name,

        "role":
        current_user.role

    }


# ==========================================
# DOCTOR
# ==========================================

@router.get("/doctor")

def doctor_dashboard(

    current_user: User = Depends(

        require_roles(

            [
                "doctor",

                "system_admin"

            ]

        )

    )

):

    return {

        "message":
        "Doctor dashboard access granted",

        "user":
        current_user.full_name,

        "role":
        current_user.role

    }