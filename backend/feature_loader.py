import joblib
from config import FEATURE_PATH

print("Loading Feature Names...")

try:
    feature_names = joblib.load(FEATURE_PATH)

    print("✅ Feature Names Loaded Successfully!")
    print(f"Total Features: {len(feature_names)}")

except Exception as e:
    print("❌ Error Loading Feature Names")
    print(e)
    feature_names = []