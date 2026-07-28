from pydantic import BaseModel, Field


class ClinicalFeatures(BaseModel):
    race: str = "nan"
    gender: str = "Female"
    age: str = "[50-60)"
    admission_type_id: int = 1
    discharge_disposition_id: int = 1
    admission_source_id: int = 7
    time_in_hospital: int = Field(3, ge=1, le=14)
    num_lab_procedures: int = Field(40, ge=0, le=132)
    num_procedures: int = Field(0, ge=0, le=6)
    num_medications: int = Field(15, ge=0, le=81)
    number_outpatient: int = Field(0, ge=0, le=42)
    number_emergency: int = Field(0, ge=0, le=76)
    number_inpatient: int = Field(0, ge=0, le=21)
    diag_1: str = "250"
    diag_2: str = "nan"
    diag_3: str = "nan"
    number_diagnoses: int = Field(5, ge=1, le=16)
    max_glu_serum: str = "nan"
    A1Cresult: str = "nan"
    metformin: str = "No"
    repaglinide: str = "No"
    nateglinide: str = "No"
    chlorpropamide: str = "No"
    glimepiride: str = "No"
    acetohexamide: str = "No"
    glipizide: str = "No"
    glyburide: str = "No"
    tolbutamide: str = "No"
    pioglitazone: str = "No"
    rosiglitazone: str = "No"
    acarbose: str = "No"
    miglitol: str = "No"
    troglitazone: str = "No"
    tolazamide: str = "No"
    examide: str = "No"
    citoglipton: str = "No"
    insulin: str = "No"
    glyburide_metformin: str = Field("No", alias="glyburide-metformin")
    glipizide_metformin: str = Field("No", alias="glipizide-metformin")
    glimepiride_pioglitazone: str = Field("No", alias="glimepiride-pioglitazone")
    metformin_rosiglitazone: str = Field("No", alias="metformin-rosiglitazone")
    metformin_pioglitazone: str = Field("No", alias="metformin-pioglitazone")
    change: str = "No"
    diabetesMed: str = "Yes"

    class Config:
        populate_by_name = True


class PredictionRequest(BaseModel):
    patient_id: str | None = None  # link prediction to an existing patient record
    features: ClinicalFeatures


class PredictionResponse(BaseModel):
    readmission_probability: float
    risk_category: str
    recommendations: list[str]
