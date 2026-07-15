from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.user_schema import UserRegister, UserLogin
from app.database.database import database
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token


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
        return {
            "message": "Email already registered"
        }

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
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    # Find user by email
    existing_user = await database.users.find_one(
        {"email": form_data.username}
    )

    if not existing_user:
        return {
            "message": "Invalid email or password"
        }

    # Verify password
    if not verify_password(
        form_data.password,
        existing_user["password"]
    ):
        return {
            "message": "Invalid email or password"
        }

    # Create JWT token
    access_token = create_access_token(
        {
            "email": existing_user["email"],
            "role": existing_user["role"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }