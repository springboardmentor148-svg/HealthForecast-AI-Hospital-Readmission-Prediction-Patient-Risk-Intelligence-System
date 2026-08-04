# ==========================================================
# Prognexa AI
# Data Preprocessing (with fallback)
# ==========================================================

import json
import joblib
import numpy as np

from config import FEATURE_PATH, ENCODER_PATH

# ----------------------------------------------------------
# Load Feature Columns (with fallback)
# ----------------------------------------------------------

try:
    with open(FEATURE_PATH, "r") as f:
        FEATURE_COLUMNS = json.load(f)
    print(f"✅ Loaded {len(FEATURE_COLUMNS)} feature columns")
except Exception as e:
    print(f"⚠️ Could not load feature columns: {e}")
    FEATURE_COLUMNS = [
        'time_in_hospital', 'num_lab_procedures', 'num_procedures',
        'num_medications', 'number_outpatient', 'number_emergency',
        'number_inpatient', 'number_diagnoses', 'admission_type_id',
        'discharge_disposition_id', 'admission_source_id',
        'insulin', 'diabetesMed'
    ]

# ----------------------------------------------------------
# Load Label Encoders (with fallback)
# ----------------------------------------------------------

LABEL_ENCODERS = {}

try:
    LABEL_ENCODERS = joblib.load(ENCODER_PATH)
    if not isinstance(LABEL_ENCODERS, dict):
        raise TypeError(f"Expected dict, got {type(LABEL_ENCODERS)}")
    print(f"✅ Loaded {len(LABEL_ENCODERS)} Label Encoders")
except Exception as e:
    print(f"⚠️ Could not load label encoders: {e}")
    print("🔄 Using fallback: no encoding (will pass raw values)")

# ==========================================================
# PREPROCESS PATIENT DATA
# ==========================================================

def preprocess_patient_data(raw_data: dict):
    """
    Preprocess raw patient data.
    If encoders are missing, it simply returns a vector of raw numeric values.
    """
    # -----------------------------------------
    # Initialize all feature columns with 0
    # -----------------------------------------

    features = {col: 0 for col in FEATURE_COLUMNS}

    # -----------------------------------------
    # Copy values from raw_data
    # -----------------------------------------

    for key, value in raw_data.items():
        if key in features:
            features[key] = value

    # -----------------------------------------
    # Feature Engineering (SeniorCitizen, LongStay, FrequentVisitor)
    # -----------------------------------------

    try:
        age = str(raw_data.get("age", "[60-70)"))
        start_age = int(age.split("-")[0].replace("[", ""))
        features["SeniorCitizen"] = 1 if start_age >= 65 else 0
    except:
        features["SeniorCitizen"] = 0

    try:
        stay = int(raw_data.get("time_in_hospital", 0))
        features["LongStay"] = 1 if stay > 7 else 0
    except:
        features["LongStay"] = 0

    try:
        outpatient = int(raw_data.get("number_outpatient", 0))
        emergency = int(raw_data.get("number_emergency", 0))
        features["FrequentVisitor"] = 1 if (outpatient + emergency) > 5 else 0
    except:
        features["FrequentVisitor"] = 0

    # -----------------------------------------
    # Encode categorical columns if encoders available
    # -----------------------------------------

    if LABEL_ENCODERS:
        for column, encoder in LABEL_ENCODERS.items():
            if column not in features:
                continue
            value = str(features[column])
            # Unknown category → use first known
            if value not in encoder.classes_:
                print(f"⚠ Unknown value '{value}' for '{column}'. Using '{encoder.classes_[0]}'")
                value = encoder.classes_[0]
            features[column] = int(encoder.transform([value])[0])
    else:
        # No encoders: convert everything to float if possible, else 0
        for col in FEATURE_COLUMNS:
            if col in features:
                val = features[col]
                try:
                    features[col] = float(val)
                except (ValueError, TypeError):
                    features[col] = 0.0

    # -----------------------------------------
    # Build final feature vector
    # -----------------------------------------

    final_features = []
    for col in FEATURE_COLUMNS:
        value = features.get(col, 0)
        if isinstance(value, np.generic):
            value = value.item()
        if isinstance(value, str):
            try:
                value = float(value)
            except:
                value = 0.0
        final_features.append(float(value))

    return final_features