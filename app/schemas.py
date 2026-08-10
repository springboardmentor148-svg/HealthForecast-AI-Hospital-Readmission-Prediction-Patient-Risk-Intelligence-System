from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str = Field(..., example="doctor1@hospital.com")
    password: str = Field(..., example="securepassword123")
    full_name: str = Field(..., example="Dr. Jane Smith")
    role: str = Field(..., example="doctor")


class UserLogin(BaseModel):
    email: str = Field(..., example="doctor1@hospital.com")
    password: str = Field(..., example="securepassword123")


class Token(BaseModel):
    access_token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    token_type: str = Field(..., example="bearer")


class UserOut(BaseModel):
    id: int = Field(..., example=1)
    email: str = Field(..., example="doctor1@hospital.com")
    full_name: str = Field(..., example="Dr. Jane Smith")
    role: str = Field(..., example="doctor")

    class Config:
        from_attributes = True


class UserUpdateRole(BaseModel):
    role: str = Field(..., example="hospital_admin")


class PatientPredictionInput(BaseModel):
    race: str = Field(..., example="Caucasian")
    gender: str = Field(..., example="Female")
    age: str = Field(..., example="[70-80)")
    time_in_hospital: int = Field(..., example=5)
    num_medications: int = Field(..., example=15)
    insulin: str = Field(..., example="Steady")
    change: int = Field(..., example=0)


class PredictionOutput(BaseModel):
    readmission_probability: float
    risk_category: str


class FeedbackCreate(BaseModel):
    name: str = Field(..., example="Dr. Jane Smith")
    email: str = Field(..., example="doctor1@hospital.com")
    message: str = Field(..., example="The dashboard is really helpful for tracking patient risk.")


class PatientAdmissionCreate(BaseModel):
    patient_name: str = Field(..., example="John Carter")
    race: str = Field(..., example="Caucasian")
    gender: str = Field(..., example="Female")
    age: str = Field(..., example="[70-80)")
    time_in_hospital: int = Field(..., example=5)
    num_medications: int = Field(..., example=15)
    insulin: str = Field(..., example="Steady")
    change: int = Field(..., example=0)


class PatientAdmissionOut(BaseModel):
    id: int
    patient_name: str
    admitted_by: str
    age: str
    time_in_hospital: int
    readmission_probability: str
    risk_category: str
    created_at: str
