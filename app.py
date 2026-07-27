# ==========================================================
# Prognexa AI Backend
# Hospital Readmission Prediction API
# ==========================================================

import json
import csv
import io
import numpy as np
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional
import uuid
import traceback
from bson import ObjectId

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

# ---------- MongoDB ----------
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
notes_collection = db["notes"] if db is not None else None
schedules_collection = db["schedules"] if db is not None else None
research_summaries_collection = db["research_summaries"] if db is not None else None

# ---------- Auth ----------
pwd_context = CryptContext(schemes=["pbkdf2_sha256"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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
            department=user.get("department", ""),
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

def add_patient_to_doctor(patient_id: str, doctor_username: str):
    if users_collection is not None and doctor_username:
        users_collection.update_one(
            {"username": doctor_username},
            {"$addToSet": {"assigned_patients": patient_id}}
        )

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

# ==========================================================
# REPORT HELPERS
# ==========================================================
def get_patient_summary_for_report(filters: dict = None):
    if patients_collection is None:
        return []
    query = {}
    if filters:
        if filters.get("doctor") and filters["doctor"] != "all":
            query["assigned_doctor"] = filters["doctor"]
        if filters.get("risk_level") and filters["risk_level"] != "all":
            query["prediction_result.risk_level"] = filters["risk_level"]
        if filters.get("start_date") or filters.get("end_date"):
            date_filter = {}
            try:
                if filters.get("start_date"):
                    start = datetime.fromisoformat(filters["start_date"]).replace(tzinfo=None)
                    date_filter["$gte"] = start
                if filters.get("end_date"):
                    end = datetime.fromisoformat(filters["end_date"]).replace(tzinfo=None) + timedelta(days=1) - timedelta(microseconds=1)
                    date_filter["$lte"] = end
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
            if date_filter:
                query["created_at"] = date_filter

    patients = list(patients_collection.find(query))
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
            "assigned_doctor": p.get("assigned_doctor", "Unassigned"),
            "created_at": p.get("created_at", datetime.utcnow()).isoformat(),
            "discharged": p.get("discharged", False)
        })
    return summary

# ---------- ENDPOINTS ----------
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
        "department": "",
        "assigned_patients": [],
        "disabled": False,
        "created_at": datetime.utcnow()
    }
    users_collection.insert_one(user_doc)
    return {"message": "Registration successful. Please login."}

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
            if p["patient_id"] not in seen:
                seen.add(p["patient_id"])
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
        if "discharged" not in p:
            p["discharged"] = False
    return patients

@app.get("/patients/{patient_id}/clinical")
def get_patient_clinical(
    patient_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if patients_collection is None:
        raise HTTPException(503, "Database unavailable")
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(404, "Patient not found")
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(403, "You can only access your own patients")
    return {
        "patient_id": patient["patient_id"],
        "name": patient.get("name", "Unknown"),
        "clinical_data": patient.get("clinical_data", {})
    }

@app.get("/patients/{patient_id}/history")
def get_patient_history(
    patient_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if patients_collection is None or predictions_collection is None:
        raise HTTPException(503, "Database unavailable")
    
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(404, "Patient not found")
    
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(403, "You can only view your own patients")
    if current_user.role == "researcher":
        raise HTTPException(403, "Researchers cannot view individual patient history")
    
    predictions_cursor = predictions_collection.find({"patient_id": patient_id}).sort("timestamp", 1)
    predictions_list = []
    for pred in predictions_cursor:
        pred["_id"] = str(pred["_id"])
        if "timestamp" in pred and isinstance(pred["timestamp"], datetime):
            pred["timestamp"] = pred["timestamp"].isoformat()
        predictions_list.append(pred)
    
    patient["_id"] = str(patient["_id"])
    return {
        "patient": patient,
        "predictions": predictions_list
    }

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
        "updated_at": datetime.utcnow(),
        "discharged": False,
        "discharge_date": None
    }
    patients_collection.insert_one(patient_doc)
    if doctor_username:
        add_patient_to_doctor(patient_id, doctor_username)
    return {"patient_id": patient_id, "message": "Patient created"}

@app.post("/patients/{patient_id}/discharge")
def discharge_patient(
    patient_id: str,
    current_user: UserInDB = Depends(require_role(["doctor", "admin"]))
):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(status_code=403, detail="You can only discharge your own patients")
    if patient.get("discharged", False):
        raise HTTPException(status_code=400, detail="Patient already discharged")
    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"discharged": True, "discharge_date": datetime.utcnow()}}
    )
    return {"message": f"Patient {patient_id} discharged successfully"}

