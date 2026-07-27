import json
from pathlib import Path
from string import Template

from .config import METRICS_PATH, CONFIG_PATH, REPORTS_DIR

TEMPLATE_PATH = REPORTS_DIR / "report_template.md"


def generate_report() -> str:
    with open(METRICS_PATH) as f:
        metrics_data = json.load(f)
    with open(CONFIG_PATH) as f:
        config_data = json.load(f)

    metrics = metrics_data["metrics"]
    cm = metrics_data["confusion_matrix"]

    metrics_rows = "\n".join(f"| {k} | {v} |" for k, v in metrics.items())

    comparison_rows = "\n".join(
        f"| {comp['model']} | {comp.get('accuracy', 'N/A')} | {comp.get('precision', 'N/A')} | {comp.get('recall', 'N/A')} | {comp.get('f1_score', 'N/A')} | {comp.get('roc_auc', 'N/A')} |"
        for comp in config_data["all_comparison"]
    )

    with open(TEMPLATE_PATH) as f:
        template = Template(f.read())

    report_text = template.substitute(
        best_model=config_data["best_model"],
        seed=config_data["seed"],
        train_samples=config_data["train_samples"],
        val_samples=config_data["val_samples"],
        test_samples=config_data["test_samples"],
        feature_count=config_data["feature_count"],
        metrics_rows=metrics_rows,
        cm_00=f"{cm[0][0]:>6}",
        cm_01=f"{cm[0][1]:>6}",
        cm_10=f"{cm[1][0]:>6}",
        cm_11=f"{cm[1][1]:>6}",
        tn=cm[0][0],
        fp=cm[0][1],
        fn=cm[1][0],
        tp=cm[1][1],
        comparison_rows=comparison_rows,
    )

    report_path = REPORTS_DIR / "model_report.md"
    with open(report_path, "w") as f:
        f.write(report_text)
    print(f"Report saved: {report_path}")

    return report_text


if __name__ == "__main__":
    print(generate_report())
