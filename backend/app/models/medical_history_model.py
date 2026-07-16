from datetime import datetime

# Medical History Model
class MedicalHistoryModel:

    # Create medical history document
    @staticmethod
    def create_history(
        patient_id,
        disease,
        treatment,
        medication,
        admission_date,
        discharge_date,
        notes,
        created_by
    ):

        return {
            "patient_id": patient_id,
            "disease": disease,
            "treatment": treatment,
            "medication": medication,
            "admission_date": admission_date,
            "discharge_date": discharge_date,
            "notes": notes,
            "created_by": created_by,
            "created_at": datetime.utcnow()
        }