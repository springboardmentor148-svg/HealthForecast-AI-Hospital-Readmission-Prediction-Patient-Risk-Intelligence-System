from pydantic import BaseModel


# Request body for hospital readmission prediction
class PredictionRequest(BaseModel):

    # Patient demographic information
    race: str
    gender: str
    age: str

    # Admission details
    admission_type_id: int
    discharge_disposition_id: int
    admission_source_id: int

    # Hospital stay information
    time_in_hospital: int
    num_lab_procedures: int
    num_procedures: int
    num_medications: int

    # Previous hospital visits
    number_outpatient: int
    number_emergency: int
    number_inpatient: int

    # Diagnosis codes
    diag_1: str
    diag_2: str
    diag_3: str

    # Total number of diagnoses
    number_diagnoses: int

    # Diabetes medication details
    metformin: str
    repaglinide: str
    nateglinide: str
    chlorpropamide: str
    glimepiride: str
    acetohexamide: str
    glipizide: str
    glyburide: str
    tolbutamide: str
    pioglitazone: str
    rosiglitazone: str
    acarbose: str
    miglitol: str
    troglitazone: str
    tolazamide: str
    examide: str
    citoglipton: str
    insulin: str

    # Combination diabetes medications
    # Underscore is used because Python variables cannot contain '-'
    glyburide_metformin: str
    glipizide_metformin: str
    glimepiride_pioglitazone: str
    metformin_rosiglitazone: str
    metformin_pioglitazone: str

    # Medication change information
    change: str
    diabetesMed: str