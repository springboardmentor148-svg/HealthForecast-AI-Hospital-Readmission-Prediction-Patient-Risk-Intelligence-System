import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib

from .config import SEED, TEST_SIZE, VALIDATION_SIZE, AGE_MAP, TOP_MEDICAL_SPECIALTIES_THRESHOLD, ICD9_CATEGORIES


def categorize_icd9(code):
    if pd.isna(code) or code == "?":
        return "Missing"
    code_str = str(code).strip()
    if code_str.startswith("V"):
        return "V_codes"
    if code_str.startswith("E"):
        return "E_codes"
    try:
        code_num = float(code_str)
        for (lo, hi), cat in ICD9_CATEGORIES.items():
            if lo <= code_num <= hi:
                return cat
        return "Other_Diagnoses"
    except ValueError:
        return "Other_Diagnoses"


def clean_df(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.replace("Unknown/Invalid", "Unknown", inplace=True)
    missing_replacements = {
        "weight": "Weight_Unknown",
        "payer_code": "Payer_Missing",
        "medical_specialty": "Missing",
        "race": "Unknown",
        "diag_1": "Missing",
        "diag_2": "Missing",
        "diag_3": "Missing",
    }
    for col, replacement in missing_replacements.items():
        if col in df.columns:
            df[col] = df[col].replace("?", replacement)
    for col in ["max_glu_serum", "A1Cresult"]:
        df[col] = df[col].fillna("Not Tested")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["age"] = df["age"].map(AGE_MAP).astype(int)
    for diag_col in ["diag_1", "diag_2", "diag_3"]:
        df[f"{diag_col}_cat"] = df[diag_col].apply(categorize_icd9)
    if "readmitted" in df.columns:
        df["readmitted_any"] = df["readmitted"].apply(lambda x: 1 if x != "NO" else 0)
        df["readmitted_early"] = df["readmitted"].apply(lambda x: 1 if x == "<30" else 0)
    return df


def get_feature_target(df: pd.DataFrame, target_col: str = "readmitted_any", drop_leakage: bool = True):
    drop_cols = ["readmitted", "readmitted_early", "readmitted_any", "encounter_id", "patient_nbr", "diag_1", "diag_2", "diag_3"]
    if target_col in df.columns:
        y = df[target_col].values
        drop_cols = [c for c in drop_cols if c != target_col]
    else:
        y = None
    X = df.drop(columns=[c for c in drop_cols if c in df.columns])
    return X, y


class FeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.medical_specialty_top = None
        self.weight_categories = None
        self.payer_categories = None

    def fit(self, X, y=None):
        df = X.copy()
        if "medical_specialty" in df.columns:
            vc = df["medical_specialty"].value_counts()
            self.medical_specialty_top = vc[vc > TOP_MEDICAL_SPECIALTIES_THRESHOLD].index.tolist()
        return self

    def transform(self, X):
        df = X.copy()
        if "medical_specialty" in df.columns and self.medical_specialty_top:
            df["medical_specialty"] = df["medical_specialty"].apply(
                lambda x: x if x in self.medical_specialty_top else "Other"
            )
        for diag_col in ["diag_1_cat", "diag_2_cat", "diag_3_cat"]:
            if diag_col in df.columns:
                pass
        return df


def create_preprocessing_pipeline():
    categorical_cols = [
        "race", "gender", "medical_specialty", "change", "diabetesMed",
        "max_glu_serum", "A1Cresult", "insulin", "metformin",
        "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
        "acetohexamide", "glipizide", "glyburide", "tolbutamide",
        "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
        "troglitazone", "tolazamide", "examide", "citoglipton",
        "glyburide-metformin", "glipizide-metformin", "glimepiride-pioglitazone",
        "metformin-rosiglitazone", "metformin-pioglitazone",
        "payer_code", "weight",
        "diag_1_cat", "diag_2_cat", "diag_3_cat"
    ]
    numeric_cols = [
        "age", "time_in_hospital", "num_lab_procedures", "num_procedures",
        "num_medications", "number_outpatient", "number_emergency",
        "number_inpatient", "number_diagnoses",
        "admission_type_id", "discharge_disposition_id", "admission_source_id"
    ]
    cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False, min_frequency=50)
    num_transformer = StandardScaler()
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_transformer, numeric_cols),
            ("cat", cat_transformer, categorical_cols),
        ],
        remainder="drop"
    )
    pipeline = Pipeline([
        ("preprocessor", preprocessor)
    ])
    return pipeline, numeric_cols, categorical_cols


def split_data(X, y, random_state=SEED):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=random_state, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=VALIDATION_SIZE, random_state=random_state, stratify=y_train
    )
    return X_train, X_val, X_test, y_train, y_val, y_test


def save_pipeline(pipeline, path):
    joblib.dump(pipeline, path)
