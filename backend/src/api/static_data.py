"""Model performance served to the UI.

All values come from the training pipeline's on-disk artifacts
(backend/reports/metrics.json, training_config.json, feature_importance.csv
and the model file timestamp). Nothing is hardcoded for display purposes.
"""

import json
from datetime import datetime
from pathlib import Path

from src.pipeline.config import (
    CONFIG_PATH,
    FEATURE_IMPORTANCE_PATH,
    METRICS_PATH,
    MODEL_PATH,
)


def _read_json(path: Path) -> dict:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def load_model_metrics() -> dict:
    """Return the real XGBoost model performance from the pipeline artifacts."""
    raw_metrics = _read_json(METRICS_PATH)
    metrics = raw_metrics.get("metrics", {})
    config = _read_json(CONFIG_PATH)

    tn, fp, fn, tp = 0, 0, 0, 0
    cm = raw_metrics.get("confusion_matrix", [])
    if len(cm) == 2 and len(cm[0]) == 2 and len(cm[1]) == 2:
        tn, fp = cm[0]
        fn, tp = cm[1]

    importances: list[dict] = []
    imp_path = Path(FEATURE_IMPORTANCE_PATH)
    if imp_path.exists():
        try:
            lines = imp_path.read_text(encoding="utf-8").strip().splitlines()
            rows = []
            for line in lines[1:]:
                if not line.strip():
                    continue
                parts = line.split(",")
                if len(parts) == 2:
                    rows.append((parts[0].strip(), float(parts[1].strip())))
            total = sum(v for _, v in rows)
            if total > 0:
                importances = [
                    {"feature": feature, "importance": round(value / total, 4)}
                    for feature, value in rows
                ]
        except (OSError, ValueError):
            importances = []

    last_trained = ""
    try:
        last_trained = datetime.fromtimestamp(
            Path(MODEL_PATH).stat().st_mtime
        ).strftime("%Y-%m-%d %H:%M UTC")
    except OSError:
        pass

    return {
        "modelName": "XGBoost Readmission Model",
        "modelVersion": config.get("best_model", "xgb_cv_final"),
        "algorithm": "XGBoost Classifier",
        "accuracy": float(metrics.get("accuracy", 0)),
        "precision": float(metrics.get("precision", 0)),
        "recall": float(metrics.get("recall", 0)),
        "f1Score": float(metrics.get("f1_score", 0)),
        "rocAuc": float(metrics.get("roc_auc", 0)),
        "trainedEncounters": int(config.get("train_samples", 0)),
        "featureCount": int(config.get("feature_count", 0)),
        "lastTrained": last_trained,
        "featureImportances": importances,
        "confusionMatrix": {
            "truePositive": tp,
            "falsePositive": fp,
            "trueNegative": tn,
            "falseNegative": fn,
        },
    }
