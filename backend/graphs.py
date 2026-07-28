import os

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
IMAGES_DIR = os.path.join(BASE_DIR, "images")

RAW_DATA_PATH = os.path.join(DATASET_DIR, "diabetic_data.csv")
PREPROCESSED_DATA_PATH = os.path.join(DATASET_DIR, "preprocessed_data.csv")
FALLBACK_PREPROCESSED_DATA_PATH = os.path.join(DATASET_DIR, "clean_diabetic_data.csv")
TRAIN_DATA_PATH = os.path.join(DATASET_DIR, "train_data.csv")
TEST_DATA_PATH = os.path.join(DATASET_DIR, "test_data.csv")
MODEL_PATH = os.path.join(DATASET_DIR, "xgboost_model.pkl")
FEATURE_IMPORTANCE_PATH = os.path.join(DATASET_DIR, "feature_importance.csv")


plt.rcParams.update(
    {
        "figure.dpi": 300,
        "savefig.dpi": 300,
        "font.size": 12,
        "axes.titlesize": 18,
        "axes.labelsize": 13,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "legend.fontsize": 11,
    }
)


FINAL_ACCURACY = 65.39
FINAL_PRECISION = 66.21
FINAL_RECALL = 73.12
FINAL_F1 = 69.49
FINAL_ROC_AUC = 71.17

FINAL_CONFUSION_MATRIX = np.array(
    [
        [5287, 4094],
        [2950, 8023],
    ]
)

FINAL_PREDICTION_COUNTS = pd.Series(
    [8237, 12117],
    index=[0, 1],
    name="count",
)


def ensure_images_folder() -> None:
    os.makedirs(IMAGES_DIR, exist_ok=True)


def save_figure(path: str) -> None:
    plt.tight_layout()
    plt.savefig(path, dpi=300, bbox_inches="tight")
    plt.close()


def load_csv(preferred_path: str, fallback_path: str | None = None) -> pd.DataFrame:
    if os.path.exists(preferred_path):
        return pd.read_csv(preferred_path)
    if fallback_path and os.path.exists(fallback_path):
        return pd.read_csv(fallback_path)
    raise FileNotFoundError(f"Could not find {preferred_path}" + (f" or {fallback_path}" if fallback_path else ""))


def load_raw_dataset() -> pd.DataFrame:
    return load_csv(RAW_DATA_PATH)


def load_preprocessed_dataset() -> pd.DataFrame:
    return load_csv(PREPROCESSED_DATA_PATH, FALLBACK_PREPROCESSED_DATA_PATH)


