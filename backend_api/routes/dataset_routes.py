import os
import csv
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User, Dataset
from audit_utils import log_action
from routes.admin_routes import require_admin
from schemas import DatasetResponse, DatasetListResponse

router = APIRouter(prefix="/admin/datasets", tags=["System Admin - Datasets"])

UPLOAD_DIR = Path("uploads/datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def format_size(size_bytes: int) -> str:
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    if size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"


def count_records(file_path: Path) -> int:
    """CSV ya JSON file mein kitni rows/records hai, best-effort count."""
    try:
        if file_path.suffix.lower() == ".csv":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.reader(f)
                row_count = sum(1 for _ in reader)
            return max(row_count - 1, 0)  # header line minus

        if file_path.suffix.lower() == ".json":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
            if isinstance(data, list):
                return len(data)
            return 1
    except Exception:
        pass
    return 0


def to_dataset_response(ds: Dataset, uploader_name: str) -> DatasetResponse:
    return DatasetResponse(
        id=ds.id,
        name=ds.name,
        records=ds.records,
        sizeLabel=format_size(ds.size_bytes),
        status=ds.status,
        notes=ds.notes,
        uploadedBy=uploader_name,
        lastUpdated=(ds.updated_at or ds.created_at).isoformat() + "Z",
    )


# ---------- LIST DATASETS ----------
@router.get("", response_model=DatasetListResponse)
def list_datasets(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()

    items = []
    for ds in datasets:
        uploader = db.query(User).filter(User.id == ds.uploaded_by).first()
        items.append(to_dataset_response(ds, uploader.full_name if uploader else "Unknown"))

    total_storage = sum(ds.size_bytes for ds in datasets)
    active_count = sum(1 for ds in datasets if ds.status == "Active")

    return DatasetListResponse(
        datasets=items,
        totalDatasets=len(datasets),
        totalStorageBytes=total_storage,
        activeDatasets=active_count,
    )


# ---------- UPLOAD DATASET ----------
@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    name: str = Form(...),
    notes: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    allowed_extensions = {".csv", ".json"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only .csv and .json files are supported")

    safe_filename = f"{admin.id}_{name.replace(' ', '_')}{ext}"
    dest_path = UPLOAD_DIR / safe_filename

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    size_bytes = len(contents)
    records = count_records(dest_path)

    new_dataset = Dataset(
        name=name,
        file_path=str(dest_path),
        records=records,
        size_bytes=size_bytes,
        status="Active",
        notes=notes,
        uploaded_by=admin.id,
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    log_action(
        db=db,
        actor=admin,
        action="DATASET_UPLOADED",
        category="Dataset",
        target=new_dataset.name,
        details=f"{records} records, {format_size(size_bytes)}",
    )

    return to_dataset_response(new_dataset, admin.full_name)


# ---------- DOWNLOAD DATASET ----------
@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(ds.file_path):
        raise HTTPException(status_code=404, detail="File missing on server")

    filename = Path(ds.file_path).name
    return FileResponse(ds.file_path, filename=filename)


# ---------- REMOVE DATASET ----------
@router.delete("/{dataset_id}")
def remove_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(ds.file_path):
        os.remove(ds.file_path)

    removed_name = ds.name
    db.delete(ds)
    db.commit()

    log_action(
        db=db,
        actor=admin,
        action="DATASET_REMOVED",
        category="Dataset",
        target=removed_name,
    )

    return {"message": "Dataset removed successfully"}