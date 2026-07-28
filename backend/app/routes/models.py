from fastapi import APIRouter, Depends
from app.security.jwt import get_current_user

from app.services.prediction_service import (
    model,
    preprocessor,
    scaler,
    feature_names,
)


router = APIRouter(
    prefix="/models",
    tags=["Model Insights"],
)


@router.get("/insights")
def get_model_insights(
    current_user=Depends(get_current_user),
):

    # ========================================================
    # MODEL STATUS
    # ========================================================

    model_loaded = model is not None

    preprocessor_loaded = (
        preprocessor is not None
    )

    scaler_loaded = (
        scaler is not None
    )


    # ========================================================
    # FEATURE INFORMATION
    # ========================================================

    feature_count = 0
    feature_list = []


    if feature_names is not None:

        try:

            feature_list = list(
                feature_names
            )

            feature_count = len(
                feature_list
            )

        except Exception:

            feature_list = []

            feature_count = 0


    # ========================================================
    # MODEL TYPE
    # ========================================================

    if model is not None:

        model_type = type(
            model
        ).__name__

    else:

        model_type = (
            "CatBoostClassifier"
        )


    # ========================================================
    # MODEL CLASSES
    # ========================================================

    classes = []


    if model is not None:

        try:

            if hasattr(
                model,
                "classes_"
            ):

                classes = [

                    int(value)

                    for value

                    in model.classes_

                ]

        except Exception:

            classes = []


    # ========================================================
    # PROBABILITY SUPPORT
    # ========================================================

    probability_support = False


    if model is not None:

        probability_support = hasattr(
            model,
            "predict_proba"
        )


    # ========================================================
    # RETURN RESPONSE
    # ========================================================

    return {

        "success": True,

        "model_name":
            "CatBoost",

        "model_type":
            model_type,

        "status": (

            "Loaded"

            if model_loaded

            else "Not Loaded"

        ),

        "prediction_type":
            "Binary Classification",

        "feature_count":
            feature_count,

        "features":
            feature_list,

        "classes":
            classes,

        "probability_support":
            probability_support,

        "preprocessor_status": (

            "Loaded"

            if preprocessor_loaded

            else "Not Loaded"

        ),

        "scaler_status": (

            "Loaded"

            if scaler_loaded

            else "Not Loaded"

        ),

    }