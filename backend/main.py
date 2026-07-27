# ==========================================
# FastAPI service — DRIS (Diabetes Readmission Intelligent System)
#
# Run with:  uvicorn main:app --reload --port 8000
#
# Expects these three files (produced by save_model.py)
# to sit in the same folder as this script:
#   readmission_model.joblib
#   feature_columns.json
#   category_options.json
#
# Also expects a running PostgreSQL database and a .env
# file — see .env.example and the setup README.
# ==========================================

import json
import re
import joblib
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import models
import schemas
import auth
from database import engine, get_db, Base

# ---------- create tables if they don't exist yet ----------
Base.metadata.create_all(bind=engine)

# ---------- load model + metadata once, at startup ----------
model = joblib.load("readmission_model.joblib")

with open("feature_columns.json") as f:
    FEATURE_COLUMNS = json.load(f)

with open("category_options.json") as f:
    CATEGORY_OPTIONS = json.load(f)

NUMERIC_FEATURES = [
    "time_in_hospital", "num_lab_procedures", "num_procedures",
    "num_medications", "number_outpatient", "number_emergency",
    "number_inpatient", "number_diagnoses",
    "insulin_flag", "diabetesMed_flag", "change_flag",
]

# SHAP TreeExplainer reads the tree structure directly — no background
# dataset needed for an XGBoost model, and it's fast enough to run
# per-request rather than needing to be precomputed.
explainer = shap.TreeExplainer(model)


def prettify_feature_name(col: str) -> str:
    """Turn a one-hot encoded column name like
    'discharge_grouped_Home_with_care' into 'Discharge grouped: Home with care'
    for display, without needing a hand-maintained lookup table."""
    for prefix in [
        "age_grouped", "race", "med_specialty_grouped", "primary_diagnosis",
        "secondary_diagnosis", "tertiary_diagnosis", "hba1c_grouped",
        "discharge_grouped", "admission_grouped",
    ]:
        if col.startswith(prefix + "_"):
            value = col[len(prefix) + 1:].replace("_", " ")
            label = prefix.replace("_", " ").capitalize()
            return f"{label}: {value}"
    return col.replace("_", " ").capitalize()


app = FastAPI(title="DRIS API", version="0.3.0")

# ---------- rate limiting ----------
# Protects /auth/login (brute-force attempts) and /predict (scraping /
# abuse of a paid inference endpoint) with per-IP limits.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow the React dev server to call this API directly.
# Tighten allow_origins before deploying anywhere real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request / response schemas (model itself) ----------
class PatientEncounter(BaseModel):
    age_grouped: str
    race: str
    med_specialty_grouped: str
    primary_diagnosis: str
    secondary_diagnosis: str
    tertiary_diagnosis: str
    hba1c_grouped: str
    discharge_grouped: str
    admission_grouped: str

    time_in_hospital: int = Field(ge=1, le=14)
    num_lab_procedures: int = Field(ge=0, le=150)
    num_procedures: int = Field(ge=0, le=10)
    num_medications: int = Field(ge=0, le=100)
    number_outpatient: int = Field(ge=0, le=50)
    number_emergency: int = Field(ge=0, le=50)
    number_inpatient: int = Field(ge=0, le=50)
    number_diagnoses: int = Field(ge=1, le=20)
    insulin_flag: int = Field(ge=0, le=1)
    diabetesMed_flag: int = Field(ge=0, le=1)
    change_flag: int = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    probability: float
    risk_band: str
    threshold_used: float
    top_factors: List[schemas.ContributingFactor]
    recommendations: List[str]


# ---------- model helpers ----------
THRESHOLD = 0.56  # chosen from your precision_recall_curve F1-optimal point


def risk_band(p: float) -> str:
    if p >= 0.60:
        return "High"
    if p >= 0.35:
        return "Moderate"
    return "Low"