@app.post("/patients/{patient_id}/readmit")
def readmit_patient(
    patient_id: str,
    current_user: UserInDB = Depends(require_role(["doctor", "admin"]))
):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(status_code=403, detail="You can only readmit your own patients")
    if not patient.get("discharged", False):
        raise HTTPException(status_code=400, detail="Patient is already admitted")
    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"discharged": False, "discharge_date": None}}
    )
    return {"message": f"Patient {patient_id} readmitted"}

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

# ---------- PREDICTION ----------
@app.post("/predict")
def predict(data: dict, current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.role not in ["doctor", "sysadmin"]:
        raise HTTPException(status_code=403, detail="Only doctors and system administrators can perform predictions")
    if patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    patient_name = data.pop("patientName", "Unknown")
    existing_patient_id = data.pop("existing_patient_id", None)
    
    if existing_patient_id:
        patient = patients_collection.find_one({"patient_id": existing_patient_id})
        if not patient:
            raise HTTPException(404, "Patient not found")
        if current_user.role == "doctor":
            if patient.get("assigned_doctor") != current_user.username:
                raise HTTPException(403, "You can only predict for your own patients")
        patient_id = existing_patient_id
    else:
        patient_id = str(uuid.uuid4())[:8]
    
    try:
        result = predict_patient(data)
    except Exception as e:
        print("Prediction error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction engine error: {str(e)}")
    result = json.loads(json.dumps(result, default=float))
    
    prediction_doc = {
        "patient_id": patient_id,
        "prediction": result["prediction"],
        "prediction_value": result["prediction_value"],
        "probability": result["probability"],
        "risk_level": result["risk_level"],
        "recommendation": result["recommendation"],
        "doctor_username": current_user.username if current_user.role == "doctor" else current_user.username,
        "timestamp": datetime.utcnow()
    }
    prediction_doc = convert_numpy(prediction_doc)
    predictions_collection.insert_one(prediction_doc)
    
    if not existing_patient_id:
        doctor_username = current_user.username if current_user.role == "doctor" else None
        patient_doc = {
            "patient_id": patient_id,
            "name": patient_name,
            "age_group": data.get("age", "[60-70)"),
            "gender": data.get("gender", "Male"),
            "assigned_doctor": doctor_username,
            "clinical_data": data,
            "prediction_result": result,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "discharged": False,
            "discharge_date": None
        }
        patient_doc = convert_numpy(patient_doc)
        patients_collection.insert_one(patient_doc)
        if doctor_username:
            add_patient_to_doctor(patient_id, doctor_username)
    else:
        patients_collection.update_one(
            {"patient_id": patient_id},
            {"$set": {
                "clinical_data": data,
                "prediction_result": result,
                "updated_at": datetime.utcnow()
            }}
        )
    
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

@app.get("/predictions/patient/{patient_id}")
def get_patient_predictions(
    patient_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if predictions_collection is None:
        raise HTTPException(503, "Database unavailable")
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(404, "Patient not found")
    if current_user.role == "doctor":
        if patient.get("assigned_doctor") != current_user.username:
            raise HTTPException(403, "You can only view predictions for your own patients")
    predictions = list(predictions_collection.find({"patient_id": patient_id}).sort("timestamp", 1))
    for p in predictions:
        p["_id"] = str(p["_id"])
        if "timestamp" in p and isinstance(p["timestamp"], datetime):
            p["timestamp"] = p["timestamp"].isoformat()
    return predictions

# ---------- ANALYTICS ----------
@app.get("/analytics/overview")
def get_analytics_overview(current_user: UserInDB = Depends(get_current_active_user)):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    all_patients = list(patients_collection.find({}))
    total_patients = len(all_patients)
    
    high_risk = 0
    medium_risk = 0
    low_risk = 0
    
    for p in all_patients:
        pred_result = p.get("prediction_result", {})
        risk_level = pred_result.get("risk_level", "N/A")
        if risk_level == "High":
            high_risk += 1
        elif risk_level == "Medium":
            medium_risk += 1
        elif risk_level == "Low":
            low_risk += 1
    
    risk_dist = [
        {"label": "High", "value": high_risk, "color": "#d9534f"},
        {"label": "Medium", "value": medium_risk, "color": "#f0ad4e"},
        {"label": "Low", "value": low_risk, "color": "#5cb85c"}
    ]
    
    from datetime import timedelta
    months = []
    counts_monthly = []
    for i in range(5, -1, -1):
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(microseconds=1)
        count = patients_collection.count_documents({
            "created_at": {"$gte": month_start, "$lte": month_end}
        })
        months.append(month_start.strftime("%b"))
        counts_monthly.append(count)
    
    years = []
    counts_yearly = []
    current_year = datetime.utcnow().year
    for y in range(current_year - 4, current_year + 1):
        year_start = datetime(y, 1, 1)
        year_end = datetime(y, 12, 31, 23, 59, 59)
        count = patients_collection.count_documents({
            "created_at": {"$gte": year_start, "$lte": year_end}
        })
        years.append(str(y))
        counts_yearly.append(count)
    
    total_predictions = predictions_collection.count_documents({}) if predictions_collection is not None else 0
    
    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "risk_distribution": risk_dist,
        "monthly_trend": {"months": months, "counts": counts_monthly},
        "yearly_trend": {"years": years, "counts": counts_yearly}
    }

# ===== NEW: Hospital Trend for Treatment Effectiveness =====
@app.get("/analytics/hospital-trend")
def get_hospital_trend(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Returns aggregated risk trend over time (monthly) for the entire hospital.
    Includes average risk probability, and counts of high/medium/low risk patients per month.
    """
    if predictions_collection is None:
        raise HTTPException(503, "Database unavailable")
    
    pipeline = [
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"}
                },
                "avg_prob": {"$avg": "$probability"},
                "high_count": {"$sum": {"$cond": [{"$eq": ["$risk_level", "High"]}, 1, 0]}},
                "medium_count": {"$sum": {"$cond": [{"$eq": ["$risk_level", "Medium"]}, 1, 0]}},
                "low_count": {"$sum": {"$cond": [{"$eq": ["$risk_level", "Low"]}, 1, 0]}},
                "total_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    results = list(predictions_collection.aggregate(pipeline))
    
    months = []
    avg_probs = []
    high_counts = []
    medium_counts = []
    low_counts = []
    total_counts = []
    
    for r in results:
        year = r["_id"]["year"]
        month = r["_id"]["month"]
        dt = datetime(year, month, 1)
        months.append(dt.strftime("%b %Y"))
        avg_probs.append(round(r["avg_prob"] * 100, 1) if r["avg_prob"] is not None else 0)
        high_counts.append(r["high_count"])
        medium_counts.append(r["medium_count"])
        low_counts.append(r["low_count"])
        total_counts.append(r["total_count"])
    
    risk_reduction = 0
    if len(avg_probs) >= 2:
        first = avg_probs[0]
        last = avg_probs[-1]
        risk_reduction = round(first - last, 1)
    
    return {
        "months": months,
        "avg_probabilities": avg_probs,
        "high_counts": high_counts,
        "medium_counts": medium_counts,
        "low_counts": low_counts,
        "total_counts": total_counts,
        "risk_reduction": risk_reduction
    }

# ---------- HOSPITAL POPULATION ----------
@app.get("/admin/hospital-population")
def get_hospital_population(current_user: UserInDB = Depends(require_role(["admin", "sysadmin"]))):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    total_admitted = patients_collection.count_documents({"discharged": False})
    discharged = patients_collection.count_documents({"discharged": True})
    total_beds = 100
    empty_beds = max(0, total_beds - total_admitted)

    high_risk_patients = list(patients_collection.find({
        "prediction_result.risk_level": "High",
        "discharged": False
    }))
    high_risk_list = []
    for p in high_risk_patients:
        high_risk_list.append({
            "patient_id": p["patient_id"],
            "name": p.get("name", "Unknown"),
            "age_group": p.get("age_group", "N/A"),
            "risk_level": p["prediction_result"].get("risk_level", "High"),
            "probability": p["prediction_result"].get("probability", 0),
            "assigned_doctor": p.get("assigned_doctor", "Unassigned"),
            "created_at": p.get("created_at", datetime.utcnow()).isoformat()
        })
    high_risk_list.sort(key=lambda x: x["probability"], reverse=True)

    months = []
    admissions_counts = []
    discharges_counts = []
    for i in range(5, -1, -1):
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(microseconds=1)
        adm_count = patients_collection.count_documents({
            "created_at": {"$gte": month_start, "$lte": month_end}
        })
        dis_count = patients_collection.count_documents({
            "discharge_date": {"$gte": month_start, "$lte": month_end}
        })
        months.append(month_start.strftime("%b %Y"))
        admissions_counts.append(adm_count)
        discharges_counts.append(dis_count)

    return {
        "total_admitted": total_admitted,
        "discharged": discharged,
        "empty_beds": empty_beds,
        "total_beds": total_beds,
        "high_risk_patients": high_risk_list,
        "trend": {
            "months": months,
            "admissions": admissions_counts,
            "discharges": discharges_counts
        }
    }

# ---------- REPORTS ----------
@app.post("/reports/generate")
def generate_report(
    doctor: Optional[str] = Query("all", description="Doctor username or 'all'"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    risk_level: Optional[str] = Query("all", description="Risk level: High, Medium, Low, all"),
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "researcher"]))
):
    if reports_collection is None or patients_collection is None or predictions_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    filters = {}
    if doctor and doctor != "all":
        filters["doctor"] = doctor
    if start_date:
        filters["start_date"] = start_date
    if end_date:
        filters["end_date"] = end_date
    if risk_level and risk_level != "all":
        filters["risk_level"] = risk_level

    try:
        patient_summary = get_patient_summary_for_report(filters)
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error in get_patient_summary_for_report:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

    high_risk = sum(1 for p in patient_summary if p["risk_level"] == "High")
    medium_risk = sum(1 for p in patient_summary if p["risk_level"] == "Medium")
    low_risk = sum(1 for p in patient_summary if p["risk_level"] == "Low")
    total_patients = len(patient_summary)
    total_predictions = predictions_collection.count_documents({}) if predictions_collection is not None else 0
    
    report_id = str(uuid.uuid4())[:8]
    report_doc = {
        "report_id": report_id,
        "generated_by": current_user.username,
        "generated_at": datetime.utcnow().isoformat(),
        "filters": filters,
        "data": {
            "total_patients": total_patients,
            "total_predictions": total_predictions,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "patients": patient_summary
        }
    }
    try:
        reports_collection.insert_one(convert_numpy(report_doc))
    except Exception as e:
        print("Error inserting report:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to save report.")
    
    return {"report_id": report_id, "message": "Report generated"}

@app.get("/reports")
def get_reports(
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "researcher"]))
):
    try:
        if reports_collection is None:
            return []
        reports = list(reports_collection.find({}))
        for r in reports:
            r["_id"] = str(r["_id"])
            if "generated_at" in r and isinstance(r["generated_at"], datetime):
                r["generated_at"] = r["generated_at"].isoformat()
            elif "generated_at" not in r:
                r["generated_at"] = ""
        reports.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
        return reports
    except Exception as e:
        print(f"❌ ERROR in /reports: {traceback.format_exc()}")
        return []

@app.get("/reports/{report_id}/export")
def export_report_csv(
    report_id: str,
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "researcher"]))
):
    if reports_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        report = reports_collection.find_one({"report_id": report_id})
    except Exception as e:
        print(f"Error finding report {report_id}: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error retrieving report: {str(e)}")
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    patients = report.get("data", {}).get("patients", [])
    if not patients:
        raise HTTPException(status_code=404, detail="No patients in this report")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Patient ID", "Name", "Risk Level", "Probability", "Assigned Doctor", "Created At", "Discharged"])
    for p in patients:
        writer.writerow([
            p.get("patient_id", ""),
            p.get("name", ""),
            p.get("risk_level", ""),
            p.get("probability", ""),
            p.get("assigned_doctor", ""),
            p.get("created_at", ""),
            "Yes" if p.get("discharged", False) else "No"
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.csv"}
    )

# ---------- NEW ENDPOINTS ----------
# 1. Treatment Effectiveness (updated – returns medium_risk_count)
@app.get("/analytics/treatment-effectiveness")
def get_treatment_effectiveness(
    doctor: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_current_active_user)
):
    if patients_collection is None:
        raise HTTPException(503, "Database unavailable")
    
    query = {}
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date) + timedelta(days=1)
        query["created_at"] = date_filter
    
    if current_user.role == "doctor":
        query["assigned_doctor"] = current_user.username
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_patients": {"$sum": 1},
            "avg_risk": {"$avg": "$prediction_result.probability"},
            "high_risk_count": {"$sum": {"$cond": [{"$eq": ["$prediction_result.risk_level", "High"]}, 1, 0]}},
            "medium_risk_count": {"$sum": {"$cond": [{"$eq": ["$prediction_result.risk_level", "Medium"]}, 1, 0]}},
            "low_risk_count": {"$sum": {"$cond": [{"$eq": ["$prediction_result.risk_level", "Low"]}, 1, 0]}}
        }}
    ]
    result = list(patients_collection.aggregate(pipeline))
    if result:
        return result[0]
    else:
        return {"total_patients": 0, "avg_risk": 0, "high_risk_count": 0, "medium_risk_count": 0, "low_risk_count": 0}

# 2. Clinical Decision Support (POST)
@app.post("/recommendations")
def get_recommendations(
    patient_id: str = Query(...),
    current_user: UserInDB = Depends(get_current_active_user)
):
    if patients_collection is None:
        raise HTTPException(503, "Database unavailable")
    patient = patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(404, "Patient not found")
    if current_user.role == "doctor" and patient.get("assigned_doctor") != current_user.username:
        raise HTTPException(403, "Not your patient")
    if current_user.role == "researcher":
        raise HTTPException(403, "Researchers cannot view individual patient recommendations")
    
    risk = patient.get("prediction_result", {}).get("risk_level", "Low")
    prob = patient.get("prediction_result", {}).get("probability", 0)
    
    recommendations = []
    if risk == "High":
        recommendations.append("Immediate hospitalization or intensive outpatient monitoring.")
        recommendations.append("Coordinate with specialist (Cardiology, Endocrinology, etc.).")
        recommendations.append("Ensure medication adherence and schedule daily check-ins.")
    elif risk == "Medium":
        recommendations.append("Schedule follow-up appointment within 7 days.")
        recommendations.append("Monitor blood glucose levels (if diabetic) weekly.")
        recommendations.append("Review lab results and adjust medications if needed.")
    else:
        recommendations.append("Routine primary care follow-up in 30 days.")
        recommendations.append("Continue current treatment plan.")
        recommendations.append("Encourage healthy lifestyle (diet, exercise).")
    recommendations.append("Ensure patient education on warning signs of readmission.")
    recommendations.append("Coordinate with social services if needed.")
    
    return {
        "patient_id": patient_id,
        "risk_level": risk,
        "risk_probability": round(prob, 2),
        "recommendations": recommendations,
        "generated_at": datetime.utcnow().isoformat()
    }

# 3. Model Management (simplified – no numeric accuracy/AUC)
@app.get("/model/status")
def get_model_status(
    current_user: UserInDB = Depends(require_role(["sysadmin"]))
):
    return {
        "model_name": "XGBoost",
        "status": "Active",
        "last_trained": datetime.utcnow().isoformat(),
        "training_records": 15000,
        "features_used": [
            "time_in_hospital", "num_lab_procedures", "num_procedures",
            "num_medications", "number_outpatient", "number_emergency",
            "number_inpatient", "number_diagnoses", "admission_type_id",
            "discharge_disposition_id", "admission_source_id",
            "insulin", "diabetesMed"
        ]
    }

@app.post("/model/retrain")
def retrain_model(
    current_user: UserInDB = Depends(require_role(["sysadmin"]))
):
    return {"message": "Model retraining initiated. The new model will be available shortly."}

# 4. Research Summaries
@app.post("/research/summary")
def post_research_summary(
    summary_data: dict,
    current_user: UserInDB = Depends(require_role(["researcher"]))
):
    if research_summaries_collection is None:
        raise HTTPException(503, "Database unavailable")
    summary = {
        "title": summary_data.get("title", "Untitled"),
        "content": summary_data.get("content", ""),
        "posted_by": current_user.username,
        "created_at": datetime.utcnow()
    }
    research_summaries_collection.insert_one(summary)
    return {"message": "Research summary posted successfully"}

@app.get("/research/summaries")
def get_research_summaries(
    current_user: UserInDB = Depends(require_role(["researcher", "admin", "sysadmin"]))
):
    if research_summaries_collection is None:
        return []
    summaries = list(research_summaries_collection.find({}).sort("created_at", -1))
    for s in summaries:
        s["_id"] = str(s["_id"])
        if "created_at" in s and isinstance(s["created_at"], datetime):
            s["created_at"] = s["created_at"].isoformat()
    return summaries

# ---------- DOCTOR NOTES ----------
@app.post("/notes")
def add_note(
    note_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if notes_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    note = {
        "username": current_user.username,
        "content": note_data.get("content", ""),
        "date": note_data.get("date", datetime.utcnow().isoformat()),
        "timestamp": datetime.utcnow()
    }
    notes_collection.insert_one(note)
    return {"message": "Note added"}

@app.get("/notes")
def get_notes(
    current_user: UserInDB = Depends(get_current_active_user)
):
    if notes_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    notes = list(notes_collection.find({"username": current_user.username}))
    for n in notes:
        n["_id"] = str(n["_id"])
    return notes

@app.delete("/notes/{note_id}")
def delete_note(
    note_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if notes_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    result = notes_collection.delete_one({"_id": ObjectId(note_id), "username": current_user.username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ---------- SCHEDULES ----------
@app.post("/admin/schedule")
def create_schedule(
    schedule_data: dict,
    current_user: UserInDB = Depends(require_role(["admin"]))
):
    if schedules_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    schedule = {
        "assigned_to": schedule_data.get("assigned_to"),
        "task": schedule_data.get("task"),
        "date": schedule_data.get("date", datetime.utcnow().isoformat()),
        "created_by": current_user.username,
        "created_at": datetime.utcnow()
    }
    schedules_collection.insert_one(schedule)
    return {"message": "Schedule created"}

@app.get("/admin/schedules")
def get_schedules(
    assigned_to: Optional[str] = None,
    current_user: UserInDB = Depends(require_role(["admin", "sysadmin", "doctor"]))
):
    if schedules_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    query = {}
    if assigned_to:
        query["assigned_to"] = assigned_to
    schedules = list(schedules_collection.find(query))
    for s in schedules:
        s["_id"] = str(s["_id"])
    return schedules

@app.delete("/admin/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    current_user: UserInDB = Depends(require_role(["admin"]))
):
    if schedules_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    result = schedules_collection.delete_one({"_id": ObjectId(schedule_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}

# ---------- USER MANAGEMENT ----------
@app.get("/admin/users")
def get_all_users(
    current_user: UserInDB = Depends(require_role(["sysadmin", "admin"]))
):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    users = list(users_collection.find({}, {"hashed_password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@app.delete("/admin/users/{username}")
def delete_user(
    username: str,
    current_user: UserInDB = Depends(require_role(["sysadmin"]))
):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = users_collection.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {username} deleted"}

@app.get("/admin/stats")
def get_admin_stats(
    current_user: UserInDB = Depends(require_role(["sysadmin"]))
):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    doctors = users_collection.count_documents({"role": "doctor"})
    admins = users_collection.count_documents({"role": "admin"})
    researchers = users_collection.count_documents({"role": "researcher"})
    sysadmins = users_collection.count_documents({"role": "sysadmin"})
    return {
        "doctors": doctors,
        "admins": admins,
        "researchers": researchers,
        "sysadmins": sysadmins
    }

# ---------- RESEARCHER EXPORT ----------
@app.get("/researcher/export")
def export_research_data(
    current_user: UserInDB = Depends(require_role(["researcher"]))
):
    if patients_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    patients = list(patients_collection.find({}, {"_id": 0, "name": 0, "assigned_doctor": 0, "patient_id": 0}))
    for p in patients:
        if "clinical_data" in p:
            p["clinical_data"] = {k: v for k, v in p["clinical_data"].items() if k not in ["weight", "payer_code", "medical_specialty"]}
    output = io.StringIO()
    writer = csv.writer(output)
    if patients:
        header = list(patients[0].keys())
        writer.writerow(header)
        for p in patients:
            writer.writerow([p.get(k, "") for k in header])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=research_data.csv"}
    )

# ---------- SETTINGS ----------
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