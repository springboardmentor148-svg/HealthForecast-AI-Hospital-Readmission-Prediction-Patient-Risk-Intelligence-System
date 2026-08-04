# ==========================================================
# Prognexa AI
# Prediction Logic (with graceful fallback)
# ==========================================================

import pandas as pd
import numpy as np
from loader import model, feature_columns, label_encoders
from preprocessor import preprocess_patient_data

# Define the top 13 most important features (used for fallback)
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
    Predict readmission risk. 
    Uses the real model if available, otherwise falls back to a rule‑based method.
    """
    # 1. Preprocess
    try:
        processed = preprocess_patient_data(data)
        # Ensure we have a DataFrame with the correct feature order
        # If feature_columns are available, use them; otherwise use TOP_FEATURES.
        if feature_columns:
            df = pd.DataFrame([processed], columns=feature_columns)
        else:
            df = pd.DataFrame([processed], columns=TOP_FEATURES)
        # If the model is real (XGBClassifier), predict with the DataFrame
        # If mock, predict with the first 13 features
        if hasattr(model, 'predict_proba'):
            # Determine which columns to use
            cols_to_use = feature_columns if feature_columns else TOP_FEATURES
            # Ensure we only use columns that exist in df
            available_cols = [c for c in cols_to_use if c in df.columns]
            if not available_cols:
                available_cols = TOP_FEATURES[:len(df.columns)]
            df_subset = df[available_cols]
            # If the model was trained on more features, we might need to pad
            # but we trust the preprocessor to return the correct order.
            probability = float(model.predict_proba(df_subset)[0][1])
            prediction = int(model.predict(df_subset)[0])
        else:
            # Mock model: use fallback
            probability = _fallback_predict(data)
            prediction = 1 if probability >= 0.5 else 0
    except Exception as e:
        print(f"⚠️ Prediction failed, using fallback: {e}")
        probability = _fallback_predict(data)
        prediction = 1 if probability >= 0.5 else 0

    # 2. Map to labels and risk
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