def encode_encounter(payload: PatientEncounter) -> pd.DataFrame:
    """Turn one incoming request into a single-row DataFrame with the
    exact one-hot encoded column layout the model was trained on."""

    categorical_fields = {
        "age_grouped": payload.age_grouped,
        "race": payload.race,
        "med_specialty_grouped": payload.med_specialty_grouped,
        "primary_diagnosis": payload.primary_diagnosis,
        "secondary_diagnosis": payload.secondary_diagnosis,
        "tertiary_diagnosis": payload.tertiary_diagnosis,
        "hba1c_grouped": payload.hba1c_grouped,
        "discharge_grouped": payload.discharge_grouped,
        "admission_grouped": payload.admission_grouped,
    }

    for col, value in categorical_fields.items():
        allowed = CATEGORY_OPTIONS.get(col, [])
        if value not in allowed:
            raise HTTPException(
                status_code=422,
                detail=f"'{value}' is not a recognized value for '{col}'. "
                       f"Allowed: {allowed}",
            )

    row = {col: 0 for col in FEATURE_COLUMNS}

    for col in NUMERIC_FEATURES:
        if col in row:
            row[col] = getattr(payload, col)

    for col, value in categorical_fields.items():
        dummy_col = f"{col}_{value}"
        dummy_col = dummy_col.replace("[", "_").replace("]", "_").replace("<", "_").replace(",", "_")
        if dummy_col in row:
            row[dummy_col] = 1

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def top_shap_factors(row: pd.DataFrame, n: int = 5) -> List[schemas.ContributingFactor]:
    """Real SHAP values for this specific prediction — the model's
    actual reasoning, not an approximation. Positive impact = pushed
    risk up; negative = pushed risk down."""
    shap_values = explainer.shap_values(row)
    values = shap_values[0] if shap_values.ndim > 1 else shap_values
    pairs = list(zip(FEATURE_COLUMNS, values))
    pairs.sort(key=lambda p: abs(p[1]), reverse=True)
    top = pairs[:n]
    return [
        schemas.ContributingFactor(feature=prettify_feature_name(col), impact=round(float(val), 4))
        for col, val in top
    ]


def generate_recommendations(payload: PatientEncounter, band: str) -> List[str]:
    """Deterministic, rule-based care suggestions tied directly to the
    submitted encounter and the model's risk band — this is clinical
    logic layered on top of a real prediction, not a separate model
    and not a claim about proven treatment effectiveness. Every rule
    here maps directly to a field the clinician actually entered."""
    recs = []

    if band == "High" and payload.number_inpatient >= 2:
        recs.append(
            "History of multiple recent inpatient stays — schedule a "
            "follow-up call within 7 days of discharge."
        )
    if payload.discharge_grouped == "Home" and band in ("Moderate", "High"):
        recs.append(
            "Discharged home without additional care support — consider "
            "a home health referral given the elevated risk."
        )
    if payload.hba1c_grouped in ("High, changed", "High, not changed"):
        recs.append(
            "Elevated HbA1c on this encounter — recommend an endocrinology "
            "or diabetes educator follow-up."
        )
    if payload.change_flag == 1 and band == "High":
        recs.append(
            "Medication regimen changed during a high-risk stay — recommend "
            "a pharmacist medication reconciliation before discharge."
        )
    if payload.admission_grouped == "Emergency" and band == "High":
        recs.append(
            "Emergency admission with high predicted readmission risk — "
            "consider enrollment in a care coordination / case management program."
        )
    if payload.number_emergency >= 2:
        recs.append(
            "Multiple recent ER visits — evaluate for gaps in outpatient "
            "management or access to care."
        )
    if payload.discharge_grouped == "Transferred_facility":
        recs.append(
            "Transferred to another facility — confirm care summary and "
            "medication list are communicated to the receiving team."
        )

    if not recs:
        recs.append(
            "No elevated-risk factors identified by these rules — standard "
            "discharge planning appears appropriate."
        )

    return recs


