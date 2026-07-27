import pandas as pd
import numpy as np
import warnings
from pathlib import Path
import joblib

from .config import (
    RAW_DATA_PATH, SEED, MODEL_PATH, PIPELINE_PATH,
    METRICS_PATH, FEATURE_IMPORTANCE_PATH, CONFIG_PATH,
    REPORTS_DIR, MODELS_DIR, DATA_PROCESSED_DIR
)
from .data_audit import (
    audit_missing_values, audit_duplicates, audit_dtypes,
    audit_class_balance, audit_outliers, audit_correlations,
    audit_low_value_features, audit_data_leakage
)
from .preprocessing import (
    clean_df, engineer_features, get_feature_target,
    create_preprocessing_pipeline, split_data, FeatureEngineer
)
from .model import (
    train_baseline_xgb, train_tuned_xgb, train_xgb_with_cv,
    evaluate_model, compare_models,
    save_model, save_metrics, save_feature_importance, save_config
)

warnings.filterwarnings("ignore")


def run_full_pipeline():
    print("=" * 70)
    print("HEALTHFORECAST AI - XGBoost Model Pipeline")
    print("=" * 70)

    # Step 1: Load Data
    print("\n[1/8] Loading data...")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"   Shape: {df.shape}")

    # Step 2: Audit Dataset
    print("\n[2/8] Auditing dataset...")
    audit_missing = audit_missing_values(df)
    print(f"   Missing cells: {audit_missing['total_missing_cells']} in {audit_missing['total_columns_with_missing']} columns")

    audit_dup = audit_duplicates(df)
    print(f"   Duplicate rows: {audit_dup['duplicate_rows']} ({audit_dup['percent_duplicate']}%)")

    numeric_cols_raw = df.select_dtypes(include=[np.number]).columns.tolist()
    outlier_df = audit_outliers(df, numeric_cols_raw)
    print(f"   Columns with >10% outliers: {(outlier_df['outlier_pct'] > 10).sum()}")

    audit_dtype = audit_dtypes(df)
    print(f"   Object columns: {len(audit_dtype['object_columns'])}, Numeric columns: {len(audit_dtype['numeric_columns'])}")

    leakage_cols = audit_data_leakage(df)
    print(f"   Potential leakage columns: {leakage_cols}")

    low_val = audit_low_value_features(df)
    print(f"   Low-value features (single value >=99%): {len(low_val)}")

    # Step 3: Clean & Engineer Features
    print("\n[3/8] Cleaning and engineering features...")
    df = clean_df(df)
    df = engineer_features(df)
    print(f"   Shape after engineering: {df.shape}")

    # Check class balance
    audit_bal = audit_class_balance(df["readmitted_any"])
    print(f"   Target balance: {audit_bal['proportions']}, Minority: {audit_bal['minority_pct']}%")

    # Step 4: Split Data
    print("\n[4/8] Splitting data...")
    X, y = get_feature_target(df)
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)
    print(f"   Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}")

    # Step 5: Create & Fit Preprocessing Pipeline
    print("\n[5/8] Fitting preprocessing pipeline...")
    pipeline, numeric_cols, categorical_cols = create_preprocessing_pipeline()
    X_train_processed = pipeline.fit_transform(X_train)
    X_val_processed = pipeline.transform(X_val)
    X_test_processed = pipeline.transform(X_test)
    print(f"   Processed feature dimensions: {X_train_processed.shape[1]}")

    # Get feature names
    cat_features = []
    try:
        cat_transformer = pipeline.named_steps["preprocessor"].transformers_[1][1]
        cat_features = cat_transformer.get_feature_names_out(categorical_cols).tolist()
    except Exception:
        cat_features = [f"cat_{i}" for i in range(X_train_processed.shape[1] - len(numeric_cols))]
    feature_names = numeric_cols + cat_features
    print(f"   Total features: {len(feature_names)}")

    # Step 6: Train Models
    print("\n[6/8] Training models...")
    all_results = {}

    # Baseline XGBoost
    print("\n   --- Baseline XGBoost ---")
    model_baseline = train_baseline_xgb(X_train_processed, y_train, X_val_processed, y_val)
    metrics_baseline, cm_baseline, _, _ = evaluate_model(model_baseline, X_val_processed, y_val)
    print(f"   Val - AUC: {metrics_baseline['roc_auc']:.4f}, F1: {metrics_baseline['f1_score']:.4f}")
    all_results["xgb_baseline"] = {"model": model_baseline, "metrics": metrics_baseline, "cm": cm_baseline}

    # Tuned XGBoost
    print("\n   --- Tuned XGBoost (early stopping) ---")
    model_tuned = train_tuned_xgb(X_train_processed, y_train, X_val_processed, y_val)
    metrics_tuned, cm_tuned, _, _ = evaluate_model(model_tuned, X_val_processed, y_val)
    print(f"   Val - AUC: {metrics_tuned['roc_auc']:.4f}, F1: {metrics_tuned['f1_score']:.4f}")
    all_results["xgb_tuned"] = {"model": model_tuned, "metrics": metrics_tuned, "cm": cm_tuned}

    # XGBoost with CV
    print("\n   --- XGBoost with 5-Fold CV ---")
    model_cv, cv_scores = train_xgb_with_cv(
        np.vstack([X_train_processed, X_val_processed]),
        np.concatenate([y_train, y_val])
    )
    X_train_full = np.vstack([X_train_processed, X_val_processed])
    y_train_full = np.concatenate([y_train, y_val])
    model_final = train_tuned_xgb(X_train_full, y_train_full, X_val_processed, y_val)
    metrics_cv, cm_cv, y_pred_test, y_pred_proba_test = evaluate_model(model_final, X_test_processed, y_test)
    print(f"   Test - AUC: {metrics_cv['roc_auc']:.4f}, F1: {metrics_cv['f1_score']:.4f}")
    all_results["xgb_cv_final"] = {"model": model_final, "metrics": metrics_cv, "cm": cm_cv}

    # Step 7: Compare & Select Best
    print("\n[7/8] Comparing models...")
    comparison_df = compare_models(all_results)
    print(comparison_df.to_string(index=False))

    best_model_name = comparison_df.iloc[0]["model"]
    best_result = all_results[best_model_name]
    best_model = best_result["model"]
    print(f"\n   Best model: {best_model_name} (AUC: {best_result['metrics']['roc_auc']:.4f})")

    print("\n   Classification Report (Test Set):")
    from sklearn.metrics import classification_report
    print(classification_report(y_test, y_pred_test, target_names=["No Readmit", "Readmit"]))

    # Step 8: Save All Artifacts
    print("\n[8/8] Saving artifacts...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # Save best model
    save_model(best_model)
    print(f"   Best model saved: {MODEL_PATH}")

    # Save pipeline
    joblib.dump(pipeline, PIPELINE_PATH)
    print(f"   Pipeline saved: {PIPELINE_PATH}")

    # Save metrics
    save_metrics(best_result["metrics"], best_result["cm"])
    print(f"   Metrics saved: {METRICS_PATH}")

    # Save feature importance
    try:
        save_feature_importance(best_model, feature_names)
        print(f"   Feature importance saved: {FEATURE_IMPORTANCE_PATH}")
    except Exception as e:
        print(f"   Feature importance save skipped: {e}")

    # Save config
    config = {
        "seed": SEED,
        "test_size": 0.2,
        "validation_size": 0.2,
        "best_model": best_model_name,
        "best_metrics": best_result["metrics"],
        "all_comparison": comparison_df.to_dict("records"),
        "feature_count": len(feature_names),
        "train_samples": len(y_train),
        "val_samples": len(y_val),
        "test_samples": len(y_test),
        "cv_scores": [round(s, 4) for s in cv_scores] if "cv_scores" in dir() else []
    }
    save_config(config)
    print(f"   Config saved: {CONFIG_PATH}")

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)

    return best_model, pipeline, all_results


if __name__ == "__main__":
    run_full_pipeline()
