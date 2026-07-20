"""
HealthForecast AI - Model Training Script
==========================================
Trains the Readmission Prediction Engine on the Diabetes 130-US Hospitals
dataset, using only the tools listed in the project tech stack:
    - Pandas / NumPy      -> data loading & preprocessing
    - Scikit-learn         -> preprocessing, Logistic baseline, Random Forest
    - XGBoost               -> gradient boosted model (primary model)

Target: 'readmitted' column collapsed into a binary label
    1 -> patient was readmitted within 30 days ("<30")
    0 -> not readmitted or readmitted after 30 days ("NO" / ">30")

This mirrors Milestone 2 of the project plan ("Risk Prediction &
Readmission Forecasting") and produces the artifacts consumed by the
FastAPI backend (model/*.joblib).
"""

import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib
import xgboost as xgb

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "diabetic_data.csv"
MODEL_DIR = BASE_DIR
MODEL_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42

# ---------------------------------------------------------------------
# 1. Data Ingestion & Preprocessing  (Module: Data Ingestion & Preprocessing)
# ---------------------------------------------------------------------
print("Loading Diabetes 130-US Hospitals Dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Raw shape: {df.shape}")

# Replace dataset's '?' missing-value marker with NaN
df = df.replace("?", np.nan)

# Drop administrative / high-cardinality identifier columns that leak no
# generalizable clinical signal and columns that are almost entirely missing
drop_cols = [
    "encounter_id",
    "patient_nbr",
    "weight",          # >95% missing
    "payer_code",      # billing info, not clinical
    "medical_specialty",  # very high cardinality / mostly missing
]
df = df.drop(columns=[c for c in drop_cols if c in df.columns])

# Keep one encounter per patient's first admission isn't required for this
# scope; use all encounters as independent samples (standard approach for
# this dataset in published baselines).

# ---------------------------------------------------------------------
# 2. Target Engineering -> binary "readmitted <30 days" label
# ---------------------------------------------------------------------
df = df[df["readmitted"].notna()]
df["readmitted_30d"] = (df["readmitted"] == "<30").astype(int)
y = df["readmitted_30d"]
X = df.drop(columns=["readmitted", "readmitted_30d"])

print("Target distribution:")
print(y.value_counts(normalize=True).rename("proportion"))

# ---------------------------------------------------------------------
# 3. Feature typing
# ---------------------------------------------------------------------
# diag_1/2/3 are ICD9-like codes -> keep as categorical (top-N handled by OHE
# with handle_unknown='ignore'; rare codes collapse via min_frequency)
categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()

print(f"Numeric features ({len(numeric_cols)}): {numeric_cols}")
print(f"Categorical features ({len(categorical_cols)}): {categorical_cols}")

# ---------------------------------------------------------------------
# 4. Train / test split
# ---------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"Train: {X_train.shape}, Test: {X_test.shape}")

# ---------------------------------------------------------------------
# 5. Preprocessing pipeline
# ---------------------------------------------------------------------
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore", min_frequency=50, sparse_output=True)),
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, numeric_cols),
    ("cat", categorical_transformer, categorical_cols),
])

# ---------------------------------------------------------------------
# 6. Candidate models (per tech stack: Scikit-learn Random Forest + XGBoost)
# ---------------------------------------------------------------------
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

candidates = {
    "logistic_regression": Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE
        )),
    ]),
    "random_forest": Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            min_samples_leaf=5,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ]),
    "xgboost": Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", xgb.XGBClassifier(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="auc",
            scale_pos_weight=scale_pos_weight,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ]),
}

# ---------------------------------------------------------------------
# 7. Train + evaluate each candidate, select the best by ROC-AUC
# ---------------------------------------------------------------------
results = {}
best_name, best_score, best_pipeline = None, -1, None

for name, pipeline in candidates.items():
    print(f"\nTraining {name}...")
    pipeline.fit(X_train, y_train)
    proba = pipeline.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_test, preds),
        "precision": precision_score(y_test, preds, zero_division=0),
        "recall": recall_score(y_test, preds, zero_division=0),
        "f1_score": f1_score(y_test, preds, zero_division=0),
        "roc_auc": roc_auc_score(y_test, proba),
    }
    results[name] = metrics
    print(f"  {name} metrics: {json.dumps(metrics, indent=2)}")

    if metrics["roc_auc"] > best_score:
        best_score = metrics["roc_auc"]
        best_name = name
        best_pipeline = pipeline

print(f"\nBest model: {best_name} (ROC-AUC={best_score:.4f})")

# ---------------------------------------------------------------------
# 8. Persist model + metadata (consumed by FastAPI backend)
# ---------------------------------------------------------------------
joblib.dump(best_pipeline, MODEL_DIR / "readmission_model.joblib")

metadata = {
    "best_model": best_name,
    "metrics": results,
    "numeric_cols": numeric_cols,
    "categorical_cols": categorical_cols,
    "feature_order": numeric_cols + categorical_cols,
    "positive_class": "readmitted_within_30_days",
}
with open(MODEL_DIR / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

# Save representative example values for the UI (dropdown options, defaults)
ui_options = {}
for col in categorical_cols:
    ui_options[col] = sorted([v for v in X[col].dropna().unique().tolist()])[:60]
numeric_stats = {
    col: {
        "min": float(X[col].min()),
        "max": float(X[col].max()),
        "median": float(X[col].median()),
    }
    for col in numeric_cols
}
with open(MODEL_DIR / "ui_schema.json", "w") as f:
    json.dump({"categorical_options": ui_options, "numeric_stats": numeric_stats}, f, indent=2)

print("\nSaved:")
print(f"  - {MODEL_DIR / 'readmission_model.joblib'}")
print(f"  - {MODEL_DIR / 'model_metadata.json'}")
print(f"  - {MODEL_DIR / 'ui_schema.json'}")
print("\nDone.")