def load_train_test_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    train_df = load_csv(TRAIN_DATA_PATH)
    test_df = load_csv(TEST_DATA_PATH)
    return train_df, test_df


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Could not find {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def load_feature_importance_dataframe(model, preprocessed_df: pd.DataFrame) -> pd.DataFrame:
    if os.path.exists(FEATURE_IMPORTANCE_PATH):
        importance_df = pd.read_csv(FEATURE_IMPORTANCE_PATH)
        if importance_df.shape[1] < 2:
            raise ValueError("feature_importance.csv must contain at least two columns: feature and importance.")
        importance_df = importance_df.iloc[:, :2].copy()
        importance_df.columns = ["Feature", "Importance"]
    else:
        feature_names = preprocessed_df.drop(columns=["readmitted"], errors="ignore").columns
        importances = getattr(model, "feature_importances_", None)
        if importances is None or len(importances) == 0:
            raise FileNotFoundError("Could not find dataset/feature_importance.csv and the model has no feature_importances_.")
        importance_df = pd.DataFrame({"Feature": feature_names, "Importance": importances})

    importance_df["Importance"] = pd.to_numeric(importance_df["Importance"], errors="coerce").fillna(0.0)
    importance_df = importance_df.sort_values("Importance", ascending=False).reset_index(drop=True)
    return importance_df


def format_value(value) -> str:
    if isinstance(value, (int, np.integer)):
        return str(int(value))
    if isinstance(value, (float, np.floating)):
        return f"{value:.2f}" if abs(value) < 100 else f"{value:.0f}"
    return str(value)


def render_table(df: pd.DataFrame, title: str, output_path: str, figsize=(11, 4.5), font_size=12, scale=(1.2, 1.8), title_pad=18) -> None:
    fig, ax = plt.subplots(figsize=figsize)
    ax.set_title(title, pad=title_pad, fontweight="bold")
    ax.set_xlabel(" ")
    ax.set_ylabel(" ")
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    table = ax.table(
        cellText=df.values,
        colLabels=df.columns,
        cellLoc="center",
        colLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(font_size)
    table.scale(*scale)

    for (row, col), cell in table.get_celld().items():
        cell.set_edgecolor("#B0B8C1")
        if row == 0:
            cell.set_facecolor("#1F4E79")
            cell.get_text().set_color("white")
            cell.get_text().set_weight("bold")
        elif row % 2 == 0:
            cell.set_facecolor("#F7FAFC")
        else:
            cell.set_facecolor("white")

    save_figure(output_path)


def render_flow_diagram(title: str, steps: list[str], output_path: str, figsize=(10, 8)) -> None:
    fig, ax = plt.subplots(figsize=figsize)
    ax.set_title(title, pad=20, fontweight="bold")
    ax.set_xlabel("Process")
    ax.set_ylabel("Stage")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    x_center = 0.5
    width = 0.62
    height = 0.09
    top = 0.9
    gap = 0.11

    for index, step in enumerate(steps):
        y_center = top - index * gap
        rect = plt.Rectangle(
            (x_center - width / 2, y_center - height / 2),
            width,
            height,
            facecolor="#EAF2F8",
            edgecolor="#1F4E79",
            linewidth=2,
        )
        ax.add_patch(rect)
        ax.text(x_center, y_center, step, ha="center", va="center", fontsize=12, fontweight="bold", color="#12324A")

        if index < len(steps) - 1:
            next_y = top - (index + 1) * gap + height / 2
            current_bottom = y_center - height / 2
            ax.annotate(
                "",
                xy=(x_center, next_y),
                xytext=(x_center, current_bottom),
                arrowprops=dict(arrowstyle="->", color="#1F4E79", linewidth=2),
            )

    save_figure(output_path)


def generate_dataset_shape_image(raw_df: pd.DataFrame, preprocessed_df: pd.DataFrame, train_df: pd.DataFrame, test_df: pd.DataFrame) -> None:
    feature_count = preprocessed_df.shape[1] - (1 if "readmitted" in preprocessed_df.columns else 0)
    target_count = 1 if "readmitted" in preprocessed_df.columns else 0
    summary = pd.DataFrame(
        {
            "Metric": ["Total Rows", "Total Columns", "Features", "Target", "Training Size", "Testing Size"],
            "Value": [raw_df.shape[0], raw_df.shape[1], feature_count, target_count, train_df.shape[0], test_df.shape[0]],
        }
    )
    summary["Value"] = summary["Value"].map(format_value)
    render_table(summary, "Dataset Shape Summary", os.path.join(IMAGES_DIR, "dataset_shape.png"), figsize=(10, 4.8), font_size=13, scale=(1.25, 1.9))


def generate_class_distribution_image(raw_df: pd.DataFrame) -> None:
    class_counts = raw_df["readmitted"].value_counts().sort_index()
    total = class_counts.sum()
    percentages = class_counts.values / total * 100

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(class_counts.index.astype(str), class_counts.values, color="#2A9D8F")
    ax.set_title("Class Distribution Before Train-Test Split", fontweight="bold")
    ax.set_xlabel("Readmitted Class")
    ax.set_ylabel("Count")
    ax.grid(axis="y", alpha=0.3)
    for bar, pct in zip(bars, percentages):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f"{pct:.1f}%", ha="center", va="bottom", fontweight="bold")
    save_figure(os.path.join(IMAGES_DIR, "class_distribution.png"))


def generate_missing_values_image(raw_df: pd.DataFrame) -> None:
    missing_values = raw_df.isna().sum() + (raw_df == "?").sum()
    missing_values = missing_values[missing_values > 0].sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(14, 8))
    if missing_values.empty:
        ax.text(0.5, 0.5, "No missing values found", ha="center", va="center", fontsize=16, fontweight="bold")
    else:
        bars = ax.barh(missing_values.index.astype(str), missing_values.values, color="#E76F51")
        ax.invert_yaxis()
        ax.set_title("Missing Values Before Preprocessing", fontweight="bold")
        ax.set_xlabel("Missing Values")
        ax.set_ylabel("Columns")
        ax.grid(axis="x", alpha=0.3)
        for bar in bars:
            width = bar.get_width()
            ax.text(width, bar.get_y() + bar.get_height() / 2, f"{int(width)}", va="center", ha="left")
    save_figure(os.path.join(IMAGES_DIR, "missing_values.png"))


