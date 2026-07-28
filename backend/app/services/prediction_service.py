import os
import pickle
from typing import Any, Dict

import numpy as np
import pandas as pd

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings


# ============================================================
# ML MODEL PATHS
# ============================================================

MODEL_PATH = settings.MODEL_PATH
PREPROCESSOR_PATH = settings.PREPROCESSOR_PATH
SCALER_PATH = settings.SCALER_PATH
FEATURE_NAMES_PATH = settings.FEATURE_NAMES_PATH


# ============================================================
# LOAD PICKLE FILE
# ============================================================

def load_pickle(path: str, name: str):

    if not path:
        raise FileNotFoundError(
            f"{name} path is empty."
        )

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{name} not found at: {path}"
        )

    with open(path, "rb") as file:
        return pickle.load(file)


# ============================================================
# LOAD ML ARTIFACTS
# ============================================================

model = None
preprocessor = None
scaler = None
feature_names = None


# ------------------------------------------------------------
# LOAD MODEL
# ------------------------------------------------------------

try:

    model = load_pickle(
        MODEL_PATH,
        "ML MODEL"
    )

    print(
        "ML MODEL LOADED SUCCESSFULLY"
    )

except Exception as e:

    print(
        "ERROR loading ML MODEL:"
    )

    print(
        str(e)
    )


# ------------------------------------------------------------
# LOAD PREPROCESSOR
# ------------------------------------------------------------

try:

    preprocessor = load_pickle(
        PREPROCESSOR_PATH,
        "PREPROCESSOR"
    )

    print(
        "PREPROCESSOR LOADED SUCCESSFULLY"
    )

except Exception as e:

    print(
        "ERROR loading PREPROCESSOR:"
    )

    print(
        str(e)
    )


# ------------------------------------------------------------
# LOAD SCALER
# ------------------------------------------------------------

try:

    scaler = load_pickle(
        SCALER_PATH,
        "SCALER"
    )

    print(
        "SCALER LOADED SUCCESSFULLY"
    )

except Exception as e:

    print(
        "ERROR loading SCALER:"
    )

    print(
        str(e)
    )


# ------------------------------------------------------------
# LOAD FEATURE NAMES
# ------------------------------------------------------------

try:

    feature_names = load_pickle(
        FEATURE_NAMES_PATH,
        "FEATURE NAMES"
    )

    print(
        "FEATURE NAMES LOADED SUCCESSFULLY"
    )

except Exception as e:

    print(
        "WARNING: FEATURE NAMES NOT LOADED"
    )

    print(
        str(e)
    )


# ============================================================
# FINAL ML STATUS
# ============================================================

print(
    "============================================================"
)

print(
    "HEALTHFORECAST AI - ML STATUS"
)

print(
    "============================================================"
)

print(
    "Model:",
    "LOADED"
    if model is not None
    else "NOT LOADED"
)

print(
    "Preprocessor:",
    "LOADED"
    if preprocessor is not None
    else "NOT LOADED"
)

print(
    "Scaler:",
    "LOADED"
    if scaler is not None
    else "NOT LOADED"
)

print(
    "Feature Names:",
    "LOADED"
    if feature_names is not None
    else "NOT LOADED"
)

print(
    "============================================================"
)


# ============================================================
# CONVERT INPUT TO DICTIONARY
# ============================================================

def convert_to_dict(
    patient_data: Any
) -> Dict[str, Any]:

    # Pydantic v2
    if hasattr(
        patient_data,
        "model_dump"
    ):

        return patient_data.model_dump()


    # Pydantic v1
    if hasattr(
        patient_data,
        "dict"
    ):

        return patient_data.dict()


    # Normal dictionary
    if isinstance(
        patient_data,
        dict
    ):

        return patient_data


    raise ValueError(
        "Invalid patient data format."
    )


# ============================================================
# CREATE ML INPUT DATAFRAME
# ============================================================

