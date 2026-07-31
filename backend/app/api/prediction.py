from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.schemas.prediction_schema import PredictionRequest
from app.services.prediction_service import predict_readmission, get_model_info
from app.services.clinical_decision_service import generate_recommendations
from app.utils.jwt_handler import verify_token
from app.database.database import database
from app.models.prediction_model import PredictionModel


# Prediction router
router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"]
)


# Predict hospital readmission
@router.post("/predict")
async def predict(
    patient_data: PredictionRequest,
    payload: dict = Depends(verify_token)
):
    try:
        result = predict_readmission(patient_data)

        # Generate clinical decision support recommendations based on
        # the risk result and relevant patient factors
        recommendations = generate_recommendations(
            patient_data.model_dump(),
            result
        )
        result["recommendations"] = recommendations

        # Save this prediction to history, tied to the logged-in doctor
        prediction_data = PredictionModel.create_prediction(
            doctor_email=payload["sub"],
            patient_id=patient_data.patient_id,
            patient_data=patient_data.model_dump(),
            result=result
        )
        await database.predictions.insert_one(prediction_data)

        # If this prediction is linked to an existing patient, update
        # that patient's record with their latest risk result — this is
        # what makes "high-risk patient identification" visible on the
        # Patients page itself, not just buried in prediction history.
        if patient_data.patient_id:
            await database.patients.update_one(
                {
                    "_id": ObjectId(patient_data.patient_id),
                    "created_by": payload["sub"]
                },
                {
                    "$set": {
                        "latest_risk_level": result["risk_level"],
                        "latest_confidence": result["confidence"],
                        "last_predicted_at": datetime.utcnow()
                    }
                }
            )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# Get logged-in doctor's prediction history
@router.get("/history")
async def get_prediction_history(payload: dict = Depends(verify_token)):

    # Fetch this doctor's predictions, most recent first
    # _id excluded via projection since ObjectId isn't JSON serializable
    records = await database.predictions.find(
        {"doctor_email": payload["sub"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=None)

    return records


# Get static model performance metrics (accuracy, precision, recall, etc.)
@router.get("/model-info")
async def get_model_performance(payload: dict = Depends(verify_token)):
    return get_model_info()