def generate_correlation_heatmap_image(preprocessed_df: pd.DataFrame) -> None:
    numeric_df = preprocessed_df.select_dtypes(include=[np.number])
    corr = numeric_df.corr() if numeric_df.shape[1] >= 2 else pd.DataFrame()

    fig, ax = plt.subplots(figsize=(18, 14))
    if corr.empty:
        ax.text(0.5, 0.5, "Not enough numeric columns for correlation heatmap", ha="center", va="center", fontsize=16, fontweight="bold")
    else:
        im = ax.imshow(corr.values, cmap="coolwarm", vmin=-1, vmax=1)
        ax.set_xticks(np.arange(len(corr.columns)))
        ax.set_yticks(np.arange(len(corr.index)))
        ax.set_xticklabels(corr.columns, rotation=90)
        ax.set_yticklabels(corr.index)
        ax.set_title("Correlation Heatmap", fontweight="bold")
        ax.set_xlabel("Features")
        ax.set_ylabel("Features")
        for i in range(corr.shape[0]):
            for j in range(corr.shape[1]):
                ax.text(j, i, f"{corr.values[i, j]:.2f}", ha="center", va="center", fontsize=8, color="black")
        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    save_figure(os.path.join(IMAGES_DIR, "correlation_heatmap.png"))


def generate_feature_importance_image(importance_df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(14, 12))
    importance_df = importance_df.sort_values("Importance", ascending=False)
    bars = ax.barh(importance_df["Feature"].astype(str), importance_df["Importance"], color="#264653")
    ax.invert_yaxis()
    ax.set_title("Feature Importance", fontweight="bold")
    ax.set_xlabel("Importance")
    ax.set_ylabel("Feature")
    ax.grid(axis="x", alpha=0.3)
    for bar in bars:
        width = bar.get_width()
        ax.text(width, bar.get_y() + bar.get_height() / 2, f"{width:.6f}", va="center", ha="left", fontsize=9)
    save_figure(os.path.join(IMAGES_DIR, "feature_importance.png"))


def generate_confusion_matrix_image() -> None:
    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(FINAL_CONFUSION_MATRIX, cmap="Blues")
    ax.set_title("Confusion Matrix", fontweight="bold")
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("True Label")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels([0, 1])
    ax.set_yticklabels([0, 1])
    for i in range(FINAL_CONFUSION_MATRIX.shape[0]):
        for j in range(FINAL_CONFUSION_MATRIX.shape[1]):
            ax.text(j, i, f"{FINAL_CONFUSION_MATRIX[i, j]}", ha="center", va="center", color="black", fontweight="bold")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    save_figure(os.path.join(IMAGES_DIR, "confusion_matrix.png"))


def generate_prediction_distribution_image() -> None:
    fig, ax = plt.subplots(figsize=(8, 6))
    bars = ax.bar(FINAL_PREDICTION_COUNTS.index.astype(str), FINAL_PREDICTION_COUNTS.values, color="#6C8EBF")
    ax.set_title("Prediction Distribution", fontweight="bold")
    ax.set_xlabel("Predicted Class")
    ax.set_ylabel("Count")
    ax.grid(axis="y", alpha=0.3)
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, height, f"{int(height)}", ha="center", va="bottom")
    save_figure(os.path.join(IMAGES_DIR, "prediction_distribution.png"))


def generate_model_accuracy_image() -> None:
    metrics = pd.DataFrame(
        {
            "Metric": ["Accuracy", "Error Rate"],
            "Value": [FINAL_ACCURACY, 100 - FINAL_ACCURACY],
        }
    )
    fig, ax = plt.subplots(figsize=(8, 6))
    bars = ax.bar(metrics["Metric"], metrics["Value"], color=["#2A9D8F", "#E76F51"])
    ax.set_title("Model Accuracy vs Error Rate", fontweight="bold")
    ax.set_xlabel("Metric")
    ax.set_ylabel("Percentage")
    ax.grid(axis="y", alpha=0.3)
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, height, f"{height:.2f}%", ha="center", va="bottom")
    save_figure(os.path.join(IMAGES_DIR, "model_accuracy.png"))


