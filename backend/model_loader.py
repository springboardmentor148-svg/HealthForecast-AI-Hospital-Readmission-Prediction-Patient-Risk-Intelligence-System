import joblib
from config import MODEL_PATH

print("Loading Machine Learning Model...")

try:
    model = joblib.load(MODEL_PATH)
    print("✅ Model Loaded Successfully!")
except Exception as e:
    print("❌ Error Loading Model")
    print(e)
    model = None