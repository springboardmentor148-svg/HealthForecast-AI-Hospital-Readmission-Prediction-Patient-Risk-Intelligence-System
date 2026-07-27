"""
routes/predict.py
Blueprint handling machine learning inference requests and historical data retrieval.
"""

from flask import Blueprint, request, jsonify
from utils.helpers import token_required, validate_prediction_payload
from utils.preprocess import prepare_patient_features, execution_inference
from models.prediction import PredictionHistory

# Define decoupled route space for prediction logic
predict_bp = Blueprint('predict', __name__)

@predict_bp.route('/predict', methods=['POST'])
@token_required
def predict_readmission(current_user_id):
    """
    POST /predict
    Receives JSON patient metrics, applies preprocessing, runs ML inference, 
    saves the transaction audit, and returns the risk evaluation.
    """
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Bad Request", "message": "Invalid JSON payload format."}), 400
        
    # 1. Validate incoming clinical feature payload
    validation_error = validate_prediction_payload(data)
    if validation_error:
        return jsonify({"error": "Validation Failure", "message": validation_error}), 400
        
    try:
        # 2. Transform the raw payload into a standardized numerical matrix
        scaled_features = prepare_patient_features(data)
        
        # 3. Execute model classification rules
        prediction_label, probability = execution_inference(scaled_features)
        
        # 4. Log the prediction transaction securely to the database
        PredictionHistory.create(
            user_id=current_user_id,
            prediction_label=prediction_label,
            probability=probability,
            input_features=data
        )
        
        # 5. Return structured prediction envelope
        return jsonify({
            "prediction": prediction_label,
            "probability": round(probability, 4)
        }), 200
        
    except FileNotFoundError as e:
        # Graceful handling if .pkl files are missing from the /model directory
        return jsonify({"error": "Model Pipeline Error", "message": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Inference Execution Error", "message": str(e)}), 500


@predict_bp.route('/history', methods=['GET'])
@token_required
def get_prediction_history(current_user_id):
    """
    GET /history
    Retrieves the chronological audit list of previous patient evaluations 
    performed by the currently authenticated user.
    """
    try:
        history_records = PredictionHistory.get_by_user_id(current_user_id)
        
        return jsonify({
            "status": "Success",
            "count": len(history_records),
            "data": history_records
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Database Interface Error", "message": str(e)}), 500