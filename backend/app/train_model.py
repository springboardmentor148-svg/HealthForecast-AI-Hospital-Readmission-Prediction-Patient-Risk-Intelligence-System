"""Train and version the 30-day readmission classifier using the supplied CSV."""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder
from sklearn.preprocessing import StandardScaler
try:
    from xgboost import XGBClassifier
except Exception:  # Local macOS installations can lack the OpenMP runtime required by XGBoost.
    XGBClassifier = None

from .config import settings
from .database import SessionLocal
from .models import ModelVersion

DROP_COLUMNS = {"encounter_id", "patient_nbr", "readmitted", "weight", "payer_code", "medical_specialty"}


def build_preprocessor(categorical: list[str], numeric: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        [
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
            (
                "categorical",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encode", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1, encoded_missing_value=-1)),
                    ]
                ),
                categorical,
            ),
        ]
    )


def metrics(y_true, scores) -> dict[str, float]:
    predicted = (scores >= 0.5).astype(int)
    return {
        "accuracy": round(float(accuracy_score(y_true, predicted)), 4),
        "precision": round(float(precision_score(y_true, predicted, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, predicted, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, predicted, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, scores)), 4),
    }


def main():
    source = Path(settings.data_path)
    if not source.exists():
        raise FileNotFoundError(f"Dataset not found: {source}")
    df = pd.read_csv(source).replace({"?": np.nan, "None": np.nan})
    target = (df["readmitted"] == "<30").astype(int)
    feature_columns = [column for column in df.columns if column not in DROP_COLUMNS]
    X = df[feature_columns]
    numeric = X.select_dtypes(include=["number"]).columns.tolist()
    categorical = [column for column in feature_columns if column not in numeric]

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, test_indices = next(splitter.split(X, target, groups=df["patient_nbr"]))
    X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
    y_train, y_test = target.iloc[train_indices], target.iloc[test_indices]

    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced", solver="liblinear", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=14, min_samples_leaf=4, class_weight="balanced_subsample", n_jobs=-1, random_state=42),
    }
    if XGBClassifier is not None:
        candidates["XGBoost"] = XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.08, subsample=0.8, colsample_bytree=0.8, scale_pos_weight=float((y_train == 0).sum() / max((y_train == 1).sum(), 1)), n_jobs=2, random_state=42, eval_metric="logloss")
    results: dict[str, dict[str, float]] = {}
    fitted: dict[str, Pipeline] = {}
    for name, classifier in candidates.items():
        pipeline = Pipeline([("preprocessor", build_preprocessor(categorical, numeric)), ("classifier", classifier)])
        pipeline.fit(X_train, y_train)
        results[name] = metrics(y_test, pipeline.predict_proba(X_test)[:, 1])
        fitted[name] = pipeline
        print(f"{name}: {results[name]}")

    selected_name = max(results, key=lambda name: results[name]["roc_auc"])
    artifact = {"pipeline": fitted[selected_name], "model_name": selected_name, "metrics": results[selected_name], "all_results": results, "feature_columns": feature_columns}
    destination = Path(settings.model_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, destination)

    with SessionLocal() as db:
        for row in db.query(ModelVersion).all():
            row.is_active = False
        db.add(ModelVersion(name=selected_name, metrics={**results[selected_name], "comparison": results}, is_active=True))
        db.commit()
    print(f"Saved {selected_name} to {destination}")


if __name__ == "__main__":
    main()
