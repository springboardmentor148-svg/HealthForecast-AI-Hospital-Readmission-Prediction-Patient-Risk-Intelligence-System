"""
HealthForecast AI - Readmission Risk Prediction Model
Dataset: Diabetes 130-US Hospitals (UCI)
Target : readmitted < 30 days (binary: high-risk vs not)

Pipeline:
  1. Load & clean raw data
  2. Feature engineering (ICD9 grouping, age mapping, med changes, etc.)
  3. Encode categoricals
  4. Train/test split (patient-level, stratified)
  5. Train XGBoost classifier (class-imbalance aware)
  6. Evaluate (accuracy, precision, recall, F1, ROC-AUC)
  7. Persist model + encoders + feature list + metrics for the backend API
"""
import json
import os
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
from xgboost import XGBClassifier

# RAW_PATH: point this at your local copy of diabetic_data.csv (Diabetes 130-US
# Hospitals dataset) if you need to retrain. Not required to just run the app —
# the trained artifacts are already committed under model/.
RAW_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "diabetic_data.csv")
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# --------------------------------------------------------------------------
# 1. LOAD
# --------------------------------------------------------------------------
df = pd.read_csv(RAW_PATH)
df.replace("?", np.nan, inplace=True)

# --------------------------------------------------------------------------
# 2. CLEANING
# --------------------------------------------------------------------------
# Drop encounters where the patient died or went to hospice - they cannot be
# meaningfully "readmitted" (standard cleaning step for this dataset).
expired_hospice_codes = [11, 13, 14, 19, 20, 21]
df = df[~df["discharge_disposition_id"].isin(expired_hospice_codes)].copy()

# Keep only the FIRST encounter per patient to avoid patient-level leakage
# between train/test splits.
df = df.sort_values("encounter_id").drop_duplicates(subset="patient_nbr", keep="first")

# Columns that are basically unusable / leak identifiers
df.drop(columns=["encounter_id", "patient_nbr", "weight"], inplace=True)

# High-missing categoricals -> keep as an explicit "Missing" category
# (missingness itself is often informative in this dataset, e.g. no payer
# code correlating with uninsured patients)
for col in ["payer_code", "medical_specialty", "race"]:
    df[col] = df[col].fillna("Missing")

# A handful of rows have unknown gender - drop (only 3 in the raw data)
df = df[df["gender"] != "Unknown/Invalid"]

# --------------------------------------------------------------------------
# 3. FEATURE ENGINEERING
# --------------------------------------------------------------------------
# 3a. Age bracket -> ordinal midpoint (numeric, preserves ordering for the model)
age_map = {
    "[0-10)": 5, "[10-20)": 15, "[20-30)": 25, "[30-40)": 35,
    "[40-50)": 45, "[50-60)": 55, "[60-70)": 65, "[70-80)": 75,
    "[80-90)": 85, "[90-100)": 95,
}
df["age_numeric"] = df["age"].map(age_map)

# 3b. ICD9 diagnosis grouping -> clinically meaningful categories
def map_icd9(code):
    if pd.isna(code):
        return "Missing"
    code = str(code)
    if code.startswith("V") or code.startswith("E"):
        return "Other"
    try:
        val = float(code)
    except ValueError:
        return "Other"
    if 390 <= val <= 459 or val == 785:
        return "Circulatory"
    if 460 <= val <= 519 or val == 786:
        return "Respiratory"
    if 520 <= val <= 579 or val == 787:
        return "Digestive"
    if 250 <= val < 251:
        return "Diabetes"
    if 800 <= val <= 999:
        return "Injury"
    if 710 <= val <= 739:
        return "Musculoskeletal"
    if 580 <= val <= 629 or val == 788:
        return "Genitourinary"
    if 140 <= val <= 239:
        return "Neoplasms"
    return "Other"

for c in ["diag_1", "diag_2", "diag_3"]:
    df[c + "_group"] = df[c].apply(map_icd9)
df.drop(columns=["diag_1", "diag_2", "diag_3"], inplace=True)

# 3c. Medication change columns -> map to ordinal (captures dose direction)
med_cols = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "examide", "citoglipton", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "metformin-rosiglitazone", "metformin-pioglitazone",
]
med_ordinal = {"No": 0, "Down": 1, "Steady": 2, "Up": 3}
for c in med_cols:
    df[c] = df[c].map(med_ordinal).fillna(0).astype(int)

