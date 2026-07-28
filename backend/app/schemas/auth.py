from pydantic import (
    BaseModel,
    EmailStr,
    Field
)


# ============================================================
# REGISTER REQUEST
# ============================================================

class RegisterRequest(

    BaseModel

):

    full_name: str = Field(

        ...,

        min_length=2,

        max_length=100

    )

    email: EmailStr

    password: str = Field(

        ...,

        min_length=6,

        max_length=100

    )

    role: str


# ============================================================
# LOGIN REQUEST
# ============================================================

class LoginRequest(

    BaseModel

):

    email: EmailStr

    password: str


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(

    BaseModel

):

    id: int

    full_name: str

    email: EmailStr

    role: str


    class Config:

        from_attributes = True


# ============================================================
# TOKEN RESPONSE
# ============================================================

class TokenResponse(

    BaseModel

):

    access_token: str

    token_type: str