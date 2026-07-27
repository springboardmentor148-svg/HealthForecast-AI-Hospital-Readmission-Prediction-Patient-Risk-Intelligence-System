"""Application-wide constants and enumerations."""
from enum import Enum


class UserRole(str, Enum):
    DOCTOR = "doctor"
    HOSPITAL_ADMIN = "hospital_administrator"
    RESEARCHER = "healthcare_researcher"
    SYSTEM_ADMIN = "system_administrator"


class RiskCategory(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class ReportType(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"


class ReportStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class AuditAction(str, Enum):
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    REGISTER = "register"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    CREATE_PATIENT = "create_patient"
    UPDATE_PATIENT = "update_patient"
    DELETE_PATIENT = "delete_patient"
    VIEW_PATIENT = "view_patient"
    PREDICTION = "prediction"
    GENERATE_REPORT = "generate_report"
    DELETE_REPORT = "delete_report"


# Roles allowed to manage patient records (create/update/delete)
PATIENT_WRITE_ROLES = {UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN}

# Roles allowed to run predictions
PREDICTION_ROLES = {UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN}

# Roles allowed to view analytics / research data
ANALYTICS_ROLES = {
    UserRole.DOCTOR,
    UserRole.HOSPITAL_ADMIN,
    UserRole.RESEARCHER,
    UserRole.SYSTEM_ADMIN,
}

# Roles allowed full user management
USER_ADMIN_ROLES = {UserRole.SYSTEM_ADMIN, UserRole.HOSPITAL_ADMIN}
