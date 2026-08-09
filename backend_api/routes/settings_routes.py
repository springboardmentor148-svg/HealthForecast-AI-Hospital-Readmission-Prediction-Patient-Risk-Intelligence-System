import json
import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User, SystemSetting, UserPreference, RolePermission, AuditLog
from audit_utils import log_action
from auth_utils import hash_password, verify_password
from routes.admin_routes import require_admin
from schemas import (
    PlatformConfigRequest, PlatformConfigResponse,
    AlertThresholdsRequest, AlertThresholdsResponse,
    NotificationPrefsRequest, NotificationPrefsResponse,
    AuditReportConfigRequest, AuditReportConfigResponse,
    PrivacyConfigRequest, PrivacyConfigResponse,
    AppearanceConfigRequest, AppearanceConfigResponse,
    RolePermissionsRequest, RolePermissionsResponse,
    TwoFactorRequest, TwoFactorResponse,
    ChangePasswordRequest, ChangePasswordResponse,
)

router = APIRouter(prefix="/admin/settings", tags=["System Admin - Settings"])


# ---------- Generic KV helpers (system-wide settings) ----------
def get_system_setting(db: Session, key: str, default: dict) -> dict:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not row:
        return default
    try:
        return json.loads(row.value)
    except Exception:
        return default


def set_system_setting(db: Session, key: str, value: dict):
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if row:
        row.value = json.dumps(value)
    else:
        row = SystemSetting(key=key, value=json.dumps(value))
        db.add(row)
    db.commit()


# ---------- Generic KV helpers (per-user preferences) ----------
def get_user_pref(db: Session, user_id: int, key: str, default: dict) -> dict:
    row = db.query(UserPreference).filter(
        UserPreference.user_id == user_id, UserPreference.key == key
    ).first()
    if not row:
        return default
    try:
        return json.loads(row.value)
    except Exception:
        return default


def set_user_pref(db: Session, user_id: int, key: str, value: dict):
    row = db.query(UserPreference).filter(
        UserPreference.user_id == user_id, UserPreference.key == key
    ).first()
    if row:
        row.value = json.dumps(value)
    else:
        row = UserPreference(user_id=user_id, key=key, value=json.dumps(value))
        db.add(row)
    db.commit()


# ---------- PLATFORM CONFIGURATION ----------
DEFAULT_PLATFORM = {
    "platformName": "HealthForecastAI",
    "supportEmail": "support@healthforecastai.com",
    "environment": "Production",
    "maintenanceMode": False,
    "apiRateLimit": 1000,
}


