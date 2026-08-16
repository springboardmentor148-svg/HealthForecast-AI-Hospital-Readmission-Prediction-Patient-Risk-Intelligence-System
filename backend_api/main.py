from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes import (
    auth_routes,
    prediction_routes,
    patient_routes,
    dashboard_routes,
    user_routes,
    treatment_routes,
    care_routes,
    admin_routes,
    dataset_routes,
    research_routes,
    model_routes,
    settings_routes,
    reports_routes,
    notifications_routes,
)
from routes.hospital_admin_routes import router as hospital_admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthForecastAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(prediction_routes.router)
app.include_router(patient_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(user_routes.router)
app.include_router(treatment_routes.router)
app.include_router(care_routes.router)
app.include_router(admin_routes.router)
app.include_router(dataset_routes.router)
app.include_router(research_routes.router)
app.include_router(model_routes.router)
app.include_router(model_routes.public_router)
app.include_router(settings_routes.router)
app.include_router(hospital_admin_router)
app.include_router(reports_routes.router)
app.include_router(notifications_routes.router)

@app.get("/")
def root():
    return {"status": "HealthForecastAI API running"}