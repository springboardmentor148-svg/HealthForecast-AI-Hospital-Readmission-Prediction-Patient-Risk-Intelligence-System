from model_loader import model
from preprocess import preprocess_data


def predict_readmission(patient):

    # Preprocess the input
    processed_data = preprocess_data(patient)

    # Prediction
    prediction = model.predict(processed_data)[0]

    # Prediction probabilities
    probability = model.predict_proba(processed_data)[0]

    probability_not_readmitted = round(float(probability[0]) * 100, 2)
    probability_readmitted = round(float(probability[1]) * 100, 2)

    # Risk Level
    if prediction == 1:
        risk_level = "High Risk"

        if probability_readmitted >= 90:
            confidence = "Very High"

        elif probability_readmitted >= 75:
            confidence = "High"

        else:
            confidence = "Moderate"

        recommendation = [
            "Schedule follow-up within 7 days",
            "Review medications",
            "Monitor blood glucose regularly",
            "Provide discharge counselling",
            "Recommend specialist consultation"
        ]

    else:

        risk_level = "Low Risk"

        if probability_not_readmitted >= 90:
            confidence = "Very High"

        elif probability_not_readmitted >= 75:
            confidence = "High"

        else:
            confidence = "Moderate"

        recommendation = [
            "Continue current treatment",
            "Routine follow-up",
            "Maintain healthy lifestyle",
            "Continue prescribed medications"
        ]

    return {

        "prediction": int(prediction),

        "risk_level": risk_level,

        "probability_readmitted": probability_readmitted,

        "probability_not_readmitted": probability_not_readmitted,

        "confidence": confidence,

        "recommendation": recommendation

    }