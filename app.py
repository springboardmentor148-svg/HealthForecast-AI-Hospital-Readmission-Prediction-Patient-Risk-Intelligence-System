# ==========================================================
# Prognexa AI Backend
# Hospital Readmission Prediction API
# ==========================================================

import json
import numpy as np
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional
import uuid
import traceback

from config import MONGO_URI, DB_NAME, JWT_SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from schemas import (
    PatientData, UserCreate, UserInDB, Token, TokenData,
    ChangePassword, AssignPatient
)
from predict import predict_patient

app = FastAPI(
    title="Prognexa AI",
    version="1.0.0",
    description="Hospital Readmission Prediction & Patient Risk Intelligence System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    db.command("ping")
    print(f"✅ Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    db = None

users_collection = db["users"] if db is not None else None
patients_collection = db["patients"] if db is not None else None
predictions_collection = db["predictions"] if db is not None else None
reports_collection = db["reports"] if db is not None else None

# ==========================================================
# AUTH SETUP – only pbkdf2_sha256 (no bcrypt)
# ==========================================================
pwd_context = CryptContext(schemes=["pbkdf2_sha256"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ==========================================================
# HELPER FUNCTIONS
# ==========================================================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    if users_collection is None:
        return None
    user = users_collection.find_one({"username": username})
    if user:
        return UserInDB(
            username=user["username"],
            hashed_password=user["hashed_password"],
            role=user["role"],
            full_name=user.get("full_name"),
            department=user.get("department"),
            assigned_patients=user.get("assigned_patients", []),
            disabled=user.get("disabled", False)
        )
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: UserInDB = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' not allowed. Required: {allowed_roles}"
            )
        return current_user
    return role_checker

# ==========================================================
# CONVERT NUMPY TYPES TO PYTHON TYPES (for MongoDB)
# ==========================================================

def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    if isinstance(obj, tuple):
        return tuple(convert_numpy(i) for i in obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.generic):
        return obj.item()
    return obj

# ==========================================================
# PATIENT ASSIGNMENT HELPER (with sync capability)
# ==========================================================

def add_patient_to_doctor(patient_id: str, doctor_username: str):
    if users_collection is not None and doctor_username:
        result = users_collection.update_one(
            {"username": doctor_username},
            {"$addToSet": {"assigned_patients": patient_id}}
        )
        print(f"📌 Assigned patient {patient_id} to doctor {doctor_username}. Matched: {result.matched_count}, Modified: {result.modified_count}")

def sync_doctor_patients(doctor_username: str):
    if patients_collection is None or users_collection is None:
        return
    patients = patients_collection.find({"assigned_doctor": doctor_username})
    patient_ids = [p["patient_id"] for p in patients]
    if patient_ids:
        users_collection.update_one(
            {"username": doctor_username},
            {"$addToSet": {"assigned_patients": {"$each": patient_ids}}}
        )
        print(f"🔄 Synced {len(patient_ids)} patients for doctor {doctor_username}")

def get_patient_summary_for_report():
    if patients_collection is None:
        return []
    patients = list(patients_collection.find({}))
    summary = []
    for p in patients:
        risk = "N/A"
        prob = None
        if "prediction_result" in p and p["prediction_result"]:
            risk = p["prediction_result"].get("risk_level", "N/A")
            prob = p["prediction_result"].get("probability", None)
        summary.append({
            "patient_id": p["patient_id"],
            "name": p.get("name", "Unknown"),
            "risk_level": risk,
            "probability": prob,
            "assigned_doctor": p.get("assigned_doctor", "Unassigned")
        })
    return summary

# ==========================================================
# ENDPOINTS
# ==========================================================

@app.get("/")
def home():
    return {"application": "Prognexa AI", "status": "Running", "version": "1.0.0"}

@app.get("/dbcheck")
async def db_check():
    if db is None:
        return {"status": "error", "message": "MongoDB not connected"}
    try:
        db.command("ping")
        return {"status": "success", "message": f"Connected to {DB_NAME}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/register")
def register(user: UserCreate):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "hashed_password": hashed,
        "role": user.role,
        "full_name": user.full_name or user.username,
        "department": user.department or "",
        "assigned_patients": [],
        "disabled": False,
        "created_at": datetime.utcnow()
    }
    users_collection.insert_one(user_doc)
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "username": user.username}

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@app.get("/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "full_name": current_user.full_name,
        "department": current_user.department,
        "assigned_patients": current_user.assigned_patients
    }

# ---------- PATIENTS ----------
@app.get("/patients")
def get_patients(current_user: UserInDB = Depends(get_current_active_user)):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    if current_user.role == "doctor":
        sync_doctor_patients(current_user.username)
        assigned = current_user.assigned_patients or []
        patients = list(patients_collection.find({
            "$or": [
                {"patient_id": {"$in": assigned}},
                {"assigned_doctor": current_user.username}
            ]
        }))
        seen = set()
        unique = []
        for p in patients:
            pid = p["patient_id"]
            if pid not in seen:
                seen.add(pid)
                unique.append(p)
        patients = unique
        
    elif current_user.role == "researcher":
        patients = list(patients_collection.find({}))
        for p in patients:
            p["name"] = "ANONYMIZED"
            p["patient_id"] = "ANON-" + p["patient_id"][-4:]
            if "clinical_data" in p:
                p["clinical_data"] = {k: v for k, v in p["clinical_data"].items() 
                                      if k not in ["weight", "payer_code", "medical_specialty"]}
    else:
        patients = list(patients_collection.find({}))
    
    for p in patients:
        p["_id"] = str(p["_id"])
    return patients

@app.post("/patients")
def create_patient(
    patient: PatientData,
    current_user: UserInDB = Depends(require_role(["doctor", "sysadmin"]))
):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    patient_id = str(uuid.uuid4())[:8]
    doctor_username = current_user.username if current_user.role == "doctor" else None
    patient_doc = {
        "patient_id": patient_id,
        "name": f"Patient-{patient_id}",
        "age_group": patient.age,
        "gender": patient.gender,
        "assigned_doctor": doctor_username,
        "clinical_data": patient.model_dump(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    patients_collection.insert_one(patient_doc)
    if doctor_username:
        add_patient_to_doctor(patient_id, doctor_username)
    return {"patient_id": patient_id, "message": "Patient created"}

@app.post("/patients/assign")
def assign_patient(
    assign_data: AssignPatient,
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin"]))
):
    if patients_collection is None or users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    patient = patients_collection.find_one({"patient_id": assign_data.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    doctor = users_collection.find_one({"username": assign_data.doctor_username})
    if not doctor or doctor.get("role") != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    users_collection.update_one(
        {"username": assign_data.doctor_username},
        {"$addToSet": {"assigned_patients": assign_data.patient_id}}
    )
    patients_collection.update_one(
        {"patient_id": assign_data.patient_id},
        {"$set": {"assigned_doctor": assign_data.doctor_username}}
    )
    return {"message": f"Patient {assign_data.patient_id} assigned to {assign_data.doctor_username}"}

@app.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(status_code=403, detail="You can only delete your own patients")
    elif current_user.role not in ["admin", "sysadmin"]:
        raise HTTPException(status_code=403, detail="Only admins, system admins, and doctors can delete patients")
    
    doctor_username = patient.get("assigned_doctor")
    if doctor_username:
        users_collection.update_one(
            {"username": doctor_username},
            {"$pull": {"assigned_patients": patient_id}}
        )
    
    patients_collection.delete_one({"patient_id": patient_id})
    predictions_collection.delete_many({"patient_id": patient_id})
    
    return {"message": f"Patient {patient_id} deleted successfully"}

@app.post("/predict")
def predict(data: PatientData, current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.role not in ["doctor", "sysadmin"]:
        raise HTTPException(status_code=403, detail="Only doctors and system administrators can perform predictions")
    
    if patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        result = predict_patient(data.model_dump())
    except Exception as e:
        print("Prediction error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction engine error: {str(e)}")
    
    result = json.loads(json.dumps(result, default=float))
    
    patient_id = str(uuid.uuid4())[:8]
    doctor_username = current_user.username if current_user.role == "doctor" else None
    patient_doc = {
        "patient_id": patient_id,
        "name": f"Patient-{patient_id}",
        "age_group": data.age,
        "gender": data.gender,
        "assigned_doctor": doctor_username,
        "clinical_data": data.model_dump(),
        "prediction_result": result,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    prediction_doc = {
        "patient_id": patient_id,
        "prediction": result["prediction"],
        "prediction_value": result["prediction_value"],
        "probability": result["probability"],
        "risk_level": result["risk_level"],
        "recommendation": result["recommendation"],
        "doctor_username": doctor_username if doctor_username else current_user.username,
        "timestamp": datetime.utcnow()
    }
    
    patient_doc = convert_numpy(patient_doc)
    prediction_doc = convert_numpy(prediction_doc)
    
    patients_collection.insert_one(patient_doc)
    predictions_collection.insert_one(prediction_doc)
    
    if doctor_username:
        add_patient_to_doctor(patient_id, doctor_username)
    else:
        print(f"ℹ️ Patient {patient_id} created by sysadmin, unassigned.")
    
    return {"patient_id": patient_id, **result}

@app.get("/predictions")
def get_predictions(current_user: UserInDB = Depends(get_current_active_user)):
    if predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    if current_user.role == "doctor":
        assigned = current_user.assigned_patients or []
        predictions = list(predictions_collection.find({"patient_id": {"$in": assigned}}))
    elif current_user.role == "researcher":
        predictions = list(predictions_collection.find({}))
        for p in predictions:
            p["patient_id"] = "ANON-" + p["patient_id"][-4:]
    else:
        predictions = list(predictions_collection.find({}))
    
    for p in predictions:
        p["_id"] = str(p["_id"])
    return predictions

@app.get("/analytics/overview")
def get_analytics_overview(current_user: UserInDB = Depends(get_current_active_user)):
    if patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    total_patients = patients_collection.count_documents({})
    total_predictions = predictions_collection.count_documents({})
    high_risk = predictions_collection.count_documents({"risk_level": "High"})
    medium_risk = predictions_collection.count_documents({"risk_level": "Medium"})
    low_risk = predictions_collection.count_documents({"risk_level": "Low"})
    
    pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$probability"}}}]
    avg_result = list(predictions_collection.aggregate(pipeline))
    avg_prob = avg_result[0]["avg"] if avg_result else 0
    
    risk_dist = [
        {"label": "High", "value": high_risk, "color": "#d9534f"},
        {"label": "Medium", "value": medium_risk, "color": "#f0ad4e"},
        {"label": "Low", "value": low_risk, "color": "#5cb85c"}
    ]
    
    from datetime import timedelta
    months = []
    counts = []
    for i in range(5, -1, -1):
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(microseconds=1)
        count = predictions_collection.count_documents({
            "timestamp": {"$gte": month_start, "$lte": month_end}
        })
        months.append(month_start.strftime("%b"))
        counts.append(count)
    
    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "avg_probability": round(avg_prob, 2) if avg_prob else 0,
        "risk_distribution": risk_dist,
        "monthly_trend": {"months": months, "counts": counts}
    }

@app.post("/reports/generate")
def generate_report(
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "researcher"]))
):
    if reports_collection is None or patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    patient_summary = get_patient_summary_for_report()
    high_risk = sum(1 for p in patient_summary if p["risk_level"] == "High")
    medium_risk = sum(1 for p in patient_summary if p["risk_level"] == "Medium")
    low_risk = sum(1 for p in patient_summary if p["risk_level"] == "Low")
    total_patients = len(patient_summary)
    total_predictions = predictions_collection.count_documents({})
    
    report_id = str(uuid.uuid4())[:8]
    report_doc = {
        "report_id": report_id,
        "generated_by": current_user.username,
        "generated_at": datetime.utcnow(),
        "data": {
            "total_patients": total_patients,
            "total_predictions": total_predictions,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "patients": patient_summary
        }
    }
    reports_collection.insert_one(convert_numpy(report_doc))
    return {"report_id": report_id, "message": "Report generated"}

@app.get("/reports")
def get_reports(
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "researcher"]))
):
    if reports_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    reports = list(reports_collection.find({}))
    for r in reports:
        r["_id"] = str(r["_id"])
    return reports

@app.post("/settings/change-password")
def change_password(
    data: ChangePassword,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    new_hashed = get_password_hash(data.new_password)
    users_collection.update_one(
        {"username": current_user.username},
        {"$set": {"hashed_password": new_hashed}}
    )
    return {"message": "Password updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)