import subprocess
import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
import numpy as np
from model_loader import load_model

# Load Model
model = load_model()

# Blueprint
predict_bp = Blueprint("predict", __name__)

# Training script isi file ke sath sath hai (backend root = WORKDIR)
BACKEND_ROOT = Path(__file__).resolve().parent
TRAINING_SCRIPT = BACKEND_ROOT / "model_training.py"

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
        readmission_probability = round(probability[1] * 100, 2)  # index 1 = "Readmission" class ka chance

        result = "Readmission" if prediction == 1 else "No Readmission"

        return jsonify({
            "prediction": int(prediction),
            "result": result,
            "confidence": f"{confidence}%",
            "readmissionProbability": f"{readmission_probability}%"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ==========================================
# TRAIN ROUTE (retraining trigger)
# ==========================================

@predict_bp.route("/train", methods=["POST"])
def train():
    global model

    if not TRAINING_SCRIPT.exists():
        return jsonify({
            "success": False,
            "error": f"Training script not found at {TRAINING_SCRIPT}"
        }), 404

    try:
        result = subprocess.run(
            [sys.executable, str(TRAINING_SCRIPT)],
            cwd="/",
            capture_output=True,
            text=True,
            timeout=1800,
        )
    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "error": "Training timed out (30 min limit)"
        }), 504

    if result.returncode != 0:
        return jsonify({
            "success": False,
            "error": result.stderr[-2000:]
        }), 500

    # Retrained model ko turant reload karo taaki naya model
    # agli /predict call se hi use ho, container restart ki zaroorat na ho
    model = load_model()

    return jsonify({
        "success": True,
        "output": result.stdout
    })