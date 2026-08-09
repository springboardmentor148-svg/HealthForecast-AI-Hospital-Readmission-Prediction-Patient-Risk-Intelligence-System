from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

VALID_ROLES = ["Doctor", "Hospital Administrator", "Healthcare Researcher", "System Administrator"]

@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
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
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

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

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

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