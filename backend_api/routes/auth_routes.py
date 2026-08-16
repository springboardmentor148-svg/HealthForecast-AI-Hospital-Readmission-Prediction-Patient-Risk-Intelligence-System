from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, TokenResponse, UserResponse, VerifyOtpRequest, ResendOtpRequest
from auth_utils import hash_password, verify_password, create_access_token
from email_utils import generate_otp, send_otp_email

router = APIRouter(prefix="/auth", tags=["Auth"])

VALID_ROLES = ["Doctor", "Hospital Administrator", "Healthcare Researcher", "System Administrator"]


@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if payload.userRole not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        validated = validate_email(payload.email, check_deliverability=False)
        payload.email = validated.normalized
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    otp = generate_otp()

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
        is_verified=False,
        otp_code=otp,
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(send_otp_email, new_user.email, otp)

    return UserResponse(
        id=new_user.id,
        fullName=new_user.full_name,
        email=new_user.email,
        mobileNumber=new_user.mobile_number,
        hospitalName=new_user.hospital_name,
        hospitalType=new_user.hospital_type,
        ownershipType=new_user.ownership_type,
        hospitalContact=new_user.hospital_contact,
        hospitalAddress=new_user.hospital_address,
        department=new_user.department,
        userRole=new_user.user_role,
    )


@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    if not user.otp_code or user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.otp_expires_at and datetime.now(timezone.utc) > user.otp_expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-otp")
def resend_otp(payload: ResendOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    background_tasks.add_task(send_otp_email, user.email, otp)

    return {"message": "OTP resent successfully"}


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token({"sub": str(user.id), "role": user.user_role})

    user_response = UserResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        mobileNumber=user.mobile_number,
        hospitalName=user.hospital_name,
        hospitalType=user.hospital_type,
        ownershipType=user.ownership_type,
        hospitalContact=user.hospital_contact,
        hospitalAddress=user.hospital_address,
        department=user.department,
        userRole=user.user_role,
    )

    return TokenResponse(access_token=token, user=user_response)