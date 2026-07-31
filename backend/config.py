from pathlib import Path

# Backend Folder
BASE_DIR = Path(__file__).resolve().parent

# Models Folder
MODEL_DIR = BASE_DIR / "models"

# Final Model
MODEL_PATH = MODEL_DIR / "final_model.pkl"

# Feature Names
FEATURE_PATH = MODEL_DIR / "feature_names.pkl"