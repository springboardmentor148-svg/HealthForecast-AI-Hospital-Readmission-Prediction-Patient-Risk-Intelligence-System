import re
from pathlib import Path

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, ModelVersion
from audit_utils import log_action
from routes.admin_routes import require_admin
from schemas import ModelVersionResponse, ModelOverviewResponse, RetrainRequest

router = APIRouter(prefix="/admin/models", tags=["System Admin - AI Models"])

# Public router — no login required, used by the landing page
public_router = APIRouter(prefix="/public", tags=["Public"])


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


# ---------- PUBLIC: latest model stats (no auth, for landing page) ----------
@public_router.get("/model-stats")
def public_model_stats(db: Session = Depends(get_db)):
    deployed = (
        db.query(ModelVersion)
        .filter(ModelVersion.status == "Deployed")
        .order_by(ModelVersion.id.desc())
        .first()
    )
    if not deployed:
        return {"accuracy": None, "version": None}

    return {
        "accuracy": f"{deployed.accuracy:.1f}%",
        "version": deployed.version,
    }


# ---------- RETRAIN MODEL ----------
@router.post("/retrain", response_model=ModelVersionResponse)
def retrain_model(
    payload: RetrainRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    try:
        response = requests.post(
            "http://ml_backend:5000/train",
            json={},
            timeout=1800,
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Training timed out (30 min limit)")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Could not reach ML training service (ml_backend)")

    result_data = response.json()

    if not result_data.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Training script failed: {result_data.get('error', 'Unknown error')[-1500:]}",
        )

    output = result_data.get("output", "")

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