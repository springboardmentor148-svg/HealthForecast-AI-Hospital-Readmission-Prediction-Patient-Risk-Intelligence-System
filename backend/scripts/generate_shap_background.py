from __future__ import annotations

import os
import re
import sys
from pathlib import Path
import pandas as pd
import joblib

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "models"
TRAIN_PATH = PROJECT_ROOT / "pre-processed dataset" / "train_processed.csv"
FEATURE_NAMES_PATH = MODELS_DIR / "feature_names.pkl"
SHAP_BACKGROUND_PATH = MODELS_DIR / "shap_background.pkl"

_FEATURE_NAME_CLEANUP = re.compile(r"[^A-Za-z0-9_]")


def clean_column_name(name: str) -> str:
    return _FEATURE_NAME_CLEANUP.sub("_", name)


def main() -> int:
    print("--- GENERATING OFFLINE SHAP BACKGROUND ---")
    if not FEATURE_NAMES_PATH.exists():
        print(f"Error: Feature names file not found at {FEATURE_NAMES_PATH}", file=sys.stderr)
        return 1

    if not TRAIN_PATH.exists():
        print(f"Error: Training dataset not found at {TRAIN_PATH}", file=sys.stderr)
        return 1

    # 1. Load feature names
    feature_names = joblib.load(FEATURE_NAMES_PATH)
    print(f"Loaded {len(feature_names)} features from {FEATURE_NAMES_PATH.name}")

    # 2. Load training data
    print("Loading training dataset...")
    df = pd.read_csv(TRAIN_PATH)
    print(f"Loaded train_processed.csv with shape {df.shape}")

    # 3. Clean columns
    df.columns = [clean_column_name(col) for col in df.columns]

    # Verify target column is present and remove it
    target_col = "readmitted"
    if target_col in df.columns:
        df = df.drop(columns=[target_col])
        print("Dropped target column 'readmitted'")

    # 4. Check for missing columns
    missing_cols = [col for col in feature_names if col not in df.columns]
    if missing_cols:
        print(f"Error: The following features are missing in training CSV: {missing_cols}", file=sys.stderr)
        return 1

    # 5. Keep and reorder columns
    df_aligned = df[feature_names].astype(float)
    print("Columns aligned in the exact feature names order")

    # 6. Sample 50 actual rows
    sampled_df = df_aligned.sample(n=50, random_state=42)
    background_array = sampled_df.values  # Shape: (50, 85)

    # 7. Verification assertions
    assert background_array.shape == (50, 85), f"Incorrect background shape: {background_array.shape}"
    assert list(sampled_df.columns) == feature_names, "Columns order mismatch"

    print(f"Background shape verified: {background_array.shape}")
    print(f"Background feature names match feature_names.pkl exactly: {list(sampled_df.columns) == feature_names}")

    # 8. Save the background
    joblib.dump(background_array, SHAP_BACKGROUND_PATH)
    print(f"Successfully saved background artifact to {SHAP_BACKGROUND_PATH}")

    # Double check loading
    loaded_bg = joblib.load(SHAP_BACKGROUND_PATH)
    print(f"Verification: Loaded shape: {loaded_bg.shape}")
    print("Success!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
