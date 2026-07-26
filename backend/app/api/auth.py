from fastapi import APIRouter, HTTPException, Depends

from app.schemas.user_schema import UserRegister, UserLogin, UserUpdate
from app.database.database import database
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, verify_token


# Create API router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# User Registration API
@router.post("/register")
async def register(user: UserRegister):

    # Check if email already exists
    existing_user = await database.users.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user document
    new_user = {
        "full_name": user.full_name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role
    }

    # Save user in MongoDB
    await database.users.insert_one(new_user)

    # Return success message
    return {
        "message": "User registered successfully"
    }


# User Login API
@router.post("/login")
async def login(user: UserLogin):

    # Find user in MongoDB by email
    db_user = await database.users.find_one(
        {"email": user.email}
    )

    # Check if user exists
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        user.password,
        db_user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Generate JWT Token
    access_token = create_access_token(
        {
            "sub": db_user["email"],
            "role": db_user["role"]
        }
    )

    # Return Success Response
    return {
        "message": "Login Successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "full_name": db_user["full_name"],
            "email": db_user["email"],
            "role": db_user["role"]
        }
    }


# Get Current Logged-in User's Profile API
@router.get("/me")
async def get_current_user_profile(payload: dict = Depends(verify_token)):

    db_user = await database.users.find_one({"email": payload["sub"]})

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "full_name": db_user["full_name"],
        "email": db_user["email"],
        "role": db_user["role"]
    }


# Update Current Logged-in User's Profile API
@router.put("/me")
async def update_current_user_profile(
    updated_user: UserUpdate,
    payload: dict = Depends(verify_token)
):

    result = await database.users.update_one(
        {"email": payload["sub"]},
        {"$set": {"full_name": updated_user.full_name}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Return the updated profile
    db_user = await database.users.find_one({"email": payload["sub"]})

    return {
        "full_name": db_user["full_name"],
        "email": db_user["email"],
        "role": db_user["role"]
    }