# ==========================================
# AUTH ROUTES
# ==========================================
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Bootstrap pattern: the very first account created becomes admin,
    # so there's always at least one admin without needing manual DB
    # edits. Every account after that defaults to "clinician".
    is_first_user = db.query(models.User).count() == 0

    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=auth.hash_password(payload.password),
        role="admin" if is_first_user else "clinician",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = auth.create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token)


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/auth/forgot-password", response_model=schemas.ForgotPasswordResponse)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Always return a response shape, even if the email doesn't exist —
    # otherwise this endpoint could be used to check which emails have
    # accounts, which is its own small privacy leak.
    if not user:
        return schemas.ForgotPasswordResponse(reset_token="", expires_in_minutes=auth.RESET_TOKEN_EXPIRE_MINUTES)

    token = auth.create_reset_token(user.id)
    return schemas.ForgotPasswordResponse(reset_token=token, expires_in_minutes=auth.RESET_TOKEN_EXPIRE_MINUTES)


@app.post("/auth/reset-password", status_code=204)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = auth.verify_reset_token(payload.token)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token.")
    user.hashed_password = auth.hash_password(payload.new_password)
    db.commit()


@app.post("/auth/change-password", status_code=204)
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not auth.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    current_user.hashed_password = auth.hash_password(payload.new_password)
    db.commit()


# ==========================================
# MODEL ROUTES
# ==========================================
@app.get("/health")
def health():
    return {"status": "ok", "model_features": len(FEATURE_COLUMNS)}


@app.get("/options")
def options():
    """Lets the frontend build its dropdowns from the model's real
    training-time categories instead of hardcoding them."""
    return CATEGORY_OPTIONS


@app.post("/predict", response_model=PredictionResponse)
@limiter.limit("30/minute")
def predict(
    request: Request,
    payload: PatientEncounter,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    row = encode_encounter(payload)
    proba = float(model.predict_proba(row)[:, 1][0])
    band = risk_band(proba)
    factors = top_shap_factors(row)
    recommendations = generate_recommendations(payload, band)

    # Save every scored encounter — this is what makes the dashboard's
    # history real data instead of a mock array.
    record = models.PredictionRecord(
        user_id=current_user.id,
        input_payload=payload.dict(),
        probability=round(proba, 4),
        risk_band=band,
        threshold_used=THRESHOLD,
    )
    db.add(record)
    db.commit()

    return PredictionResponse(
        probability=round(proba, 4),
        risk_band=band,
        threshold_used=THRESHOLD,
        top_factors=factors,
        recommendations=recommendations,
    )


@app.get("/predictions/mine", response_model=List[schemas.PredictionHistoryItem])
def my_predictions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    risk_band: Optional[str] = None,
    diagnosis: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
):
    """Powers the dashboard/history views with this user's real,
    previously-scored encounters. Filtering is done in Python rather
    than with database-specific JSON operators, which keeps this
    portable across database backends and simple to reason about at
    the row counts a single clinician will realistically generate."""
    query = (
        db.query(models.PredictionRecord)
        .filter(models.PredictionRecord.user_id == current_user.id)
        .order_by(models.PredictionRecord.created_at.desc())
    )
    records = query.all()

    if risk_band:
        records = [r for r in records if r.risk_band == risk_band]
    if diagnosis:
        records = [
            r for r in records
            if diagnosis.lower() in str(r.input_payload.get("primary_diagnosis", "")).lower()
        ]

    return records[skip: skip + limit]


@app.get("/predictions/all", response_model=List[schemas.AdminPredictionItem])
def all_predictions(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
    risk_band: Optional[str] = None,
    diagnosis: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Admin-only: every clinician's scored encounters, not just the
    caller's own — this is what makes the tool usable across a team
    rather than as isolated single-user silos."""
    query = (
        db.query(models.PredictionRecord, models.User)
        .join(models.User, models.PredictionRecord.user_id == models.User.id)
        .order_by(models.PredictionRecord.created_at.desc())
    )
    rows = query.all()

    results = []
    for record, user in rows:
        if risk_band and record.risk_band != risk_band:
            continue
        if diagnosis and diagnosis.lower() not in str(record.input_payload.get("primary_diagnosis", "")).lower():
            continue
        results.append(schemas.AdminPredictionItem(
            id=record.id,
            probability=record.probability,
            risk_band=record.risk_band,
            threshold_used=record.threshold_used,
            created_at=record.created_at,
            input_payload=record.input_payload,
            user_email=user.email,
            user_full_name=user.full_name,
        ))

    return results[skip: skip + limit]
