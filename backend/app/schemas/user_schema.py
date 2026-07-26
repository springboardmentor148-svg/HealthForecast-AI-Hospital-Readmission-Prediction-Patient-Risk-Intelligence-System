from pydantic import BaseModel, EmailStr


# User registration schema
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str


# User login schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# User profile update schema (only full_name is editable for now)
class UserUpdate(BaseModel):
    full_name: str