def prepare_ml_dataframe(
    patient_data: Any
) -> pd.DataFrame:

    data = convert_to_dict(
        patient_data
    )


    # --------------------------------------------------------
    # BASIC PATIENT INFORMATION
    # --------------------------------------------------------

    age = data.get(
        "age",
        50
    )

    gender = data.get(
        "gender",
        "Unknown"
    )

    race = data.get(
        "race",
        "Unknown"
    )

    medical_history = data.get(
        "medical_history",
        ""
    )

    admission_history = data.get(
        "admission_history",
        ""
    )


    # --------------------------------------------------------
    # CREATE DATASET-COMPATIBLE INPUT
    # --------------------------------------------------------

    ml_data = {

        # ----------------------------------------------------
        # DEMOGRAPHIC FEATURES
        # ----------------------------------------------------

        "race": race,

        "gender": gender,

        "age": str(
            age
        ),


        # ----------------------------------------------------
        # HOSPITAL ADMISSION FEATURES
        # ----------------------------------------------------

        "admission_type_id": 1,

        "discharge_disposition_id": 1,

        "admission_source_id": 1,

        "time_in_hospital": 3,


        # ----------------------------------------------------
        # MEDICAL PROCEDURE FEATURES
        # ----------------------------------------------------

        "num_lab_procedures": 40,

        "num_procedures": 1,

        "num_medications": 5,

        "number_outpatient": 0,

        "number_emergency": 0,

        "number_inpatient": 0,

        "number_diagnoses": 3,


        # ----------------------------------------------------
        # DIAGNOSIS FEATURES
        # ----------------------------------------------------

        "diag_1": "250.00",

        "diag_2": "401.9",

        "diag_3": "250.00",


        # ----------------------------------------------------
        # GLUCOSE FEATURES
        # ----------------------------------------------------

        "max_glu_serum": "None",

        "A1Cresult": "None",


        # ----------------------------------------------------
        # DIABETES MEDICATION FEATURES
        # ----------------------------------------------------

        "metformin": "No",

        "repaglinide": "No",

        "nateglinide": "No",

        "chlorpropamide": "No",

        "glimepiride": "No",

        "acetohexamide": "No",

        "glipizide": "No",

        "glyburide": "No",

        "tolbutamide": "No",

        "pioglitazone": "No",

        "rosiglitazone": "No",

        "acarbose": "No",

        "miglitol": "No",

        "troglitazone": "No",

        "tolazamide": "No",

        "examide": "No",

        "citoglipton": "No",

        "insulin": "No",

        "glyburide-metformin": "No",

        "glipizide-metformin": "No",

        "glimepiride-pioglitazone": "No",

        "metformin-rosiglitazone": "No",

        "metformin-pioglitazone": "No",


        # ----------------------------------------------------
        # DIABETES MEDICATION CHANGE
        # ----------------------------------------------------

        "change": "No",

        "diabetesMed": "No",

    }


    # ========================================================
    # ANALYZE MEDICAL HISTORY
    # ========================================================

    history_text = (

        str(
            medical_history
        )

        + " "

        + str(
            admission_history
        )

    ).lower()


    # --------------------------------------------------------
    # DETECT DIABETES
    # --------------------------------------------------------

    if (

        "diabetes"
        in history_text

        or

        "diabetic"
        in history_text

    ):

        ml_data[
            "diabetesMed"
        ] = "Yes"


    # --------------------------------------------------------
    # DETECT INSULIN
    # --------------------------------------------------------

    if (

        "insulin"
        in history_text

    ):

        ml_data[
            "insulin"
        ] = "Yes"


    # --------------------------------------------------------
    # DETECT HYPERTENSION
    # --------------------------------------------------------

    if (

        "hypertension"
        in history_text

        or

        "high blood pressure"
        in history_text

    ):

        ml_data[
            "number_diagnoses"
        ] = 4


    # ========================================================
    # CONVERT TO DATAFRAME
    # ========================================================

    df = pd.DataFrame(
        [ml_data]
    )


    return df


# ============================================================
# ALIGN DATAFRAME WITH PREPROCESSOR
# ============================================================

def align_with_preprocessor(
    df: pd.DataFrame
) -> pd.DataFrame:

    if preprocessor is None:

        raise RuntimeError(
            "ML preprocessor is not loaded."
        )


    # --------------------------------------------------------
    # GET EXPECTED COLUMNS
    # --------------------------------------------------------

    expected_columns = None


    # --------------------------------------------------------
    # USE PREPROCESSOR FEATURE NAMES
    # --------------------------------------------------------

    if hasattr(
        preprocessor,
        "feature_names_in_"
    ):

        expected_columns = list(

            preprocessor.feature_names_in_

        )


    # --------------------------------------------------------
    # FALLBACK TO FEATURE NAMES FILE
    # --------------------------------------------------------

    if (

        expected_columns is None

        and

        feature_names is not None

    ):

        try:

            expected_columns = list(
                feature_names
            )

        except Exception:

            expected_columns = None


    # --------------------------------------------------------
    # ALIGN COLUMNS
    # --------------------------------------------------------

    if expected_columns is not None:

        # Add missing columns
        for column in expected_columns:

            if column not in df.columns:

                df[column] = np.nan


        # Keep only expected columns
        df = df[
            expected_columns
        ]


    return df


# ============================================================
# TRANSFORM INPUT
# ============================================================

