from flask import Blueprint, request, jsonify
import numpy as np
from model_loader import load_model

# Load Model
model = load_model()

# Blueprint
predict_bp = Blueprint("predict", __name__)

# ==========================================
# HOME ROUTE
# ==========================================

@predict_bp.route("/")
def home():
    return jsonify({
        "project": "HealthForecastAI",
        "status": "Backend Running Successfully",
        "model": "XGBoost",
        "version": "1.0"
    })

# ==========================================
# PREDICT ROUTE
# ==========================================

@predict_bp.route("/predict", methods=["POST"])
def predict():

    try:
        data = request.get_json()

        if "features" not in data:
            return jsonify({
                "error": "Missing 'features' in request."
            }), 400

        features = np.array(data["features"]).reshape(1, -1)

        prediction = model.predict(features)[0]

        probability = model.predict_proba(features)[0]

        confidence = round(max(probability) * 100, 2)

        result = "Readmission" if prediction == 1 else "No Readmission"

        return jsonify({
            "prediction": int(prediction),
            "result": result,
            "confidence": f"{confidence}%"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500