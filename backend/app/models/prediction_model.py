from datetime import datetime

# Prediction Model
class PredictionModel:

    # Create prediction document
    @staticmethod
    def create_prediction(
        doctor_email,
        patient_id,
        patient_data,
        result
    ):

        return {
            "doctor_email": doctor_email,
            "patient_id": patient_id,
            "patient_data": patient_data,
            "result": result,
            "created_at": datetime.utcnow()
        }