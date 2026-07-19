# ==========================================================
# Prognexa AI
# Prediction Logic
# ==========================================================

import pandas as pd

from loader import model, feature_columns
from preprocessor import preprocess_patient_data


def predict_patient(data):

    # preprocess patient
    processed = preprocess_patient_data(data)

    df = pd.DataFrame(
        [processed],
        columns=feature_columns
    )

    # prediction
    probability = float(model.predict_proba(df)[0][1])
    prediction = int(model.predict(df)[0])

    # label
    if prediction == 1:
        label = "Readmission Likely"
    else:
        label = "Readmission Unlikely"

    # risk
    if probability >= 0.70:

        risk = "High"

        recommendation = (
            "High readmission risk. Schedule follow-up within 7 days and closely monitor medication adherence."
        )

    elif probability >= 0.30:

        risk = "Medium"

        recommendation = (
            "Moderate readmission risk. Recommend follow-up consultation and patient counselling."
        )

    else:

        risk = "Low"

        recommendation = (
            "Low readmission risk. Continue routine care and standard discharge instructions."
        )

    return {
        "prediction": str(label),
        "prediction_value": int(prediction),
        "probability": float(round(probability * 100, 2)),
        "risk_level": str(risk),
        "recommendation": str(recommendation)
    }