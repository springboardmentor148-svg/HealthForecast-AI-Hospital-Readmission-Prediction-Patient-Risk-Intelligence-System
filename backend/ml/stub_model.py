"""
Stub XGBoost-compatible model for development/testing.

This class must live in the ml package (not __main__) so that joblib
can correctly unpickle it across different execution contexts.

IMPORTANT: Replace best_xgboost.pkl with the real trained model for production.
"""
import numpy as np


class StubReadmissionModel:
    """
    Deterministic stub that mimics an XGBoost binary classifier.
    Uses a simple weighted heuristic based on clinical risk factors
    so predictions are realistic and vary meaningfully with input.
    
    Output matches the sklearn predict_proba interface:
      [[prob_no_readmission, prob_readmission], ...]
    """

    def predict_proba(self, X) -> np.ndarray:
        """Return [[1-p, p]] where p is a heuristic readmission probability."""
        results = []
        for _, row in X.iterrows():
            p = self._score(row)
            results.append([1.0 - p, p])
        return np.array(results, dtype=np.float32)

    def predict(self, X) -> np.ndarray:
        probas = self.predict_proba(X)
        return (probas[:, 1] >= 0.5).astype(int)

    @staticmethod
    def _score(row) -> float:
        """
        Heuristic risk scoring based on known clinical readmission risk factors.
        Returns probability in [0.05, 0.95].
        """
        score = 0.0

        # Age risk (older = higher risk)
        age = float(row.get("age", 50) or 50)
        if age >= 80:
            score += 0.20
        elif age >= 65:
            score += 0.12
        elif age >= 50:
            score += 0.06

        # Time in hospital (longer stay = higher risk)
        tih = float(row.get("time_in_hospital", 4) or 4)
        if tih >= 10:
            score += 0.18
        elif tih >= 7:
            score += 0.10
        elif tih >= 4:
            score += 0.05

        # Emergency / prior inpatient admissions
        inpatient = float(row.get("number_inpatient", 0) or 0)
        emergency = float(row.get("number_emergency", 0) or 0)
        score += min(inpatient * 0.07, 0.20)
        score += min(emergency * 0.05, 0.15)

        # Medications (polypharmacy)
        meds = float(row.get("num_medications", 0) or 0)
        if meds >= 20:
            score += 0.10
        elif meds >= 10:
            score += 0.05

        # Diabetes/glucose risk
        a1c = float(row.get("a1c_result_encoded", 0) or 0)
        glucose = float(row.get("glucose_result_encoded", 0) or 0)
        if a1c >= 3:   # >8
            score += 0.10
        elif a1c >= 2: # >7
            score += 0.05
        if glucose >= 2:  # >200
            score += 0.08

        # Insulin (higher dose adjustments = higher risk)
        insulin = float(row.get("insulin_encoded", 0) or 0)
        score += insulin * 0.03

        # Discharge destination risk
        discharge = float(row.get("discharge_disposition_encoded", 0) or 0)
        if discharge == 1:  # transferred
            score += 0.10
        elif discharge == 2:  # expired
            score += 0.20

        # Add small baseline
        score += 0.08

        # Clamp to realistic range
        return float(np.clip(score, 0.05, 0.95))
