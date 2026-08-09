import joblib
import os

def load_model():
    # __file__ ke relative se path banaya — ab chaahe kisi bhi folder se
    # app.py run karo, hamesha sahi jagah se model file milegi (cwd pe depend nahi karega)
    current_dir = os.path.dirname(os.path.abspath(__file__))  # backend\
    project_root = os.path.dirname(current_dir)                # HealthForecastAI\
    model_path = os.path.join(project_root, "dataset", "xgboost_model.pkl")

    model = joblib.load(model_path)
    print("=" * 40)
    print("XGBoost Model Loaded Successfully!")
    print(f"Loaded from: {model_path}")
    print("=" * 40)
    return model