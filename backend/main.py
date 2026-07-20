"""
HealthForecast AI - FastAPI Backend
====================================
Implements (at prototype scope) the modules described in the project
specification:
  - Risk Prediction Module         -> POST /api/predict
  - Healthcare Analytics Dashboard -> GET  /api/model-metrics, /api/dataset-summary
  - Patient Data / UI support      -> GET  /api/schema
  - Clinical Decision Support      -> derived "care recommendations" returned
                                       alongside every prediction

Tech stack matches the PDF: Python (FastAPI) backend, model trained with
Scikit-learn / XGBoost, served via joblib.
"""

import json
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="HealthForecast AI",
    description="Hospital Readmission Prediction & Patient Risk Intelligence API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Load trained artifacts at startup
# ---------------------------------------------------------------------
MODEL_PATH = MODEL_DIR / "readmission_model.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.json"
UI_SCHEMA_PATH = MODEL_DIR / "ui_schema.json"

if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model not found at {MODEL_PATH}. Run model/train_model.py first."
    )

model_pipeline = joblib.load(MODEL_PATH)
metadata = json.loads(METADATA_PATH.read_text())
ui_schema = json.loads(UI_SCHEMA_PATH.read_text())

NUMERIC_COLS = metadata["numeric_cols"]
CATEGORICAL_COLS = metadata["categorical_cols"]
FEATURE_ORDER = metadata["feature_order"]


