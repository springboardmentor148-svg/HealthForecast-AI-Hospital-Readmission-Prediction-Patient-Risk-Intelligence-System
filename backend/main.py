from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import database
from app.api.auth import router as auth_router
from app.utils.jwt_handler import verify_token



# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="HealthForecast AI",
    description="Hospital Readmission Prediction System",
    version="1.0.0"
)

# ============================================================
# CORS Configuration
# ============================================================

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Home API
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to HealthForecast AI Backend"
    }
    
  

    
# Test MongoDB connection
@app.get("/database")
async def test_database():

    # Get all collections from the database
    collections = await database.list_collection_names()

    # Return connection status and collection list
    return {
        "status": "Connected Successfully",
        "database": "healthforecast_ai",
        "collections": collections
    }


# Register authentication routes
app.include_router(auth_router)



# Protected API
@app.get("/profile")
async def get_profile(user=Depends(verify_token)):

    return {
        "message": "Access Granted",
        "user": user
    }