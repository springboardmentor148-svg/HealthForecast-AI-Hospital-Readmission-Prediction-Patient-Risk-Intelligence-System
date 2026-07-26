import pandas as pd
import numpy as np


def audit_missing_values(df: pd.DataFrame) -> dict:
    null_counts = df.isnull().sum()
    null_pct = (null_counts / len(df) * 100).round(2)
    missing_report = pd.DataFrame({"count": null_counts, "percent": null_pct})
    missing_report = missing_report[missing_report["count"] > 0].sort_values("count", ascending=False)
    return {"report": missing_report, "total_missing_cells": int(null_counts.sum()), "total_columns_with_missing": int((null_counts > 0).sum())}


def audit_duplicates(df: pd.DataFrame) -> dict:
    dup = df.duplicated().sum()
    return {"duplicate_rows": int(dup), "percent_duplicate": round(dup / len(df) * 100, 4)}


def audit_dtypes(df: pd.DataFrame) -> dict:
    object_cols = df.select_dtypes(include="object").columns.tolist()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    issues = []
    for c in object_cols:
        unique_vals = df[c].nunique()
        if unique_vals == 1:
            issues.append({"column": c, "issue": "constant_column"})
        if unique_vals < 20 and unique_vals > 2:
            pass
    return {"object_columns": object_cols, "numeric_columns": numeric_cols, "issues": issues}


def audit_class_balance(y: pd.Series) -> dict:
    counts = y.value_counts()
    proportions = y.value_counts(normalize=True)
    return {"counts": counts.to_dict(), "proportions": proportions.to_dict(), "minority_pct": round(proportions.min() * 100, 2)}


def audit_outliers(df: pd.DataFrame, numeric_cols: list) -> pd.DataFrame:
    records = []
    for c in numeric_cols:
        q1 = df[c].quantile(0.25)
        q3 = df[c].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = ((df[c] < lower) | (df[c] > upper)).sum()
        records.append({"column": c, "outliers": int(outliers), "outlier_pct": round(outliers / len(df) * 100, 2), "lower_bound": round(lower, 2), "upper_bound": round(upper, 2)})
    return pd.DataFrame(records).sort_values("outliers", ascending=False)


def audit_correlations(df: pd.DataFrame, numeric_cols: list, threshold: float = 0.8) -> pd.DataFrame:
    corr = df[numeric_cols].corr().abs()
    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
    high_corr_pairs = [(col, row, round(upper.loc[row, col], 3)) for col in upper.columns for row in upper.index if upper.loc[row, col] > threshold]
    return pd.DataFrame(high_corr_pairs, columns=["col1", "col2", "correlation"]).sort_values("correlation", ascending=False)


def audit_low_value_features(df: pd.DataFrame, threshold_pct: float = 99.0) -> list:
    low_value = []
    for c in df.columns:
        mode_pct = df[c].value_counts(normalize=True).max() * 100
        if mode_pct >= threshold_pct:
            low_value.append({"column": c, "dominant_pct": round(mode_pct, 2), "dominant_value": df[c].mode()[0]})
    return low_value


def audit_data_leakage(df: pd.DataFrame) -> list:
    id_cols = [c for c in df.columns if "id" in c.lower() or "encounter" in c.lower() or "patient" in c.lower() or "nbr" in c.lower()]
    return id_cols