# ---------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------
class PatientEncounter(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    # Demographics
    race: str = "Caucasian"
    gender: str = "Female"
    age: str = "[60-70)"

    # Admission / encounter details
    admission_type_id: int = Field(default=1, ge=1, le=8)
    discharge_disposition_id: int = Field(default=1, ge=1, le=30)
    admission_source_id: int = Field(default=7, ge=1, le=25)
    time_in_hospital: int = Field(default=3, ge=1, le=14)

    # Utilization / clinical volume
    num_lab_procedures: int = Field(default=40, ge=0, le=150)
    num_procedures: int = Field(default=1, ge=0, le=10)
    num_medications: int = Field(default=15, ge=0, le=90)
    number_outpatient: int = Field(default=0, ge=0, le=50)
    number_emergency: int = Field(default=0, ge=0, le=50)
    number_inpatient: int = Field(default=0, ge=0, le=50)
    number_diagnoses: int = Field(default=7, ge=1, le=16)

    # Diagnoses (ICD-9-like codes as provided in the dataset)
    diag_1: Optional[str] = "250.83"
    diag_2: Optional[str] = None
    diag_3: Optional[str] = None

    # Labs
    max_glu_serum: str = "None"
    A1Cresult: str = "None"

    # Medications (Down / No / Steady / Up as coded in the dataset)
    metformin: str = "No"
    repaglinide: str = "No"
    nateglinide: str = "No"
    chlorpropamide: str = "No"
    glimepiride: str = "No"
    acetohexamide: str = "No"
    glipizide: str = "No"
    glyburide: str = "No"
    tolbutamide: str = "No"
    pioglitazone: str = "No"
    rosiglitazone: str = "No"
    acarbose: str = "No"
    miglitol: str = "No"
    troglitazone: str = "No"
    tolazamide: str = "No"
    examide: str = "No"
    citoglipton: str = "No"
    insulin: str = "No"

    # Combination medications (hyphenated column names -> use alias)
    glyburide_metformin: str = Field(default="No", alias="glyburide-metformin")
    glipizide_metformin: str = Field(default="No", alias="glipizide-metformin")
    glimepiride_pioglitazone: str = Field(default="No", alias="glimepiride-pioglitazone")
    metformin_rosiglitazone: str = Field(default="No", alias="metformin-rosiglitazone")
    metformin_pioglitazone: str = Field(default="No", alias="metformin-pioglitazone")

    change: str = "No"
    diabetesMed: str = "Yes"


class RiskPrediction(BaseModel):
    readmission_probability: float
    risk_category: str
    risk_score: int
    model_used: str
    care_recommendations: list[str]
    risk_factors: list[str]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def to_model_dataframe(encounter: PatientEncounter) -> pd.DataFrame:
    """Convert the validated request into a single-row DataFrame that
    matches the column names / order the training pipeline expects."""
    data = encounter.model_dump(by_alias=True)
    row = {col: data.get(col) for col in FEATURE_ORDER}
    return pd.DataFrame([row])


def categorize_risk(probability: float) -> tuple[str, int]:
    score = round(probability * 100)
    if probability >= 0.5:
        return "High", score
    if probability >= 0.25:
        return "Medium", score
    return "Low", score


def build_care_recommendations(encounter: PatientEncounter, risk_category: str) -> list[str]:
    """Lightweight rule-based Clinical Decision Support layer that sits on
    top of the ML risk score, per the 'Clinical Decision Support Module'
    in the spec (care recommendations / follow-up planning / discharge
    support)."""
    recs = []
    if risk_category == "High":
        recs.append("Schedule a follow-up visit within 7 days of discharge.")
        recs.append("Assign a care coordinator / case manager for post-discharge monitoring.")
    elif risk_category == "Medium":
        recs.append("Schedule a follow-up visit within 14-30 days of discharge.")
    else:
        recs.append("Routine follow-up per standard discharge protocol.")

    if encounter.number_inpatient and encounter.number_inpatient >= 2:
        recs.append("Review recent inpatient history; consider care-transition program enrollment.")
    if encounter.number_emergency and encounter.number_emergency >= 2:
        recs.append("Evaluate frequent ED utilization; consider outpatient care plan adjustment.")
    if encounter.num_medications and encounter.num_medications >= 20:
        recs.append("Conduct medication reconciliation given high medication count.")
    if encounter.A1Cresult in (">7", ">8"):
        recs.append("Reinforce diabetes self-management education (elevated A1C on record).")
    if encounter.diabetesMed == "Yes" and encounter.change == "Ch":
        recs.append("Monitor closely following recent diabetes medication change.")
    if encounter.time_in_hospital and encounter.time_in_hospital >= 7:
        recs.append("Extended stay noted; assess discharge readiness and home-support needs.")
    return recs


def build_risk_factors(encounter: PatientEncounter) -> list[str]:
    factors = []
    if encounter.number_inpatient and encounter.number_inpatient >= 1:
        factors.append(f"{encounter.number_inpatient} prior inpatient admission(s)")
    if encounter.number_emergency and encounter.number_emergency >= 1:
        factors.append(f"{encounter.number_emergency} prior emergency visit(s)")
    if encounter.number_outpatient and encounter.number_outpatient >= 1:
        factors.append(f"{encounter.number_outpatient} prior outpatient visit(s)")
    if encounter.time_in_hospital and encounter.time_in_hospital >= 7:
        factors.append("Extended length of stay")
    if encounter.num_medications and encounter.num_medications >= 20:
        factors.append("High medication count")
    if encounter.number_diagnoses and encounter.number_diagnoses >= 9:
        factors.append("High diagnosis count / comorbidity burden")
    if encounter.age in ("[70-80)", "[80-90)", "[90-100)"):
        factors.append("Advanced age group")
    if not factors:
        factors.append("No major risk factors identified from provided data")
    return factors


# ---------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "model": metadata["best_model"]}


@app.get("/api/schema")
def get_schema():
    """Feeds the frontend form: dropdown options + numeric ranges."""
    return {
        "categorical_options": ui_schema["categorical_options"],
        "numeric_stats": ui_schema["numeric_stats"],
    }


@app.get("/api/model-metrics")
def get_model_metrics():
    """Healthcare Analytics Dashboard -> AI Model Performance panel."""
    return {
        "best_model": metadata["best_model"],
        "metrics_by_model": metadata["metrics"],
    }


@app.get("/api/dataset-summary")
def dataset_summary():
    """Basic dataset-level stats for the Hospital Performance dashboard."""
    df = pd.read_csv(BASE_DIR / "data" / "diabetic_data.csv")
    df = df.replace("?", pd.NA)
    total = len(df)
    readmit_counts = df["readmitted"].value_counts().to_dict()
    return {
        "total_encounters": total,
        "readmission_breakdown": readmit_counts,
        "avg_time_in_hospital": round(float(df["time_in_hospital"].mean()), 2),
        "avg_num_medications": round(float(df["num_medications"].mean()), 2),
        "diabetes_med_rate": round(
            float((df["diabetesMed"] == "Yes").mean()) * 100, 2
        ),
    }


@app.post("/api/predict", response_model=RiskPrediction)
def predict(encounter: PatientEncounter):
    try:
        X = to_model_dataframe(encounter)
        probability = float(model_pipeline.predict_proba(X)[0, 1])
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=f"Prediction failed: {exc}")

    risk_category, risk_score = categorize_risk(probability)
    recommendations = build_care_recommendations(encounter, risk_category)
    risk_factors = build_risk_factors(encounter)

    return RiskPrediction(
        readmission_probability=round(probability, 4),
        risk_category=risk_category,
        risk_score=risk_score,
        model_used=metadata["best_model"],
        care_recommendations=recommendations,
        risk_factors=risk_factors,
    )


# ---------------------------------------------------------------------
# Serve the static frontend (basic HTML UI)
# ---------------------------------------------------------------------
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))
