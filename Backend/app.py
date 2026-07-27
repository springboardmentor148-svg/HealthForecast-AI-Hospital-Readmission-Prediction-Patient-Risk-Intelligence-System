from flask import Flask, render_template, request
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# ======================================================
# LOAD MODEL & SCALER
# ======================================================

model = joblib.load("../models/stacking_model.pkl")
scaler = joblib.load("../models/scaler.pkl")

# ======================================================
# FEATURE ORDER
# ======================================================

feature_order = [
    "race",
    "gender",
    "age",
    "admission_type_id",
    "discharge_disposition_id",
    "admission_source_id",
    "time_in_hospital",
    "payer_code",
    "medical_specialty",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "diag_1",
    "diag_2",
    "diag_3",
    "number_diagnoses",
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

# ======================================================
# HOME
# ======================================================

@app.route("/")
def home():
    return render_template(
        "index.html",
        features=feature_order
    )

# ======================================================
# PREDICT
# ======================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # Read values from form
        values = []

        for col in feature_order:
            values.append(float(request.form[col]))

        # Convert to DataFrame (keeps feature names)
        features = pd.DataFrame(
            [values],
            columns=feature_order
        )

        # Scale features
        features_scaled = scaler.transform(features)

        # Predict
        prediction = model.predict(features_scaled)

        # Prediction probability
        probability = model.predict_proba(features_scaled)

        confidence = round(np.max(probability) * 100, 2)

        # Result
        if prediction[0] == 1:
            result = "⚠ Patient is likely to be readmitted"
            alert = "danger"
        else:
            result = "✅ Patient is NOT likely to be readmitted"
            alert = "success"

        return render_template(
            "index.html",
            features=feature_order,
            prediction=result,
            confidence=confidence,
            alert=alert
        )

    except Exception as e:

        return render_template(
            "index.html",
            features=feature_order,
            prediction=f"Error: {str(e)}",
            alert="warning",
            confidence=None
        )

# ======================================================
# RUN
# ======================================================

if __name__ == "__main__":
    app.run(debug=True)