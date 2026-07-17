from fastapi import APIRouter, Depends

from app.database.database import database
from app.schemas.treatment_schema import TreatmentCreate
from app.models.treatment_model import TreatmentModel
from app.utils.jwt_handler import verify_token
from bson import ObjectId
from app.schemas.treatment_schema import TreatmentCreate, TreatmentUpdate


# Create API router
router = APIRouter(
    prefix="/treatments",
    tags=["Treatment"]
)


@router.get("/")
async def test_treatment():
    return {"message": "Treatment API is working"}



from datetime import datetime

# API to add a new treatment record
@router.post("/")
async def add_treatment(
    treatment: TreatmentCreate,                  # Request body (Treatment details)
    current_user: dict = Depends(verify_token)   # Verify logged-in user using JWT
):

    # Create treatment document using TreatmentModel
    treatment_data = TreatmentModel.create_treatment(
        patient_id=treatment.patient_id,
        treatment_name=treatment.treatment_name,
        medication=treatment.medication,
        dosage=treatment.dosage,
        start_date=treatment.start_date,
        end_date=treatment.end_date,
        status=treatment.status,
        doctor_notes=treatment.doctor_notes,
        created_by=current_user["email"]          # Store doctor's email
    )

    # Insert treatment document into MongoDB collection
    result = await database.treatments.insert_one(treatment_data)

    # Return success response with inserted document ID
    return {
        "message": "Treatment added successfully",
        "treatment_id": str(result.inserted_id)
    }
    
    
    
# API to get all treatments of a patient
@router.get("/patient/{patient_id}")
async def get_treatments(
    patient_id: str,
    current_user: dict = Depends(verify_token)
):

    # Find all treatments for the patient created by the logged-in doctor
    treatments = await database.treatments.find(
        {
            "patient_id": patient_id,
            "created_by": current_user["email"]
        }
    ).to_list(length=None)

    # Convert MongoDB ObjectId to string
    for treatment in treatments:
        treatment["_id"] = str(treatment["_id"])

    # Return all treatments
    return treatments    




# API to update treatment details
@router.put("/{treatment_id}")
async def update_treatment(
    treatment_id: str,
    treatment: TreatmentUpdate,
    current_user: dict = Depends(verify_token)
):

    # Remove fields that are not provided
    update_data = treatment.model_dump(exclude_unset=True)

    # Update treatment only if it belongs to the logged-in doctor
    result = await database.treatments.update_one(
        {
            "_id": ObjectId(treatment_id),
            "created_by": current_user["email"]
        },
        {
            "$set": update_data
        }
    )

    # Check whether any document was updated
    if result.modified_count == 0:
        return {"message": "Treatment not found or no changes made"}

    # Success response
    return {
        "message": "Treatment updated successfully"
    }
    
    
    
    
# API to delete a treatment record
@router.delete("/{treatment_id}")
async def delete_treatment(
    treatment_id: str,
    current_user: dict = Depends(verify_token)
):

    # Delete treatment only if it belongs to the logged-in doctor
    result = await database.treatments.delete_one(
        {
            "_id": ObjectId(treatment_id),
            "created_by": current_user["email"]
        }
    )

    # Check whether the treatment exists
    if result.deleted_count == 0:
        return {
            "message": "Treatment not found"
        }

    # Success response
    return {
        "message": "Treatment deleted successfully"
    }    