def transform_input(
    df: pd.DataFrame
):

    if preprocessor is None:

        raise RuntimeError(
            "ML preprocessor is not loaded."
        )


    # --------------------------------------------------------
    # ALIGN DATAFRAME
    # --------------------------------------------------------

    df = align_with_preprocessor(
        df
    )


    # --------------------------------------------------------
    # APPLY PREPROCESSOR
    # --------------------------------------------------------

    transformed_data = (

        preprocessor.transform(
            df
        )

    )


    # --------------------------------------------------------
    # CONVERT SPARSE MATRIX
    # --------------------------------------------------------

    if hasattr(
        transformed_data,
        "toarray"
    ):

        transformed_data = (

            transformed_data.toarray()

        )


    transformed_data = np.asarray(

        transformed_data

    )


    # --------------------------------------------------------
    # APPLY SCALER
    # --------------------------------------------------------

    if scaler is not None:

        transformed_data = (

            scaler.transform(
                transformed_data
            )

        )


    return transformed_data


# ============================================================
# GENERATE PREDICTION
# ============================================================

def generate_prediction(
    patient_data: Any
) -> Dict[str, Any]:

    # ========================================================
    # CHECK MODEL
    # ========================================================

    if model is None:

        raise RuntimeError(
            "ML model is not loaded."
        )


    # ========================================================
    # PREPARE ML DATAFRAME
    # ========================================================

    df = prepare_ml_dataframe(
        patient_data
    )


    print(
        "ML INPUT COLUMNS:",
        list(
            df.columns
        )
    )


    # ========================================================
    # TRANSFORM INPUT
    # ========================================================

    X = transform_input(
        df
    )


    print(
        "TRANSFORMED ML INPUT SHAPE:",
        X.shape
    )


    # ========================================================
    # CATBOOST PREDICTION
    # ========================================================

    prediction = model.predict(
        X
    )


    prediction_value = int(
        prediction[0]
    )


    # ========================================================
    # DETERMINE RISK LEVEL
    # ========================================================

    if prediction_value == 1:

        risk_level = (
            "High Risk"
        )

    else:

        risk_level = (
            "Low Risk"
        )


    # ========================================================
    # GET PREDICTION PROBABILITY
    # ========================================================

    probability = None


    if hasattr(
        model,
        "predict_proba"
    ):

        probabilities = (

            model.predict_proba(
                X
            )

        )


        if (

            probabilities.ndim == 2

            and

            probabilities.shape[1] > 1

        ):

            probability = float(

                probabilities[0][1]

            )


    # ========================================================
    # AI CARE RECOMMENDATIONS
    # ========================================================

    if risk_level == "High Risk":

        recommendations = [

            "Schedule a follow-up consultation within 7 days.",

            "Monitor blood glucose levels regularly.",

            "Review medication adherence and effectiveness.",

            "Monitor blood pressure and other vital signs.",

            "Review the patient's recent admission history.",

            "Consider additional clinical evaluation if symptoms worsen.",

        ]

        follow_up_plan = (

            "Follow-up required within 7 days."

        )

        priority = "High"


    else:

        recommendations = [

            "Continue regular medical follow-up.",

            "Maintain prescribed medication adherence.",

            "Monitor blood glucose levels regularly.",

            "Maintain a healthy diet and lifestyle.",

            "Continue routine diabetes management.",

        ]

        follow_up_plan = (

            "Routine follow-up recommended."

        )

        priority = "Low"


    # ========================================================
    # FINAL PREDICTION RESULT
    # ========================================================

    return {

        "prediction":
            prediction_value,

        "risk_level":
            risk_level,

        "probability":
            probability,

        "model":
            "CatBoost",

        "model_name":
            "CatBoost",

        "recommendations":
            recommendations,

        "follow_up_plan":
            follow_up_plan,

        "priority":
            priority,

    }


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def make_prediction(
    patient_data: Any,
    db: Session = None,
    current_user: Any = None,
) -> Dict[str, Any]:

    try:

        # ----------------------------------------------------
        # GENERATE ML PREDICTION
        # ----------------------------------------------------

        result = generate_prediction(
            patient_data
        )


        # ----------------------------------------------------
        # LOG PREDICTION RESULT
        # ----------------------------------------------------

        print(
            "============================================================"
        )

        print(
            "HEALTHFORECAST AI - PREDICTION RESULT"
        )

        print(
            "============================================================"
        )

        print(
            "Prediction:",
            result.get(
                "prediction"
            )
        )

        print(
            "Risk Level:",
            result.get(
                "risk_level"
            )
        )

        print(
            "Probability:",
            result.get(
                "probability"
            )
        )

        print(
            "Model:",
            result.get(
                "model_name"
            )
        )

        print(
            "Priority:",
            result.get(
                "priority"
            )
        )

        print(
            "Follow-up:",
            result.get(
                "follow_up_plan"
            )
        )

        print(
            "============================================================"
        )


        return result


    except HTTPException:

        raise


    except Exception as e:

        print(
            "PREDICTION ERROR:",
            str(e)
        )


        raise HTTPException(

            status_code=500,

            detail=(

                "Error while generating "
                "patient risk prediction: "
                + str(e)

            )

        )