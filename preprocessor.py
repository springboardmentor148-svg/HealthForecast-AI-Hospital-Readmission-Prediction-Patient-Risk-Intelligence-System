# ==========================================================
# Prognexa AI
# Data Preprocessing
# ==========================================================

import json
import joblib
import numpy as np

from config import FEATURE_PATH, ENCODER_PATH


# ----------------------------------------------------------
# Load Feature Columns
# ----------------------------------------------------------

with open(FEATURE_PATH, "r") as f:
    FEATURE_COLUMNS = json.load(f)

# ----------------------------------------------------------
# Load Label Encoders
# ----------------------------------------------------------

LABEL_ENCODERS = joblib.load(ENCODER_PATH)

print(f"✅ Loaded {len(LABEL_ENCODERS)} Label Encoders")


# ==========================================================
# PREPROCESS PATIENT DATA
# ==========================================================

def preprocess_patient_data(raw_data: dict):

    # -----------------------------------------
    # Initialize all model features
    # -----------------------------------------

    features = {}

    for col in FEATURE_COLUMNS:
        features[col] = 0

    # -----------------------------------------
    # Copy frontend values
    # -----------------------------------------

    for key, value in raw_data.items():

        if key in features:
            features[key] = value

    # -----------------------------------------
    # Feature Engineering
    # -----------------------------------------

    # Senior Citizen

    try:

        age = str(raw_data.get("age", "[60-70)"))

        start_age = int(age.split("-")[0].replace("[", ""))

        features["SeniorCitizen"] = 1 if start_age >= 65 else 0

    except:

        features["SeniorCitizen"] = 0

    # Long Stay

    try:

        stay = int(raw_data.get("time_in_hospital", 0))

        features["LongStay"] = 1 if stay > 7 else 0

    except:

        features["LongStay"] = 0

    # Frequent Visitor

    try:

        outpatient = int(raw_data.get("number_outpatient", 0))

        emergency = int(raw_data.get("number_emergency", 0))

        features["FrequentVisitor"] = 1 if (outpatient + emergency) > 5 else 0

    except:

        features["FrequentVisitor"] = 0

    # -----------------------------------------
    # Encode Categorical Columns
    # -----------------------------------------

    for column, encoder in LABEL_ENCODERS.items():

        if column not in features:
            continue

        value = str(features[column])

        # Unknown category → use first known category

        if value not in encoder.classes_:

            print(
                f"⚠ Unknown value '{value}' for '{column}'. Using '{encoder.classes_[0]}'"
            )

            value = encoder.classes_[0]

        features[column] = int(
            encoder.transform([value])[0]
        )

    # -----------------------------------------
    # Ensure every feature is numeric
    # -----------------------------------------

    final_features = []

    for col in FEATURE_COLUMNS:

        value = features[col]

        if isinstance(value, np.generic):
            value = value.item()

        if isinstance(value, str):
            try:
                value = float(value)
            except:
                value = 0

        final_features.append(value)

    return final_features