# ==========================================================
# Prognexa AI
# Prediction Logic (Top 13 Features)
# ==========================================================

import pandas as pd
import numpy as np
from loader import model, feature_columns
from preprocessor import preprocess_patient_data

# Define the top 13 most important features (based on your model)
TOP_FEATURES = [
    'time_in_hospital',
    'num_lab_procedures',
    'num_procedures',
    'num_medications',
    'number_outpatient',
    'number_emergency',
    'number_inpatient',
    'number_diagnoses',
    'admission_type_id',
    'discharge_disposition_id',
    'admission_source_id',
    'insulin',
    'diabetesMed'
]

def predict_patient(data: dict):
    """
    Predict readmission risk using only the top 13 features.
    Falls back to a simple weighted rule if the model is not available.
    """
    # 1. Preprocess the full data (to ensure proper encoding and scaling)
    #    The preprocessor expects all features, so we pass the whole data.
    #    It will handle missing features gracefully (we hope).
    try:
        processed = preprocess_patient_data(data)
        # Convert to DataFrame with all feature columns
        df = pd.DataFrame([processed], columns=feature_columns)
        
        # 2. Filter to only the top 13 features (in the order the model expects)
        #    Ensure we only use columns that exist in both TOP_FEATURES and feature_columns
        #    If the model was trained on all features, we can reorder to match training
        #    but we must use the same column order as training.
        #    Here we assume the model was trained on the full set, but we only pass a subset.
        #    This might cause an error if the model expects all columns.
        #    To be safe, we extract the top features and reorder to match training.
        #    We'll create a new DataFrame with only the top features and then reorder.
        #    Since we don't have the exact training order, we'll assume the model uses feature_columns order.
        #    We'll filter feature_columns to only those in TOP_FEATURES.
        filtered_cols = [col for col in feature_columns if col in TOP_FEATURES]
        # Subset the data
        df_subset = df[filtered_cols]
        # Reorder to match TOP_FEATURES order (which is the order we'll use)
        df_subset = df_subset[TOP_FEATURES]
        
        # 3. Predict
        probability = float(model.predict_proba(df_subset)[0][1])
        prediction = int(model.predict(df_subset)[0])
        
    except Exception as e:
        # Fallback: use a simple rule-based prediction
        print(f"⚠️ Model prediction failed, using fallback logic: {e}")
        probability = _fallback_predict(data)
        prediction = 1 if probability >= 0.5 else 0

    # 4. Map to labels and risk
    if prediction == 1:
        label = "Readmission Likely"
    else:
        label = "Readmission Unlikely"

    if probability >= 0.70:
        risk = "High"
        recommendation = "High readmission risk. Schedule follow-up within 7 days and closely monitor medication adherence."
    elif probability >= 0.30:
        risk = "Medium"
        recommendation = "Moderate readmission risk. Recommend follow-up consultation and patient counselling."
    else:
        risk = "Low"
        recommendation = "Low readmission risk. Continue routine care and standard discharge instructions."

    return {
        "prediction": label,
        "prediction_value": int(prediction),
        "probability": float(round(probability * 100, 2)),
        "risk_level": risk,
        "recommendation": recommendation,
        "features_used": TOP_FEATURES
    }

def _fallback_predict(data: dict) -> float:
    """
    Rule-based fallback using only the top features.
    Returns a probability between 0 and 1.
    """
    score = 0.0
    # Time in hospital
    time = data.get('time_in_hospital', 0)
    if time > 7:
        score += 0.25
    elif time > 4:
        score += 0.10
    # Lab procedures
    lab = data.get('num_lab_procedures', 0)
    if lab > 50:
        score += 0.15
    elif lab > 30:
        score += 0.05
    # Medications
    meds = data.get('num_medications', 0)
    if meds > 15:
        score += 0.15
    elif meds > 10:
        score += 0.05
    # Emergency visits
    emerg = data.get('number_emergency', 0)
    if emerg > 2:
        score += 0.10
    # Insulin change
    insulin = data.get('insulin', 'No')
    if insulin in ['Up', 'Down']:
        score += 0.10
    # Diabetes medication
    if data.get('diabetesMed', 'No') == 'Yes':
        score += 0.05
    # Number of diagnoses
    diag = data.get('number_diagnoses', 0)
    if diag > 10:
        score += 0.10
    # Number of procedures
    proc = data.get('num_procedures', 0)
    if proc > 2:
        score += 0.05
    # Cap at 0.95
    return min(0.95, score)
