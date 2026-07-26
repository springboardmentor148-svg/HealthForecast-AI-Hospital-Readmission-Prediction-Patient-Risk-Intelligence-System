import numpy as np
import pandas as pd
import json
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.model_selection import StratifiedKFold
import joblib

from .config import SEED, MODEL_PATH, METRICS_PATH, FEATURE_IMPORTANCE_PATH, CONFIG_PATH


def train_baseline_xgb(X_train, y_train, X_val, y_val, seed=SEED):
    model = XGBClassifier(
        n_estimators=500, learning_rate=0.1, max_depth=6,
        subsample=0.8, colsample_bytree=0.8,
        eval_metric="auc", early_stopping_rounds=20,
        random_state=seed, n_jobs=-1, verbosity=0,
        use_label_encoder=False
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    return model


def train_tuned_xgb(X_train, y_train, X_val, y_val, seed=SEED):
    model = XGBClassifier(
        n_estimators=2000, learning_rate=0.01, max_depth=4,
        min_child_weight=3, gamma=0.1,
        subsample=0.7, colsample_bytree=0.6,
        reg_alpha=0.5, reg_lambda=1.5,
        scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
        eval_metric="auc", early_stopping_rounds=50,
        random_state=seed, n_jobs=-1, verbosity=0,
        use_label_encoder=False
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    return model


def train_xgb_with_cv(X_train, y_train, seed=SEED, n_splits=5):
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    auc_scores = []
    models = []
    for train_idx, val_idx in skf.split(X_train, y_train):
        X_tr, X_vl = X_train[train_idx], X_train[val_idx]
        y_tr, y_vl = y_train[train_idx], y_train[val_idx]
        model = XGBClassifier(
            n_estimators=2000, learning_rate=0.01, max_depth=4,
            min_child_weight=3, gamma=0.1,
            subsample=0.7, colsample_bytree=0.6,
            reg_alpha=0.5, reg_lambda=1.5,
            scale_pos_weight=(y_tr == 0).sum() / (y_tr == 1).sum(),
            eval_metric="auc", early_stopping_rounds=50,
            random_state=seed, n_jobs=-1, verbosity=0,
            use_label_encoder=False
        )
        model.fit(X_tr, y_tr, eval_set=[(X_vl, y_vl)], verbose=False)
        y_pred_proba = model.predict_proba(X_vl)[:, 1]
        auc_scores.append(roc_auc_score(y_vl, y_pred_proba))
        models.append(model)
    best_idx = int(np.argmax(auc_scores))
    print(f"CV AUC scores: {[round(s, 4) for s in auc_scores]}, mean: {np.mean(auc_scores):.4f}, std: {np.std(auc_scores):.4f}")
    return models[best_idx], auc_scores


def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, y_pred_proba), 4),
    }
    cm = confusion_matrix(y_test, y_pred).tolist()
    return metrics, cm, y_pred, y_pred_proba


def compare_models(results: dict):
    comparison = []
    for name, result in results.items():
        comparison.append({"model": name, **result["metrics"]})
    return pd.DataFrame(comparison).sort_values("roc_auc", ascending=False)


def save_model(model, path=MODEL_PATH):
    joblib.dump(model, path)


def save_metrics(metrics, cm, path=METRICS_PATH):
    output = {"metrics": metrics, "confusion_matrix": cm}
    with open(path, "w") as f:
        json.dump(output, f, indent=2)


def save_feature_importance(model, feature_names, path=FEATURE_IMPORTANCE_PATH):
    if hasattr(model, "get_booster"):
        importances_dict = model.get_booster().get_score(importance_type="weight")
        feat_names = list(importances_dict.keys())
        importances = list(importances_dict.values())
    elif hasattr(model, "feature_importances_"):
        feat_names = feature_names
        importances = model.feature_importances_.tolist()
    else:
        feat_names = feature_names
        importances = [0] * len(feature_names)
    df = pd.DataFrame({"feature": feat_names, "importance": importances}).sort_values("importance", ascending=False)
    df.to_csv(path, index=False)


def save_config(config: dict, path=CONFIG_PATH):
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
