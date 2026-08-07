from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine

# Import all API modules cleanly
from app.api import auth, predict, patients, dashboard, reports, settings

# Create DB tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Diabetes Readmission API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Server Running Successfully"}

# Include all routers with correct URL prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(predict.router, prefix="/api/predict", tags=["Predict"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])