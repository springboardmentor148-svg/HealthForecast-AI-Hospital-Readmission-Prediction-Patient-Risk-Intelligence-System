from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.schemas.patient_schema import PatientCreate, PatientUpdate
from app.database.database import database
from app.models.patient_model import PatientModel
from app.utils.jwt_handler import verify_token

# Create API router
router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)

# Add new patient
@router.post("/")
async def add_patient(
    patient: PatientCreate,
    current_user=Depends(verify_token)
):

    # Create patient document
    new_patient = PatientModel.create_patient(
        patient_name=patient.patient_name,
        age=patient.age,
        gender=patient.gender,
        diagnosis=patient.diagnosis,
        glucose_level=patient.glucose_level,
        blood_pressure=patient.blood_pressure,
        bmi=patient.bmi,
        insulin=patient.insulin,
        diabetes_med=patient.diabetes_med,
        created_by=current_user["sub"],
        doctor_role=current_user["role"]
    )

    # Save patient in MongoDB
    result = await database.patients.insert_one(new_patient)

    # Return success response
    return {
        "message": "Patient added successfully",
        "patient_id": str(result.inserted_id)
    }
    
    
    
# Get all patients
@router.get("/")
async def get_all_patients(
    current_user=Depends(verify_token)
):

    # Get logged in doctor's patients
    patients = await database.patients.find(
        {
            "created_by": current_user["sub"]
        }
    ).to_list(100)

    # Convert ObjectId into string
    for patient in patients:
        patient["_id"] = str(patient["_id"])

    # Return all patients
    return patients
    
    
    
@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user=Depends(verify_token)
):
    patient = await database.patients.find_one(
        {
            "_id": ObjectId(patient_id),
            "created_by": current_user["sub"]
        }
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    patient["_id"] = str(patient["_id"])

    return patient   
    
    
    

# Update patient
@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    patient: PatientUpdate,
    current_user=Depends(verify_token)
):

    # Get updated fields
    updated_data = patient.model_dump(exclude_unset=True)

    # Update patient
    result = await database.patients.update_one(
        {
            "_id": ObjectId(patient_id),
            "created_by": current_user["sub"]
        },
        {
            "$set": updated_data
        }
    )

    # Check if patient exists
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Return success message
    return {
        "message": "Patient updated successfully"
    }  
    
    
    
 
# Delete patient
@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user=Depends(verify_token)
):

    # Delete patient
    result = await database.patients.delete_one(
        {
            "_id": ObjectId(patient_id),
            "created_by": current_user["sub"]
        }
    )

    # Check if patient exists
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Return success message
    return {
        "message": "Patient deleted successfully"
    }