def generate_classification_report_image() -> None:
    report = pd.DataFrame(
        {
            "Metric": ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"],
            "Value (%)": [FINAL_ACCURACY, FINAL_PRECISION, FINAL_RECALL, FINAL_F1, FINAL_ROC_AUC],
        }
    )
    report["Value (%)"] = report["Value (%)"].map(lambda x: f"{x:.2f}%")
    render_table(report, "Classification Report", os.path.join(IMAGES_DIR, "classification_report.png"), figsize=(10, 4.8), font_size=13, scale=(1.25, 1.9))


def generate_top_features_table_image(importance_df: pd.DataFrame) -> None:
    table_df = importance_df.copy()
    table_df["Importance"] = table_df["Importance"].map(lambda x: f"{x:.6f}")
    render_table(table_df, "Top Features Table", os.path.join(IMAGES_DIR, "top_features_table.png"), figsize=(14, 12), font_size=10, scale=(1.1, 1.35))


def generate_preprocessing_pipeline_image() -> None:
    steps = [
        "Raw Dataset",
        "Missing Value Handling",
        "Drop Unnecessary Columns",
        "Label Encoding",
        "Train-Test Split",
        "Feature Scaling",
        "XGBoost Training",
    ]
    render_flow_diagram("Preprocessing Pipeline", steps, os.path.join(IMAGES_DIR, "preprocessing_pipeline.png"), figsize=(10, 8))


def generate_model_workflow_image() -> None:
    steps = [
        "Dataset",
        "Preprocessing",
        "Train/Test Split",
        "XGBoost Model",
        "Prediction",
        "Evaluation",
    ]
    render_flow_diagram("Model Workflow", steps, os.path.join(IMAGES_DIR, "model_workflow.png"), figsize=(10, 7.5))


def main() -> None:
    ensure_images_folder()

    raw_df = load_raw_dataset()
    preprocessed_df = load_preprocessed_dataset()
    train_df, test_df = load_train_test_data()
    model = load_model()
    importance_df = load_feature_importance_dataframe(model, preprocessed_df)

    print("Generating Dataset Shape...")
    generate_dataset_shape_image(raw_df, preprocessed_df, train_df, test_df)
    print("Saved: images/dataset_shape.png")

    print("Generating Class Distribution...")
    generate_class_distribution_image(raw_df)
    print("Saved: images/class_distribution.png")

    print("Generating Missing Values...")
    generate_missing_values_image(raw_df)
    print("Saved: images/missing_values.png")

    print("Generating Correlation Heatmap...")
    generate_correlation_heatmap_image(preprocessed_df)
    print("Saved: images/correlation_heatmap.png")

    print("Generating Feature Importance...")
    generate_feature_importance_image(importance_df)
    print("Saved: images/feature_importance.png")

    print("Generating Confusion Matrix...")
    generate_confusion_matrix_image()
    print("Saved: images/confusion_matrix.png")

    print("Generating Prediction Distribution...")
    generate_prediction_distribution_image()
    print("Saved: images/prediction_distribution.png")

    print("Generating Model Accuracy...")
    generate_model_accuracy_image()
    print("Saved: images/model_accuracy.png")

    print("Generating Classification Report...")
    generate_classification_report_image()
    print("Saved: images/classification_report.png")

    print("Generating Top Features Table...")
    generate_top_features_table_image(importance_df)
    print("Saved: images/top_features_table.png")

    print("Generating Preprocessing Pipeline...")
    generate_preprocessing_pipeline_image()
    print("Saved: images/preprocessing_pipeline.png")

    print("Generating Model Workflow...")
    generate_model_workflow_image()
    print("Saved: images/model_workflow.png")

    print("=========================================")
    print("ALL IMAGES GENERATED SUCCESSFULLY")
    print("=========================================")
    print("Images generated:")
    print("dataset_shape.png")
    print("class_distribution.png")
    print("missing_values.png")
    print("correlation_heatmap.png")
    print("feature_importance.png")
    print("confusion_matrix.png")
    print("prediction_distribution.png")
    print("model_accuracy.png")
    print("classification_report.png")
    print("top_features_table.png")
    print("preprocessing_pipeline.png")
    print("model_workflow.png")


if __name__ == "__main__":
    main()