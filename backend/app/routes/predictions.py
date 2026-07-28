
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.patient import Patient
from app.models.prediction import Prediction

from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
)

from app.services.prediction_service import make_prediction

from app.security.jwt import get_current_user


# ============================================================
# PREDICTION ROUTER
# ============================================================

router = APIRouter(
    prefix="/predictions",
    tags=["AI Predictions"],
)


# ============================================================
# TEST ENDPOINT
# ============================================================

@router.get("/test")
def prediction_test():

    return {
        "success": True,
        "message": "Prediction router is working",
        "model": "CatBoost",
    }


# ============================================================
# CREATE AI PREDICTION
# ============================================================

@router.post(
    "/",
    response_model=PredictionResponse,
)
def create_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # --------------------------------------------------------
    # FIND PATIENT
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == request.patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )


    # --------------------------------------------------------
    # PREPARE PATIENT DATA
    # --------------------------------------------------------

    patient_data = {

        "age": request.age,

        "gender": request.gender,

        "race": request.race,

        "medical_history":
            request.medical_history,

        "admission_history":
            request.admission_history,

    }


    # --------------------------------------------------------
    # RUN ML PREDICTION
    # --------------------------------------------------------

    try:

        result = make_prediction(

            patient_data=patient_data,

            db=db,

            current_user=current_user,

        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Prediction failed: {str(e)}"
            ),

        )


    # --------------------------------------------------------
    # SAVE PREDICTION TO DATABASE
    # --------------------------------------------------------

    try:

        new_prediction = Prediction(

            patient_id=request.patient_id,

            prediction=result["prediction"],

            risk_level=result["risk_level"],

            probability=result["probability"],

            model_name=result.get(
                "model",
                "CatBoost"
            ),

        )

        db.add(
            new_prediction
        )

        db.commit()

        db.refresh(
            new_prediction
        )

    except Exception as e:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail=(
                "Prediction generated "
                "but could not be saved: "
                + str(e)
            ),

        )


    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {

        "success": True,

        "patient_id":
            request.patient_id,

        "prediction":
            result["prediction"],

        "risk_level":
            result["risk_level"],

        "probability":
            result["probability"],

        "message":
            "AI prediction generated successfully",

    }


# ============================================================
# GET ALL PREDICTIONS
# ============================================================

@router.get("/")
def get_all_predictions(

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),

):

    predictions = (

        db.query(Prediction)

        .order_by(
            Prediction.created_at.desc()
        )

        .all()

    )


    return {

        "success": True,

        "total":
            len(predictions),

        "predictions": [

            {

                "id":
                    prediction.id,

                "patient_id":
                    prediction.patient_id,

                "prediction":
                    prediction.prediction,

                "risk_level":
                    prediction.risk_level,

                "probability":
                    prediction.probability,

                "model_name":
                    prediction.model_name,

                "created_at":
                    prediction.created_at,

            }

            for prediction
            in predictions

        ],

    }


# ============================================================
# GET PREDICTIONS FOR ONE PATIENT
# ============================================================

@router.get(
    "/patient/{patient_id}"
)
def get_patient_predictions(

    patient_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    ),

):

    # --------------------------------------------------------
    # CHECK PATIENT
    # --------------------------------------------------------

    patient = (

        db.query(Patient)

        .filter(
            Patient.id == patient_id
        )

        .first()

    )


    if not patient:

        raise HTTPException(

            status_code=404,

            detail="Patient not found",

        )


    # --------------------------------------------------------
    # GET PREDICTIONS
    # --------------------------------------------------------

    predictions = (

        db.query(Prediction)

        .filter(

            Prediction.patient_id
            == patient_id

        )

        .order_by(

            Prediction.created_at.desc()

        )

        .all()

    )


    return {

        "success": True,

        "patient_id":
            patient_id,

        "total":
            len(predictions),

        "predictions": [

            {

                "id":
                    prediction.id,

                "prediction":
                    prediction.prediction,

                "risk_level":
                    prediction.risk_level,

                "probability":
                    prediction.probability,

                "model_name":
                    prediction.model_name,

                "created_at":
                    prediction.created_at,

            }

            for prediction
            in predictions

        ],

    }
