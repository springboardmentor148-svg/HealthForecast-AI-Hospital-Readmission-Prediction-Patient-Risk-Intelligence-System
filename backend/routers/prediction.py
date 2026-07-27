"""AI prediction endpoints — serve readmission-risk predictions from the trained XGBoost model."""
import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import RequireRoles, get_current_user
from models.user import User
from schemas.prediction import PredictionListResponse, PredictionRequest, PredictionResponse
from services.prediction_service import PredictionService
from utils.constants import PREDICTION_ROLES
from utils.helpers import get_client_ip

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse,
             dependencies=[Depends(RequireRoles(*PREDICTION_ROLES))])
def predict(
    payload: PredictionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the hospital-readmission risk model on the given patient (by ID) or
    inline clinical data, returning the probability, risk category,
    confidence and a clinical recommendation.
    """
    service = PredictionService(db)
    return service.predict(payload, current_user, get_client_ip(request), str(request.url.path))


@router.get("/predictions/{prediction_id}", response_model=PredictionResponse)
def get_prediction(prediction_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve a single prediction result by ID."""
    service = PredictionService(db)
    return service.get_prediction(prediction_id)


@router.get("/patients/{patient_id}/predictions", response_model=PredictionListResponse)
def list_patient_predictions(
    patient_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List the prediction history for a specific patient."""
    service = PredictionService(db)
    items, total = service.list_for_patient(patient_id, page, page_size)
    return PredictionListResponse(total=total, page=page, page_size=page_size, items=items)
