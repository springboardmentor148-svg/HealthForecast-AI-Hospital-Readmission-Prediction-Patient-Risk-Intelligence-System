import joblib

def load_model():
    model = joblib.load("dataset/xgboost_model.pkl")
    print("=" * 40)
    print("XGBoost Model Loaded Successfully!")
    print("=" * 40)
    return model