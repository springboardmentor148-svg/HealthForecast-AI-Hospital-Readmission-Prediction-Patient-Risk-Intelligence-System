from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, engine
from .routers import auth, users, patients, predictions, analytics
from .ml.predictor import ReadmissionPredictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist yet
    Base.metadata.create_all(bind=engine)
    # Warm up the ML model so the first prediction request isn't slow
    ReadmissionPredictor.get()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Hospital Readmission Prediction & Patient Risk Intelligence System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(patients.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
