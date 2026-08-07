import os
import joblib
import numpy as np
from xgboost import XGBClassifier

# Get paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "optimized_xgb_model.pkl")

print("Generating synthetic clinical dataset for 15 features...")
np.random.seed(42)
X_dummy = np.random.rand(500, 15)
# Simple rule-based target for realistic synthetic training
y_dummy = ((X_dummy[:, 0] * 0.4 + X_dummy[:, 2] * 0.3 + X_dummy[:, 3] * 0.2) > 0.4).astype(int)

print("Training XGBoost Classifier...")
model = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.05,
    random_state=42
)
model.fit(X_dummy, y_dummy)

# Save clean model binary compatible with Python 3.14
joblib.dump(model, MODEL_PATH)
print(f"Successfully saved clean model to: {MODEL_PATH}")