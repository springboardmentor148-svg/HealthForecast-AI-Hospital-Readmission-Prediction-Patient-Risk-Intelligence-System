# Admission Model
# Creates a hospital admission document before saving it to MongoDB.

# created_by
# Stores the email of the doctor who created the record.

# created_at
# Stores the date and time when the admission record was created.

from datetime import datetime

# Admission Model
class AdmissionModel:

    # Create admission document
    @staticmethod
    def create_admission(
        patient_id,
        admission_date,
        discharge_date,
        admission_reason,
        ward,
        attending_doctor,
        discharge_summary,
        created_by
    ):

        return {
            "patient_id": patient_id,
            "admission_date": admission_date,
            "discharge_date": discharge_date,
            "admission_reason": admission_reason,
            "ward": ward,
            "attending_doctor": attending_doctor,
            "discharge_summary": discharge_summary,
            "created_by": created_by,
            "created_at": datetime.utcnow()
        }