@router.get("/platform", response_model=PlatformConfigResponse)
def get_platform_config(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_system_setting(db, "platform_config", DEFAULT_PLATFORM)


@router.put("/platform", response_model=PlatformConfigResponse)
def update_platform_config(
    payload: PlatformConfigRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_system_setting(db, "platform_config", data)
    log_action(db=db, actor=admin, action="PLATFORM_CONFIG_UPDATED", category="Settings")
    return data


# ---------- SYSTEM ALERTS ----------
DEFAULT_ALERTS = {
    "uptimeThreshold": 99,
    "failedLoginThreshold": 5,
    "errorRateThreshold": 2,
    "criticalAlertEmail": True,
}


@router.get("/alerts", response_model=AlertThresholdsResponse)
def get_alert_thresholds(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_system_setting(db, "alert_thresholds", DEFAULT_ALERTS)


@router.put("/alerts", response_model=AlertThresholdsResponse)
def update_alert_thresholds(
    payload: AlertThresholdsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_system_setting(db, "alert_thresholds", data)
    log_action(db=db, actor=admin, action="ALERT_THRESHOLDS_UPDATED", category="Settings")
    return data


# ---------- NOTIFICATIONS (per-user) ----------
DEFAULT_NOTIFICATIONS = {
    "notifyNewUser": True,
    "notifySecurityEvent": True,
    "notifySystemHealth": True,
    "notifyWeeklyDigest": False,
}


@router.get("/notifications", response_model=NotificationPrefsResponse)
def get_notification_prefs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_user_pref(db, admin.id, "notification_prefs", DEFAULT_NOTIFICATIONS)


@router.put("/notifications", response_model=NotificationPrefsResponse)
def update_notification_prefs(
    payload: NotificationPrefsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_user_pref(db, admin.id, "notification_prefs", data)
    return data


# ---------- AUDIT & REPORTS ----------
DEFAULT_AUDIT_CONFIG = {
    "auditExportFormat": "CSV",
    "auditRetention": "24",
    "autoExportMonthly": True,
}


@router.get("/audit-config", response_model=AuditReportConfigResponse)
def get_audit_config(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_system_setting(db, "audit_config", DEFAULT_AUDIT_CONFIG)


@router.put("/audit-config", response_model=AuditReportConfigResponse)
def update_audit_config(
    payload: AuditReportConfigRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_system_setting(db, "audit_config", data)
    log_action(db=db, actor=admin, action="AUDIT_CONFIG_UPDATED", category="Settings")
    return data


@router.get("/audit-export")
def export_audit_logs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Actor", "Action", "Category", "Target", "Details", "Timestamp"])
    for log in logs:
        writer.writerow([
            log.id, log.actor_name, log.action, log.category,
            log.target or "", log.details or "",
            log.timestamp.isoformat() if log.timestamp else "",
        ])
    buffer.seek(0)

    log_action(db=db, actor=admin, action="AUDIT_LOGS_EXPORTED", category="Settings", details=f"{len(logs)} records")

    filename = f"audit-logs-{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------- DATA & PRIVACY ----------
DEFAULT_PRIVACY = {
    "dataRetention": "36",
    "allowDataExportRequests": True,
}


@router.get("/privacy", response_model=PrivacyConfigResponse)
def get_privacy_config(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_system_setting(db, "privacy_config", DEFAULT_PRIVACY)


@router.put("/privacy", response_model=PrivacyConfigResponse)
def update_privacy_config(
    payload: PrivacyConfigRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_system_setting(db, "privacy_config", data)
    log_action(db=db, actor=admin, action="PRIVACY_CONFIG_UPDATED", category="Settings")
    return data


# ---------- APPEARANCE (per-user) ----------
DEFAULT_APPEARANCE = {
    "defaultTheme": "light",
    "compactLayout": False,
}


@router.get("/appearance", response_model=AppearanceConfigResponse)
def get_appearance_config(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_user_pref(db, admin.id, "appearance_config", DEFAULT_APPEARANCE)


@router.put("/appearance", response_model=AppearanceConfigResponse)
def update_appearance_config(
    payload: AppearanceConfigRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_user_pref(db, admin.id, "appearance_config", data)
    return data


# ---------- ROLES & PERMISSIONS ----------
PERMISSION_ROLES = ["Doctor", "Hospital Administrator", "Healthcare Researcher"]
PERMISSION_COLUMNS = ["View Predictions", "Manage Users", "Export Data", "View Audit Logs"]

DEFAULT_ROLE_PERMISSIONS = {
    "Doctor": {"View Predictions": True, "Manage Users": False, "Export Data": False, "View Audit Logs": False},
    "Hospital Administrator": {"View Predictions": True, "Manage Users": True, "Export Data": True, "View Audit Logs": False},
    "Healthcare Researcher": {"View Predictions": True, "Manage Users": False, "Export Data": True, "View Audit Logs": False},
}


@router.get("/roles-permissions", response_model=RolePermissionsResponse)
def get_role_permissions(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(RolePermission).all()

    if not rows:
        return {"permissions": DEFAULT_ROLE_PERMISSIONS}

    result = {role: {col: False for col in PERMISSION_COLUMNS} for role in PERMISSION_ROLES}
    for row in rows:
        if row.role in result and row.permission in PERMISSION_COLUMNS:
            result[row.role][row.permission] = row.allowed

    return {"permissions": result}


@router.put("/roles-permissions", response_model=RolePermissionsResponse)
def update_role_permissions(
    payload: RolePermissionsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for role, cols in payload.permissions.items():
        for permission, allowed in cols.items():
            row = db.query(RolePermission).filter(
                RolePermission.role == role, RolePermission.permission == permission
            ).first()
            if row:
                row.allowed = bool(allowed)
            else:
                db.add(RolePermission(role=role, permission=permission, allowed=bool(allowed)))
    db.commit()

    log_action(db=db, actor=admin, action="ROLE_PERMISSIONS_UPDATED", category="Settings")

    return get_role_permissions(db=db, admin=admin)


# ---------- TWO-FACTOR AUTHENTICATION (per-user, flag only) ----------
@router.get("/security/2fa", response_model=TwoFactorResponse)
def get_two_factor(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return get_user_pref(db, admin.id, "two_factor_enabled", {"enabled": True})


@router.put("/security/2fa", response_model=TwoFactorResponse)
def update_two_factor(
    payload: TwoFactorRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    data = payload.dict()
    set_user_pref(db, admin.id, "two_factor_enabled", data)
    log_action(db=db, actor=admin, action="TWO_FACTOR_UPDATED", category="Settings",
               details="Enabled" if data["enabled"] else "Disabled")
    return data


# ---------- CHANGE PASSWORD ----------
@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if not verify_password(payload.currentPassword, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    admin.hashed_password = hash_password(payload.newPassword)
    db.commit()

    log_action(db=db, actor=admin, action="PASSWORD_CHANGED", category="Settings")

    return {"message": "Password changed successfully"}