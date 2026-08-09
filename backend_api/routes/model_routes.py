import re
import subprocess
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, ModelVersion
from audit_utils import log_action
from routes.admin_routes import require_admin
from schemas import ModelVersionResponse, ModelOverviewResponse, RetrainRequest

router = APIRouter(prefix="/admin/models", tags=["System Admin - AI Models"])

# backend_api aur backend HealthForecastAI ke andar sibling folders hai
TRAINING_DIR = Path(__file__).resolve().parent.parent.parent / "backend"
TRAINING_SCRIPT = "model_training.py"

# Training script isi venv ke Python se chalti hai (backend_api ke venv se alag)
TRAINING_PYTHON = Path(__file__).resolve().parent.parent.parent / "venv" / "Scripts" / "python.exe"


def next_version(db: Session) -> str:
    last = db.query(ModelVersion).order_by(ModelVersion.id.desc()).first()
    if not last:
        return "v1.0.0"
    try:
        major, minor, patch = last.version.lstrip("v").split(".")
        return f"v{major}.{minor}.{int(patch) + 1}"
    except Exception:
        return f"v{last.id + 1}.0.0"


def parse_metric(output: str, label: str) -> float:
    match = re.search(rf"{label}\s*:\s*([\d.]+)%", output)
    return float(match.group(1)) if match else 0.0


def to_response(m: ModelVersion) -> ModelVersionResponse:
    return ModelVersionResponse(
        id=m.id,
        version=m.version,
        trainedOn=m.trained_on or "—",
        accuracy=f"{m.accuracy:.2f}%",
        precision=f"{m.precision:.2f}%",
        recall=f"{m.recall:.2f}%",
        rocAuc=f"{m.roc_auc:.2f}",
        status=m.status,
        date=(m.created_at.isoformat() + "Z") if m.created_at else "",
    )


# ---------- LIST MODEL VERSIONS ----------
@router.get("", response_model=ModelOverviewResponse)
def list_models(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    versions = db.query(ModelVersion).order_by(ModelVersion.id.desc()).all()
    deployed = next((v for v in versions if v.status == "Deployed"), None)

    return ModelOverviewResponse(
        versions=[to_response(v) for v in versions],
        latestAccuracy=f"{deployed.accuracy:.2f}%" if deployed else "—",
        latestPrecision=f"{deployed.precision:.2f}%" if deployed else "—",
        latestRecall=f"{deployed.recall:.2f}%" if deployed else "—",
        latestRocAuc=f"{deployed.roc_auc:.2f}" if deployed else "—",
        deployedVersion=deployed.version if deployed else "—",
    )


# ---------- RETRAIN MODEL ----------
@router.post("/retrain", response_model=ModelVersionResponse)
def retrain_model(
    payload: RetrainRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    script_path = TRAINING_DIR / TRAINING_SCRIPT
    if not script_path.exists():
        raise HTTPException(status_code=404, detail=f"Training script not found at {script_path}")

    python_exe = str(TRAINING_PYTHON) if TRAINING_PYTHON.exists() else "python"

    # dataset/ folder backend ka sibling hai (project root mein), isliye
    # script ko root folder se chalate hai taaki relative paths sahi resolve ho
    project_root = TRAINING_DIR.parent

    try:
        result = subprocess.run(
            [python_exe, str(script_path)],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=1800,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Training timed out (30 min limit)")

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Training script failed: {result.stderr[-1500:]}",
        )

    output = result.stdout

    accuracy = parse_metric(output, "Accuracy")
    precision = parse_metric(output, "Precision")
    recall = parse_metric(output, "Recall")
    roc_auc = parse_metric(output, "ROC-AUC") / 100  # decimal fraction (0-1) ke roop mein store karo

    # purana deployed version archive karo
    db.query(ModelVersion).filter(ModelVersion.status == "Deployed").update({"status": "Archived"})

    new_version = ModelVersion(
        version=next_version(db),
        trained_on=payload.trainedOn or "dataset/train_data.csv",
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        roc_auc=roc_auc,
        status="Deployed",
        trained_by=admin.id,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    log_action(
        db=db,
        actor=admin,
        action="MODEL_RETRAINED",
        category="Model",
        target=new_version.version,
        details=f"Accuracy {accuracy:.2f}%",
    )

    return to_response(new_version)