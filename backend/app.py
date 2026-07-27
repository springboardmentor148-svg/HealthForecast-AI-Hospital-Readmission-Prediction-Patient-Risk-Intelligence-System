import logging
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.api.inference import InferenceService
from src.api.schemas import PredictionRequest, PredictionResponse, RiskFactor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

service: InferenceService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global service
    logger.info("Starting application - loading model and pipeline...")
    try:
        service = InferenceService()
        logger.info("Model and pipeline loaded successfully.")
    except Exception:
        logger.exception("Failed to load model")
        service = None
        logger.warning("Application started without model - /predict and /model-info will return 503")
    yield
    logger.info("Shutting down application.")


app = FastAPI(
    title="HealthForecast AI Inference API",
    version="2.0.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": "Request validation failed", "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": service is not None,
    }


@app.get("/api/model-info")
async def model_info():
    if service is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    model = service.model
    return {
        "model_type": type(model).__name__,
        "features_count": model.n_features_in_,
        "objective": "binary:logistic",
        "classes": ["No Readmission", "Readmission"],
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if service is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        result = service.predict(request.model_dump())
        return PredictionResponse(
            riskScore=result["riskScore"],
            riskTier=result["riskTier"],
            readmissionLikelihood=result["readmissionLikelihood"],
            readmissionProbability=result["readmissionProbability"],
            dischargeReadinessScore=result["dischargeReadinessScore"],
            prediction=result["prediction"],
            riskFactors=[RiskFactor(**rf) for rf in result["riskFactors"]],
            careRecommendations=result["careRecommendations"],
        )
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed")
