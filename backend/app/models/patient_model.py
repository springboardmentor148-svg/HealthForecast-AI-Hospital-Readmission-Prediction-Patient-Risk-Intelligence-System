from datetime import datetime

# Patient Model
class PatientModel:

    # Create patient document
    @staticmethod
    def create_patient(
        patient_name,
        age,
        gender,
        diagnosis,
        glucose_level,
        blood_pressure,
        bmi,
        insulin,
        diabetes_med,
        created_by,
        doctor_role
    ):

        return {
            "patient_name": patient_name,
            "age": age,
            "gender": gender,
            "diagnosis": diagnosis,
            "glucose_level": glucose_level,
            "blood_pressure": blood_pressure,
            "bmi": bmi,
            "insulin": insulin,
            "diabetes_med": diabetes_med,
            "created_by": created_by,
            "doctor_role": doctor_role,
            "created_at": datetime.utcnow()
        }