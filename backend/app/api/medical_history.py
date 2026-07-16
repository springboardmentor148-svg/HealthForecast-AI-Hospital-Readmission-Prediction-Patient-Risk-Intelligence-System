from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from fastapi import APIRouter, Depends
from app.database.database import database
from app.schemas.medical_history_schema import (
    MedicalHistoryCreate,
    MedicalHistoryUpdate
)
from app.models.medical_history_model import MedicalHistoryModel
from app.utils.jwt_handler import verify_token
from typing import Optional
from pydantic import BaseModel

# Create API router
router = APIRouter(
    prefix="/medical-history",
    tags=["Medical History"]
)


# Add medical history
@router.post("/")
async def add_medical_history(
    history: MedicalHistoryCreate,
    current_user=Depends(verify_token)
):

    # Create medical history document
    new_history = MedicalHistoryModel.create_history(
        patient_id=history.patient_id,
        disease=history.disease,
        treatment=history.treatment,
        medication=history.medication,
        admission_date=history.admission_date,
        discharge_date=history.discharge_date,
        notes=history.notes,
        created_by=current_user["email"]
    )

    # Save medical history in MongoDB
    result = await database.medical_history.insert_one(
        new_history
    )

    # Return success response
    return {
        "message": "Medical history added successfully",
        "history_id": str(result.inserted_id)
    }
    
    
    
    
# Get medical history by patient id
@router.get("/patient/{patient_id}")
async def get_medical_history(
    patient_id: str,
    current_user=Depends(verify_token)
):

    # Get medical history
    history = await database.medical_history.find(
        {
            "patient_id": patient_id,
            "created_by": current_user["email"]
        }
    ).to_list(100)

    # Convert ObjectId into string
    for record in history:
        record["_id"] = str(record["_id"])

    # Return medical history
    return history    



# Update medical history
@router.put("/{history_id}")
async def update_medical_history(
    history_id: str,
    history: MedicalHistoryUpdate,
    current_user=Depends(verify_token)
):

    print("History ID:", history_id)
    print("Current User:", current_user)
    # Get updated fields
    updated_data = history.model_dump(exclude_unset=True)

    # Update medical history
    result = await database.medical_history.update_one(
        {
            "_id": ObjectId(history_id),
            "created_by": current_user["email"]
        },
        {
            "$set": updated_data
        }
    )

    # Check if medical history exists
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Medical history not found"
        )

    # Return success message
    return {
        "message": "Medical history updated successfully"
    }



# Delete medical history
@router.delete("/{history_id}")
async def delete_medical_history(
    history_id: str,
    current_user=Depends(verify_token)
):

    # Delete medical history
    result = await database.medical_history.delete_one(
        {
            "_id": ObjectId(history_id),
            "created_by": current_user["email"]
        }
    )

    # Check if medical history exists
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Medical history not found"
        )

    # Return success message
    return {
        "message": "Medical history deleted successfully"
    }