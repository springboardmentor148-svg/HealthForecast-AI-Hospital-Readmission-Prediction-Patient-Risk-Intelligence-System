import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserPreference
from schemas import (
    UserUpdate,
    UserResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    PreferenceUpdateRequest,
    PreferenceResponse,
)
from auth_utils import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])

# Frontend (camelCase) field ko DB model (snake_case) field se map karta hai
FIELD_MAP = {
    "fullName": "full_name",
    "email": "email",
    "mobileNumber": "mobile_number",
    "department": "department",
    "hospitalName": "hospital_name",
    "hospitalType": "hospital_type",
    "ownershipType": "ownership_type",
    "hospitalContact": "hospital_contact",
    "hospitalAddress": "hospital_address",
}


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Sirf wahi fields lo jo frontend ne actually bheji hain (partial update)
    update_data = payload.model_dump(exclude_unset=True)

    # Agar email change ho raha hai, toh check karo koi aur usse already use nahi kar raha
    if "email" in update_data and update_data["email"] != current_user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    for key, value in update_data.items():
        db_field = FIELD_MAP.get(key)
        if db_field:
            setattr(current_user, db_field, value)

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        fullName=current_user.full_name,
        email=current_user.email,
        mobileNumber=current_user.mobile_number,
        hospitalName=current_user.hospital_name,
        hospitalType=current_user.hospital_type,
        ownershipType=current_user.ownership_type,
        hospitalContact=current_user.hospital_contact,
        hospitalAddress=current_user.hospital_address,
        department=current_user.department,
        userRole=current_user.user_role,
    )


# ---------- CHANGE PASSWORD ----------
@router.post("/me/change-password", response_model=ChangePasswordResponse)
def change_my_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.currentPassword, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.hashed_password = hash_password(payload.newPassword)
    db.commit()

    return ChangePasswordResponse(message="Password changed successfully")


# ---------- GENERIC USER PREFERENCES (key-value store) ----------
# Har settings tab (Alert Thresholds, Notifications, Report Preferences,
# Data & Privacy, Appearance, Two-Factor toggle, waghera) isi generic
# endpoint se apna data JSON ke roop me save/load karta hai.

@router.get("/me/preferences/{key}", response_model=PreferenceResponse)
def get_my_preference(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id, UserPreference.key == key)
        .first()
    )
    if not pref:
        return PreferenceResponse(key=key, value=None)

    try:
        parsed_value = json.loads(pref.value)
    except (ValueError, TypeError):
        parsed_value = None

    return PreferenceResponse(key=key, value=parsed_value)


@router.put("/me/preferences/{key}", response_model=PreferenceResponse)
def set_my_preference(
    key: str,
    payload: PreferenceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id, UserPreference.key == key)
        .first()
    )

    value_json = json.dumps(payload.value)

    if pref:
        pref.value = value_json
    else:
        pref = UserPreference(user_id=current_user.id, key=key, value=value_json)
        db.add(pref)

    db.commit()

    return PreferenceResponse(key=key, value=payload.value)

# ---------- TWO-FACTOR TOGGLE ----------
@router.put("/me/two-factor")
def update_two_factor(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id, UserPreference.key == "twoFactor")
        .first()
    )
    value_json = json.dumps(payload)

    if pref:
        pref.value = value_json
    else:
        pref = UserPreference(user_id=current_user.id, key="twoFactor", value=value_json)
        db.add(pref)

    db.commit()
    return payload


# ---------- NOTIFICATION PREFERENCES ----------
@router.put("/me/notification-preferences")
def update_notification_preferences(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id, UserPreference.key == "notifications")
        .first()
    )
    value_json = json.dumps(payload)

    if pref:
        pref.value = value_json
    else:
        pref = UserPreference(user_id=current_user.id, key="notifications", value=value_json)
        db.add(pref)

    db.commit()
    return payload


# ---------- APPEARANCE PREFERENCES ----------
@router.put("/me/appearance-preferences")
def update_appearance_preferences(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id, UserPreference.key == "appearance")
        .first()
    )
    value_json = json.dumps(payload)

    if pref:
        pref.value = value_json
    else:
        pref = UserPreference(user_id=current_user.id, key="appearance", value=value_json)
        db.add(pref)

    db.commit()
    return payload


# ---------- LOAD ALL PREFERENCES AT ONCE (for settings page initial load) ----------
@router.get("/me/all-preferences")
def get_all_my_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id)
        .all()
    )

    result = {}
    for p in prefs:
        try:
            result[p.key] = json.loads(p.value)
        except (ValueError, TypeError):
            result[p.key] = None

    return result