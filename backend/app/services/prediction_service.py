import joblib
from pathlib import Path
import pandas as pd
import numpy as np


# Get backend folder path
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Get models folder path
MODEL_DIR = BASE_DIR.parent / "models"

# Load trained XGBoost model
model = joblib.load(MODEL_DIR / "hospital_readmission_xgboost.pkl")

# Load ordinal encoder
encoder = joblib.load(MODEL_DIR / "ordinal_encoder.pkl")

# Load feature column names
feature_columns = joblib.load(MODEL_DIR / "feature_columns.pkl")

# Load model information
model_info = joblib.load(MODEL_DIR / "model_info.pkl")


# Categorical columns used during model training
categorical_columns = [
    "race",
    "gender",
    "age",
    "diag_1",
    "diag_2",
    "diag_3",
    "metformin",
    "repaglinide",
    "nateglinide",
    "chlorpropamide",
    "glimepiride",
    "acetohexamide",
    "glipizide",
    "glyburide",
    "tolbutamide",
    "pioglitazone",
    "rosiglitazone",
    "acarbose",
    "miglitol",
    "troglitazone",
    "tolazamide",
    "examide",
    "citoglipton",
    "insulin",
    "glyburide-metformin",
    "glipizide-metformin",
    "glimepiride-pioglitazone",
    "metformin-rosiglitazone",
    "metformin-pioglitazone",
    "change",
    "diabetesMed"
]


# Check whether all files are loaded successfully
# print("Model Loaded :", type(model))
# print("Encoder Loaded :", type(encoder))
# print("Total Features :", len(feature_columns))
# print("Model Info :", model_info)



# Predict hospital readmission
def predict_readmission(patient_data):

    # Convert Pydantic model into dictionary
    data = patient_data.model_dump()

    # Rename fields to match training feature names
    data["glyburide-metformin"] = data.pop("glyburide_metformin")
    data["glipizide-metformin"] = data.pop("glipizide_metformin")
    data["glimepiride-pioglitazone"] = data.pop("glimepiride_pioglitazone")
    data["metformin-rosiglitazone"] = data.pop("metformin_rosiglitazone")
    data["metformin-pioglitazone"] = data.pop("metformin_pioglitazone")

    # Create DataFrame with one patient record
    df = pd.DataFrame([data])

    # Arrange columns in the same order used during training
    df = df[feature_columns]

        
    
    # Encode categorical columns
    df[categorical_columns] = encoder.transform(df[categorical_columns])

    # Predict readmission class
    prediction = model.predict(df)[0]

    # Predict probability
    probability = model.predict_proba(df)[0]

    # Convert prediction into readable result
    result = "High Risk (<30 Days)" if prediction == 1 else "Low Risk"

    # Get confidence score
    confidence = float(probability[prediction])

    # Return prediction result
    return {
        "prediction": int(prediction),
        "risk_level": result,
        "confidence": round(confidence * 100, 2),
        "model": model_info["model_name"],
        "accuracy": model_info["accuracy"]
    }


# Return the model's full static performance metrics.
# Uses .get() with a fallback since not every metric may have been
# saved into model_info.pkl during training.
def get_model_info():
    return {
        "model_name": model_info.get("model_name", "Unknown"),
        "accuracy": model_info.get("accuracy", "Not available"),
        "precision": model_info.get("precision", "Not available"),
        "recall": model_info.get("recall", "Not available"),
        "f1_score": model_info.get("f1_score", "Not available"),
        "roc_auc": model_info.get("roc_auc", "Not available"),
    }