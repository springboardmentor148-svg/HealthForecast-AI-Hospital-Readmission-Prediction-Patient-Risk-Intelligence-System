import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_path = Path("models/risk_predictor.pkl")
        self.scaler_path = Path("models/scaler.pkl")
        self.features_path = Path("models/feature_names.pkl")
        
        # Load model if exists
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            if self.model_path.exists():
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.feature_names = joblib.load(self.features_path)
                logger.info("✅ ML Model loaded successfully!")
                return True
            else:
                logger.warning("⚠️ No trained model found. Using fallback.")
                return False
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            return False
    
    def predict_risk(self, patient) -> Dict[str, Any]:
        """Predict readmission risk using ML model - REMOVED async"""
        try:
            if self.model is not None and self.feature_names is not None:
                # Convert patient to features
                features = self._patient_to_features(patient)
                
                # Ensure all features are present
                X = np.array([features.get(f, 0) for f in self.feature_names]).reshape(1, -1)
                
                # Scale features if scaler exists
                if self.scaler is not None:
                    X = self.scaler.transform(X)
                
                # Predict
                risk_score = self.model.predict_proba(X)[0, 1]
                prediction = self.model.predict(X)[0]
                
                # Determine risk category
                if risk_score > 0.7:
                    category = 'High'
                elif risk_score > 0.4:
                    category = 'Medium'
                else:
                    category = 'Low'
                
                return {
                    'patient_id': patient.patient_id,
                    'risk_score': float(risk_score),
                    'readmission_probability': float(risk_score),
                    'risk_category': category,
                    'predicted_readmission': bool(prediction),
                    'model_version': '1.0.0'
                }
            else:
                # Fallback to mock prediction
                return self._mock_prediction(patient)
                
        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            return self._mock_prediction(patient)
    
    def _patient_to_features(self, patient) -> Dict[str, Any]:
        """Convert patient object to feature dictionary"""
        features = {
            'age': patient.age,
            'gender': 1 if patient.gender == 'Male' else 0,
            'time_in_hospital': getattr(patient, 'time_in_hospital', 5),
            'num_lab_procedures': getattr(patient, 'num_lab_procedures', 10),
            'num_procedures': getattr(patient, 'num_procedures', 3),
            'num_medications': len(patient.medications) if hasattr(patient, 'medications') else 0,
            'number_outpatient': getattr(patient, 'number_outpatient', 0),
            'number_emergency': getattr(patient, 'number_emergency', 0),
            'number_inpatient': getattr(patient, 'number_inpatient', 0),
            'number_diagnoses': len(patient.medical_history) if hasattr(patient, 'medical_history') else 0,
            'medication_count': len(patient.medications) if hasattr(patient, 'medications') else 0,
            'race_encoded': self._encode_race(getattr(patient, 'race', 'Unknown')),
        }
        
        return features
    
    def _encode_race(self, race: str) -> int:
        """Encode race to numeric value"""
        race_map = {
            'Caucasian': 0,
            'African American': 1,
            'Hispanic': 2,
            'Asian': 3,
            'Other': 4,
            'Unknown': 5
        }
        return race_map.get(race, 5)
    
    def _mock_prediction(self, patient) -> Dict[str, Any]:
        """Fallback mock prediction"""
        import random
        risk_score = random.uniform(0.1, 0.9)
        category = 'High' if risk_score > 0.7 else 'Medium' if risk_score > 0.4 else 'Low'
        
        return {
            'patient_id': patient.patient_id,
            'risk_score': risk_score,
            'readmission_probability': risk_score,
            'risk_category': category,
            'predicted_readmission': risk_score > 0.5,
            'model_version': 'mock'
        }