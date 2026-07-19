# ==========================================================
# Prognexa AI
# Load ML Resources
# ==========================================================

import json
import joblib

from xgboost import XGBClassifier

from config import (
    MODEL_PATH,
    FEATURE_PATH,
    ENCODER_PATH
)

print("Loading XGBoost Model...")

model = XGBClassifier()
model.load_model(MODEL_PATH)

print("✅ Model Loaded")

print("Loading Feature Columns...")

with open(FEATURE_PATH, "r") as file:
    feature_columns = json.load(file)

print(f"✅ {len(feature_columns)} Features Loaded")

print("Loading Label Encoders...")

label_encoders = joblib.load(ENCODER_PATH)

if not isinstance(label_encoders, dict):
    raise TypeError(
        f"Expected dict but got {type(label_encoders)}"
    )

print(f"✅ {len(label_encoders)} Encoders Loaded")