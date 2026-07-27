"""
utils/preprocess.py
Feature vector engineering wrapper. Transforms incoming JSON structures
into numerical matrices aligned with the production model configuration.
"""

import os
import joblib
import pandas as pd
import numpy as np
from flask import current_app
from xgboost import XGBClassifier

class MedicalPipelineLoader:
    """Safely handles lazy loading and caching of model binaries from the filesystem."""
    _model = None
    _scaler = None

    @classmethod
    def load_artifacts(cls):
        """Loads and caches pickle files if they are not already in memory."""
        if cls._model is None:
            model_path = current_app.config['MODEL_PATH']
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Missing machine learning model binary at: {model_path}")
            model = XGBClassifier()
            model.load_model(model_path)
            cls._model = model
        if cls._scaler is None:
            scaler_path = current_app.config['SCALER_PATH']
            if not os.path.exists(scaler_path):
                raise FileNotFoundError(f"Missing standardization scaler binary at: {scaler_path}")
            try:
                cls._scaler = joblib.load(scaler_path)
                print("Scaler loaded successfully")
            except Exception as e:
                print("SCALER ERROR:", e)
                raise
            
        return cls._model, cls._scaler


def prepare_patient_features(raw_json):
    """
    Transforms clinical raw data structures into scaled modeling feature arrays.
    
    Args:
        raw_json (dict): Verified, type-cast patient metrics dictionary.
        
    Returns:
        np.ndarray: A transformed and standardized feature vector ready for model evaluation.
    """
    # 1. Map raw metrics directly to your model's training columns
    # Adjust names here if your model features use different keys
    feature_map = {
        "age": int(raw_json.get("age_group", 0)),
        "time_in_hospital": int(raw_json.get("time_in_hospital", 1)),
        "num_lab_procedures": int(raw_json.get("num_lab_procedures", 0)),
        "num_procedures": int(raw_json.get("num_procedures", 0)),
        "num_medications": int(raw_json.get("num_medications", 0)),
        "number_outpatient": int(raw_json.get("number_outpatient", 0)),
        "number_emergency": int(raw_json.get("number_emergency", 0)),
        "number_inpatient": int(raw_json.get("number_inpatient", 0)),
        "number_diagnoses": int(raw_json.get("number_diagnoses", 0)),
        "change": int(raw_json.get("change_in_meds", 0)),
        "diabetesMed": int(raw_json.get("diabetes_med_prescribed", 0))
    }
    # Convert into a structured DataFrame to maintain correct feature alignment
    df_features = pd.DataFrame([feature_map])
    # 2. Retrieve the pre-trained analytical model binaries
    _, scaler = MedicalPipelineLoader.load_artifacts()
    
    # 3. Apply the training standardization scaler transformations
    scaled_array = scaler.transform(df_features)
    
    return scaled_array


def execution_inference(scaled_features):
    """
    Runs inference on scaled vectors using the pre-trained classification model.
    
    Args:
        scaled_features (np.ndarray): Transformed matrix.
        
    Returns:
        tuple: (risk_label: str, confidence_probability: float)
    """
    model, _ = MedicalPipelineLoader.load_artifacts()
    
    # Determine the classification risk probability index
    prediction_class = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]
    
    # Readmission risk maps directly to class 1
    target_probability = float(probabilities[1])
    
    # Classify clinical classification status based on threshold parameters
    if prediction_class == 1 or target_probability >= 0.5:
        risk_label = "High Risk"
    else:
        risk_label = "Low Risk"
        
    return risk_label, target_probability