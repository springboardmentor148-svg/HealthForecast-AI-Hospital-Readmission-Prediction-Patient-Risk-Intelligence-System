# ==========================================================
# Prognexa AI
# Load ML Resources (with graceful fallback)
# ==========================================================

import json
import joblib
import numpy as np
from xgboost import XGBClassifier

from config import (
    MODEL_PATH,
    FEATURE_PATH,
    ENCODER_PATH
)

# ----------------------------------------------------------
# Try to load model, features, and encoders
# ----------------------------------------------------------

model = None
feature_columns = []
label_encoders = {}

try:
    print("Loading XGBoost Model...")
    model = XGBClassifier()
    model.load_model(MODEL_PATH)
    print("✅ Model Loaded")
except Exception as e:
    print(f"⚠️ Could not load model: {e}")
    model = None

try:
    print("Loading Feature Columns...")
    with open(FEATURE_PATH, "r") as file:
        feature_columns = json.load(file)
    print(f"✅ {len(feature_columns)} Features Loaded")
except Exception as e:
    print(f"⚠️ Could not load feature columns: {e}")
    feature_columns = [
        'time_in_hospital', 'num_lab_procedures', 'num_procedures',
        'num_medications', 'number_outpatient', 'number_emergency',
        'number_inpatient', 'number_diagnoses', 'admission_type_id',
        'discharge_disposition_id', 'admission_source_id',
        'insulin', 'diabetesMed'
    ]

try:
    print("Loading Label Encoders...")
    label_encoders = joblib.load(ENCODER_PATH)
    if not isinstance(label_encoders, dict):
        raise TypeError(f"Expected dict, got {type(label_encoders)}")
    print(f"✅ {len(label_encoders)} Encoders Loaded")
except Exception as e:
    print(f"⚠️ Could not load label encoders: {e}")
    label_encoders = {}

# ----------------------------------------------------------
# If any component failed, use a mock model
# ----------------------------------------------------------

if model is None or not feature_columns or not label_encoders:
    print("🔄 Using mock model (real model files not available)")

    class MockModel:
        def predict_proba(self, X):
            # Return random probabilities for demonstration
            return np.random.rand(len(X), 2)
        def predict(self, X):
            return np.random.randint(0, 2, len(X))

    model = MockModel()
    # Ensure we have at least some feature columns
    if not feature_columns:
        feature_columns = [
            'time_in_hospital', 'num_lab_procedures', 'num_procedures',
            'num_medications', 'number_outpatient', 'number_emergency',
            'number_inpatient', 'number_diagnoses', 'admission_type_id',
            'discharge_disposition_id', 'admission_source_id'
        ]
    # Empty label_encoders is fine – preprocessor will skip encoding