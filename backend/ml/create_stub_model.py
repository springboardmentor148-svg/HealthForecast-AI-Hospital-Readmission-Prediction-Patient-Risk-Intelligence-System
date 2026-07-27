"""
Stub XGBoost model generator for development and testing.

Run this script from the `backend/` directory to create a stub
`ml/best_xgboost.pkl` that produces deterministic pseudo-random
predictions based on the input features. This allows the full
prediction pipeline to work without a real trained model.

Usage:
    python ml/create_stub_model.py

The stub model:
- Accepts the same feature vector as the real model (17 features)
- Returns a probability derived from a simple weighted sum (no real ML)
- Is clearly labelled as a stub in its metadata
"""
import os
import sys

# Ensure imports resolve from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np


class StubReadmissionModel:
    """
    A deterministic stub that mimics the XGBoost classifier interface.
    Uses a hand-crafted linear formula instead of a real trained model.
    Useful for local development and UI testing without real ML weights.
    """

    def __init__(self):
        self.model_type = "stub"
        self.classes_ = [0, 1]
        # Feature weights (rough clinical intuition, not real ML)
        self._weights = np.array([
            0.003,   # age
            0.04,    # time_in_hospital
            0.002,   # num_lab_procedures
            0.015,   # num_procedures
            0.008,   # num_medications
            -0.02,   # number_outpatient (more outpatient = lower risk)
            0.05,    # number_emergency
            0.08,    # number_inpatient (previous inpatient = higher risk)
            0.0,     # gender_encoded
            0.0,     # race_encoded
            0.01,    # admission_type_encoded
            0.01,    # discharge_disposition_encoded
            0.01,    # admission_source_encoded
            0.05,    # diabetes_med_encoded
            0.03,    # insulin_encoded
            0.04,    # a1c_result_encoded
            0.04,    # glucose_result_encoded
        ])
        self._bias = -0.5

    def predict_proba(self, X):
        """Return [[prob_class0, prob_class1]] for each row in X."""
        if hasattr(X, "values"):
            X = X.values
        X = np.array(X, dtype=np.float32)
        # Simple sigmoid of weighted sum
        raw = np.dot(X, self._weights) + self._bias
        prob_1 = 1.0 / (1.0 + np.exp(-raw))
        prob_1 = np.clip(prob_1, 0.05, 0.95)
        prob_0 = 1.0 - prob_1
        return np.column_stack([prob_0, prob_1])

    def predict(self, X):
        proba = self.predict_proba(X)
        return (proba[:, 1] >= 0.5).astype(int)


if __name__ == "__main__":
    os.makedirs(os.path.join(os.path.dirname(__file__)), exist_ok=True)
    output_path = os.path.join(os.path.dirname(__file__), "best_xgboost.pkl")

    model = StubReadmissionModel()

    # Quick sanity check
    import pandas as pd
    sample = pd.DataFrame([[65, 5, 40, 2, 15, 0, 1, 2, 1, 0, 0, 0, 0, 1, 2, 2, 1]],
                          columns=[
                              "age", "time_in_hospital", "num_lab_procedures",
                              "num_procedures", "num_medications", "number_outpatient",
                              "number_emergency", "number_inpatient", "gender_encoded",
                              "race_encoded", "admission_type_encoded",
                              "discharge_disposition_encoded", "admission_source_encoded",
                              "diabetes_med_encoded", "insulin_encoded",
                              "a1c_result_encoded", "glucose_result_encoded",
                          ])
    proba = model.predict_proba(sample)
    print(f"Stub model sanity check — readmission probability: {proba[0][1]:.4f}")

    joblib.dump(model, output_path)
    print(f"✅ Stub model saved to: {output_path}")
    print("   Replace with real trained best_xgboost.pkl for production.")
