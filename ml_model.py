import joblib
import pandas as pd

# Load the trained model and label encoders once, when the server starts
model = joblib.load("readmission_model.pkl")
label_encoders = joblib.load("label_encoders.pkl")

# These are the exact 45 feature columns the model was trained on, in order.
# Fields not asked from the user default to a "typical" value so the form stays short.
FEATURE_COLUMNS = [
    "race", "gender", "age", "admission_type_id", "discharge_disposition_id",
    "admission_source_id", "time_in_hospital", "medical_specialty",
    "num_lab_procedures", "num_procedures", "num_medications",
    "number_outpatient", "number_emergency", "number_inpatient",
    "diag_1", "diag_2", "diag_3", "number_diagnoses",
    "max_glu_serum", "A1Cresult", "metformin", "repaglinide", "nateglinide",
    "chlorpropamide", "glimepiride", "acetohexamide", "glipizide", "glyburide",
    "tolbutamide", "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
    "troglitazone", "tolazamide", "examide", "citoglipton", "insulin",
    "glyburide-metformin", "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone", "change", "diabetesMed"
]

# Sensible defaults for fields we won't ask the user about directly.
# "No"/"Steady"/0 style defaults for medications, since most patients don't take most drugs.
DEFAULT_VALUES = {
    "admission_type_id": 1,
    "discharge_disposition_id": 1,
    "admission_source_id": 7,
    "medical_specialty": "Unknown",
    "num_lab_procedures": 45,
    "num_procedures": 1,
    "number_outpatient": 0,
    "number_emergency": 0,
    "number_inpatient": 0,
    "diag_1": "Unknown",
    "diag_2": "Unknown",
    "diag_3": "Unknown",
    "number_diagnoses": 7,
    "max_glu_serum": "None",
    "A1Cresult": "None",
    "metformin": "No",
    "repaglinide": "No",
    "nateglinide": "No",
    "chlorpropamide": "No",
    "glimepiride": "No",
    "acetohexamide": "No",
    "glipizide": "No",
    "glyburide": "No",
    "tolbutamide": "No",
    "pioglitazone": "No",
    "rosiglitazone": "No",
    "acarbose": "No",
    "miglitol": "No",
    "troglitazone": "No",
    "tolazamide": "No",
    "examide": "No",
    "citoglipton": "No",
    "glyburide-metformin": "No",
    "glipizide-metformin": "No",
    "glimepiride-pioglitazone": "No",
    "metformin-rosiglitazone": "No",
    "metformin-pioglitazone": "No",
    "diabetesMed": "Yes",
}


def encode_value(column: str, value):
    """Convert a raw text value into the number the model expects, using the saved encoder.
    Falls back to a known class if the value wasn't seen during training."""
    if column in label_encoders:
        encoder = label_encoders[column]
        if value in encoder.classes_:
            return int(encoder.transform([value])[0])
        else:
            # Unknown category (e.g. missing test result) - fall back to first known class
            return int(encoder.transform([encoder.classes_[0]])[0])
    return value


def predict_readmission(patient_input: dict):
    """
    patient_input: a dict with the fields the user actually filled in
    (race, gender, age, time_in_hospital, num_medications, insulin, change).
    Missing fields are filled with DEFAULT_VALUES.
    """
    row = {}
    for col in FEATURE_COLUMNS:
        if col in patient_input:
            raw_value = patient_input[col]
        else:
            raw_value = DEFAULT_VALUES.get(col, 0)

        if col in label_encoders:
            row[col] = encode_value(col, raw_value)
        else:
            row[col] = raw_value

    df_row = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    probability = float(model.predict_proba(df_row)[0][1])

    if probability >= 0.7:
        risk_category = "High"
    elif probability >= 0.4:
        risk_category = "Medium"
    else:
        risk_category = "Low"

    return {
        "readmission_probability": round(probability, 4),
        "risk_category": risk_category
    }
