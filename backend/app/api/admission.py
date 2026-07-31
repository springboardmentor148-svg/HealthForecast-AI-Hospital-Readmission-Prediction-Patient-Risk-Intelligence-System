from fastapi import APIRouter, Depends
from bson import ObjectId

from app.database.database import database
from app.schemas.admission_schema import AdmissionCreate, AdmissionUpdate
from app.models.admission_model import AdmissionModel
from app.utils.jwt_handler import verify_token
from app.schemas.admission_schema import AdmissionCreate, AdmissionUpdate

# Create API router
router = APIRouter(
    prefix="/admissions",
    tags=["Admission"]
)

# # Test API
# @router.get("/")
# async def test_admission():
#     return {
#         "message": "Admission API is working"
#     }



# API to add a new admission record
@router.post("/")
async def add_admission(
    admission: AdmissionCreate,                 # Request body
    current_user: dict = Depends(verify_token)  # Verify logged-in doctor
):

    # Create admission document
    admission_data = AdmissionModel.create_admission(
        patient_id=admission.patient_id,
        admission_date=admission.admission_date,
        discharge_date=admission.discharge_date,
        admission_reason=admission.admission_reason,
        ward=admission.ward,
        attending_doctor=admission.attending_doctor,
        discharge_summary=admission.discharge_summary,
        created_by=current_user["sub"]        # Store doctor's email
    )

    # Insert document into MongoDB
    result = await database.admissions.insert_one(admission_data)

    # Return success response
    return {
        "message": "Admission added successfully",
        "admission_id": str(result.inserted_id)
    }
    
    

# API to get all admission records of a patient
@router.get("/patient/{patient_id}")
async def get_admissions(
    patient_id: str,
    current_user: dict = Depends(verify_token)
):

    # Find all admission records of the patient
    admissions = await database.admissions.find(
        {
            "patient_id": patient_id,
            "created_by": current_user["sub"]
        }
    ).to_list(length=None)

    # Convert MongoDB ObjectId into string
    for admission in admissions:
        admission["_id"] = str(admission["_id"])

    # Return all admission records
    return admissions    




# API to update an admission record
@router.put("/{admission_id}")
async def update_admission(
    admission_id: str,
    admission: AdmissionUpdate,
    current_user: dict = Depends(verify_token)
):

    # Create a dictionary containing only the fields sent by the user
    update_data = admission.model_dump(exclude_unset=True)

    # Update the admission record only if it belongs to the logged-in doctor
    result = await database.admissions.update_one(
        {
            "_id": ObjectId(admission_id),
            "created_by": current_user["sub"]
        },
        {
            "$set": update_data
        }
    )

    # Check whether any document was updated
    if result.modified_count == 0:
        return {
            "message": "Admission record not found or no changes made"
        }

    # Success response
    return {
        "message": "Admission updated successfully"
    }
    
    
    
 
 # API to delete an admission record
@router.delete("/{admission_id}")
async def delete_admission(
    admission_id: str,
    current_user: dict = Depends(verify_token)
):

    # Delete the admission record only if it belongs to the logged-in doctor
    result = await database.admissions.delete_one(
        {
            "_id": ObjectId(admission_id),
            "created_by": current_user["sub"]
        }
    )

    # Check whether the admission record exists
    if result.deleted_count == 0:
        return {
            "message": "Admission record not found"
        }

    # Success response
    return {
        "message": "Admission deleted successfully"
    } 