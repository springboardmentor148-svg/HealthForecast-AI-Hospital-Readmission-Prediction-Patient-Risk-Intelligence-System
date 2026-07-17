from datetime import datetime

# Treatment Model
class TreatmentModel:

    # Create treatment document
    @staticmethod
    def create_treatment(
        patient_id,
        treatment_name,
        medication,
        dosage,
        start_date,
        end_date,
        status,
        doctor_notes,
        created_by
    ):

        return {
            "patient_id": patient_id,
            "treatment_name": treatment_name,
            "medication": medication,
            "dosage": dosage,
            "start_date": start_date,
            "end_date": end_date,
            "status": status,
            "doctor_notes": doctor_notes,
            "created_by": created_by,
            "created_at": datetime.utcnow()
        }