# 3d. Number of medications actually changed (engineered signal)
df["num_med_changes"] = df[med_cols].apply(lambda r: (r > 0).sum(), axis=1)

# 3e. Simple binary encodes
df["change"] = df["change"].map({"No": 0, "Ch": 1})
df["diabetesMed"] = df["diabetesMed"].map({"No": 0, "Yes": 1})
df["max_glu_serum"] = df["max_glu_serum"].map({"None": 0, "Norm": 1, ">200": 2, ">300": 3})
df["A1Cresult"] = df["A1Cresult"].map({"None": 0, "Norm": 1, ">7": 2, ">8": 3})

# 3f. Total prior utilization (engineered signal often predictive of readmission)
df["prior_visits_total"] = df["number_outpatient"] + df["number_emergency"] + df["number_inpatient"]

# --------------------------------------------------------------------------
# 4. TARGET
# --------------------------------------------------------------------------
# Binary target: high-risk = readmitted within 30 days
df["target"] = (df["readmitted"] == "<30").astype(int)
df.drop(columns=["readmitted", "age"], inplace=True)

# --------------------------------------------------------------------------
# 5. ENCODE REMAINING CATEGORICALS
# --------------------------------------------------------------------------
categorical_cols = [
    "race", "gender", "payer_code", "medical_specialty",
    "diag_1_group", "diag_2_group", "diag_3_group",
    "admission_type_id", "discharge_disposition_id", "admission_source_id",
]

encoders = {}
for c in categorical_cols:
    le = LabelEncoder()
    df[c] = le.fit_transform(df[c].astype(str))
    encoders[c] = {cls: int(idx) for idx, cls in enumerate(le.classes_)}

feature_cols = [c for c in df.columns if c != "target"]
X = df[feature_cols]
y = df["target"]

print("Final feature matrix:", X.shape)
print("Positive class (readmitted <30) rate: %.2f%%" % (y.mean() * 100))

# --------------------------------------------------------------------------
# 6. TRAIN / TEST SPLIT
# --------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --------------------------------------------------------------------------
# 7. MODEL — XGBoost with class-imbalance handling
# --------------------------------------------------------------------------
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

model = XGBClassifier(
    n_estimators=400,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    scale_pos_weight=scale_pos_weight,
    eval_metric="auc",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# --------------------------------------------------------------------------
# 8. EVALUATION
# --------------------------------------------------------------------------
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred),
    "recall": recall_score(y_test, y_pred),
    "f1_score": f1_score(y_test, y_pred),
    "roc_auc": roc_auc_score(y_test, y_prob),
    "n_train": int(len(X_train)),
    "n_test": int(len(X_test)),
    "positive_rate_test": float(y_test.mean()),
}
print(json.dumps(metrics, indent=2))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

# --------------------------------------------------------------------------
# 9. FEATURE IMPORTANCE (for clinical decision support explanations)
# --------------------------------------------------------------------------
importances = sorted(
    zip(feature_cols, model.feature_importances_.tolist()),
    key=lambda x: x[1], reverse=True
)
top_features = [{"feature": f, "importance": round(v, 4)} for f, v in importances[:15]]

# --------------------------------------------------------------------------
# 10. PERSIST ARTIFACTS
# --------------------------------------------------------------------------
# NOTE: we deliberately do NOT joblib.dump() the XGBClassifier itself.
# joblib/pickle on the full sklearn wrapper embeds XGBoost's internal
# booster serialization, which is NOT guaranteed compatible across XGBoost
# versions -> "XGBoostError: ... input stream error" if you later load the
# .joblib with a different XGBoost version than trained it. XGBoost's own
# docs recommend save_model()/load_model() (JSON/UBJ) for anything that
# needs to survive a version upgrade or move to another machine.
model.save_model(f"{OUT_DIR}/xgb_readmission_model.json")
joblib.dump(encoders, f"{OUT_DIR}/label_encoders.joblib")
joblib.dump(feature_cols, f"{OUT_DIR}/feature_columns.joblib")

with open(f"{OUT_DIR}/metrics.json", "w") as f:
    json.dump({"metrics": metrics, "top_features": top_features}, f, indent=2)

with open(f"{OUT_DIR}/age_map.json", "w") as f:
    json.dump(age_map, f, indent=2)

print("\nSaved model artifacts to", OUT_DIR)
