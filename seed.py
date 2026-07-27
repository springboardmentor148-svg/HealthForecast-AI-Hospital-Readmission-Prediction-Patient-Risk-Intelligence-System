import os
import sys
import uuid
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from passlib.context import CryptContext

# Import configuration from config.py
from config import MONGO_URI, DB_NAME

# Password hashing (same as app.py)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"])

def get_password_hash(password):
    return pwd_context.hash(password)

# ---- Connect ----
print(f"🔄 Connecting to MongoDB at {MONGO_URI} ...")
client = MongoClient(MONGO_URI)
try:
    client.admin.command('ping')
    print("✅ MongoDB connection successful.")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    sys.exit(1)

db = client[DB_NAME]
print(f"📁 Using database: {DB_NAME}")

# ---- Define collections ----
users_collection = db["users"]
patients_collection = db["patients"]
predictions_collection = db["predictions"]
reports_collection = db["reports"]
notes_collection = db["notes"]
schedules_collection = db["schedules"]
research_summaries_collection = db["research_summaries"]

# Drop existing collections
print("🗑️  Dropping all existing collections...")
for coll in db.list_collection_names():
    db[coll].drop()
print("✅ All collections dropped.\n")

# ---- Helper functions ----
def random_date(start, end):
    delta = end - start
    int_delta = delta.days * 86400 + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

def random_probability(risk_level):
    if risk_level == "High":
        return round(random.uniform(0.70, 0.95), 4)
    elif risk_level == "Medium":
        return round(random.uniform(0.35, 0.69), 4)
    else:  # Low
        return round(random.uniform(0.05, 0.34), 4)

# ---- 1. Users ----
users_data = [
    {"username": "dr_smith", "password": "password123", "role": "doctor", "full_name": "Dr. Sarah Smith", "department": "Cardiology"},
    {"username": "admin_jones", "password": "password123", "role": "admin", "full_name": "Michael Jones", "department": "Hospital Administration"},
    {"username": "res_lee", "password": "password123", "role": "researcher", "full_name": "Dr. Emily Lee", "department": "Research"},
    {"username": "sysadmin_root", "password": "password123", "role": "sysadmin", "full_name": "System Administrator", "department": "IT"}
]

users = []
for u in users_data:
    users.append({
        "username": u["username"],
        "hashed_password": get_password_hash(u["password"]),
        "role": u["role"],
        "full_name": u["full_name"],
        "department": u["department"],
        "assigned_patients": [],
        "disabled": False,
        "created_at": datetime.utcnow()
    })

users_collection.insert_many(users)
print(f"✅ Inserted {len(users)} users.")

# ---- 2. Patients ----
genders = ["Male", "Female", "Unknown/Invalid"]
age_groups = ["[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)"]
races = ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other"]

first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"]

patients = []
now = datetime.utcnow()

# Risk trajectories: varied patterns to make trends realistic
trajectories = [
    ["High", "Low"], ["Low", "High"], ["Medium", "Low"], ["Medium", "High"],
    ["High", "Medium"], ["Low", "Medium"], ["High", "Low", "Medium"],
    ["Low", "High", "Medium"], ["Medium", "Low", "High"],
    ["High", "High", "Low"], ["Low", "Low", "High"],
    ["Medium", "Medium", "Low"], ["High", "Medium", "Low"],
    ["Low", "Medium", "High"], ["High", "Low", "Low"]
]

for i in range(15):
    if i < 6:
        discharged = False
        discharge_date = None
        admission_date = random_date(now - timedelta(days=30), now)
    else:
        discharged = random.choice([True, False])
        if discharged:
            discharge_date = random_date(now - timedelta(days=20), now)
            admission_date = random_date(now - timedelta(days=45), discharge_date - timedelta(days=1))
        else:
            discharge_date = None
            admission_date = random_date(now - timedelta(days=45), now)

    clinical = {
        "race": random.choice(races),
        "gender": random.choice(genders),
        "age": random.choice(age_groups),
        "weight": str(random.randint(50, 120)),
        "payer_code": random.choice(["UN", "MC", "MD", "PR"]),
        "medical_specialty": random.choice(["Cardiology", "InternalMedicine", "FamilyPractice", "Surgery", "Emergency"]),
        "admission_type_id": random.choice([1, 2, 3, 4]),
        "discharge_disposition_id": random.choice([1, 2, 3, 4, 5]),
        "admission_source_id": random.choice([1, 2, 3, 4, 5, 6, 7]),
        "time_in_hospital": random.randint(1, 14),
        "num_lab_procedures": random.randint(10, 80),
        "num_procedures": random.randint(0, 5),
        "num_medications": random.randint(5, 25),
        "number_outpatient": random.randint(0, 3),
        "number_emergency": random.randint(0, 3),
        "number_inpatient": random.randint(0, 2),
        "number_diagnoses": random.randint(5, 15),
        "diag_1": str(random.randint(100, 999)),
        "diag_2": str(random.randint(100, 999)),
        "diag_3": str(random.randint(100, 999)),
        "max_glu_serum": random.choice(["None", "Norm", ">200", ">300"]),
        "A1Cresult": random.choice(["None", "Norm", ">7", ">8"]),
        "metformin": random.choice(["No", "Up", "Down", "Steady"]),
        "repaglinide": random.choice(["No", "Up", "Down", "Steady"]),
        "nateglinide": random.choice(["No", "Up", "Down", "Steady"]),
        "chlorpropamide": random.choice(["No", "Up", "Down", "Steady"]),
        "glimepiride": random.choice(["No", "Up", "Down", "Steady"]),
        "acetohexamide": random.choice(["No", "Up", "Down", "Steady"]),
        "glipizide": random.choice(["No", "Up", "Down", "Steady"]),
        "glyburide": random.choice(["No", "Up", "Down", "Steady"]),
        "tolbutamide": random.choice(["No", "Up", "Down", "Steady"]),
        "pioglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "rosiglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "acarbose": random.choice(["No", "Up", "Down", "Steady"]),
        "miglitol": random.choice(["No", "Up", "Down", "Steady"]),
        "troglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "tolazamide": random.choice(["No", "Up", "Down", "Steady"]),
        "examide": random.choice(["No", "Up", "Down", "Steady"]),
        "citoglipton": random.choice(["No", "Up", "Down", "Steady"]),
        "insulin": random.choice(["No", "Up", "Down", "Steady"]),
        "glyburide_metformin": random.choice(["No", "Up", "Down", "Steady"]),
        "glipizide_metformin": random.choice(["No", "Up", "Down", "Steady"]),
        "glimepiride_pioglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "metformin_rosiglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "metformin_pioglitazone": random.choice(["No", "Up", "Down", "Steady"]),
        "change": random.choice(["No", "Ch"]),
        "diabetesMed": random.choice(["No", "Yes"])
    }

    assigned_doctor = random.choice([None, "dr_smith"]) if i % 3 != 0 else "dr_smith"

    patient = {
        "patient_id": str(uuid.uuid4())[:8],
        "name": f"{random.choice(first_names)} {random.choice(last_names)}",
        "age_group": clinical["age"],
        "gender": clinical["gender"],
        "assigned_doctor": assigned_doctor,
        "clinical_data": clinical,
        "prediction_result": {},
        "created_at": admission_date,
        "updated_at": admission_date,
        "discharged": discharged,
        "discharge_date": discharge_date
    }
    patients.append(patient)

patients_collection.insert_many(patients)
print(f"✅ Inserted {len(patients)} patients.")

# ---- 3. Predictions (with varied trajectories) ----
predictions = []
for idx, p in enumerate(patients):
    patient_id = p["patient_id"]
    assigned_doctor = p["assigned_doctor"] or "sysadmin_root"
    admission_date = p["created_at"]

    trajectory = trajectories[idx % len(trajectories)]
    num_preds = len(trajectory)

    timestamps = [admission_date]
    for j in range(1, num_preds):
        delta_days = random.randint(2, 10)
        total_days = sum([random.randint(2, 10) for _ in range(j)])
        if total_days > 30:
            total_days = 30
        timestamps.append(admission_date + timedelta(days=total_days))

    for j, risk_level in enumerate(trajectory):
        prob = random_probability(risk_level)
        pred = {
            "patient_id": patient_id,
            "prediction": "Readmission Likely" if risk_level in ["High", "Medium"] else "Readmission Unlikely",
            "prediction_value": 1 if risk_level in ["High", "Medium"] else 0,
            "probability": prob,
            "risk_level": risk_level,
            "recommendation": f"{risk_level} risk patient. Follow-up required." if risk_level != "Low" else "Low risk. Continue routine care.",
            "doctor_username": assigned_doctor,
            "timestamp": timestamps[j]
        }
        predictions.append(pred)

    # Update patient's prediction_result to the last (most recent) prediction
    latest = predictions[-1]
    patients_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {
            "prediction_result": {
                "prediction": latest["prediction"],
                "prediction_value": latest["prediction_value"],
                "probability": round(latest["probability"] * 100, 2),
                "risk_level": latest["risk_level"],
                "recommendation": latest["recommendation"]
            },
            "updated_at": latest["timestamp"]
        }}
    )

predictions_collection.insert_many(predictions)
print(f"✅ Inserted {len(predictions)} predictions (varying trajectories).")

# ---- 4. Research Summaries ----
research_summaries = [
    {
        "title": "Impact of Early Intervention on Readmission Rates",
        "content": "Our analysis shows that patients who received follow-up calls within 48 hours of discharge had a 25% lower readmission rate compared to the control group. This suggests that early engagement is critical.",
        "posted_by": "res_lee",
        "created_at": now - timedelta(days=5)
    },
    {
        "title": "Diabetes Management and Readmission Risk",
        "content": "Patients with poorly controlled diabetes (A1C > 8) were 40% more likely to be readmitted within 30 days. Intensive glucose management programs could reduce this risk significantly.",
        "posted_by": "res_lee",
        "created_at": now - timedelta(days=3)
    },
    {
        "title": "Social Determinants of Health and Readmission",
        "content": "Preliminary data indicates that patients from lower socioeconomic backgrounds have a 15% higher readmission rate. Addressing social needs may improve outcomes.",
        "posted_by": "res_lee",
        "created_at": now - timedelta(days=1)
    }
]
research_summaries_collection.insert_many(research_summaries)
print(f"✅ Inserted {len(research_summaries)} research summaries.")

# ---- 5. Reports ----
reports = [
    {
        "report_id": str(uuid.uuid4())[:8],
        "generated_by": "admin_jones",
        "generated_at": (now - timedelta(days=2)).isoformat(),
        "filters": {"doctor": "all", "risk_level": "all", "start_date": None, "end_date": None},
        "data": {
            "total_patients": len(patients),
            "total_predictions": len(predictions),
            "high_risk": len([p for p in patients if p["prediction_result"].get("risk_level") == "High"]),
            "medium_risk": len([p for p in patients if p["prediction_result"].get("risk_level") == "Medium"]),
            "low_risk": len([p for p in patients if p["prediction_result"].get("risk_level") == "Low"]),
            "patients": [{"patient_id": p["patient_id"], "name": p["name"], "risk_level": p["prediction_result"].get("risk_level", "N/A"), "probability": p["prediction_result"].get("probability", 0), "assigned_doctor": p["assigned_doctor"] or "Unassigned", "created_at": p["created_at"].isoformat()} for p in patients]
        }
    },
    {
        "report_id": str(uuid.uuid4())[:8],
        "generated_by": "res_lee",
        "generated_at": (now - timedelta(days=1)).isoformat(),
        "filters": {"doctor": "dr_smith", "risk_level": "High", "start_date": None, "end_date": None},
        "data": {
            "total_patients": len([p for p in patients if p["assigned_doctor"] == "dr_smith" and p["prediction_result"].get("risk_level") == "High"]),
            "total_predictions": len([p for p in patients if p["assigned_doctor"] == "dr_smith"]),
            "high_risk": len([p for p in patients if p["assigned_doctor"] == "dr_smith" and p["prediction_result"].get("risk_level") == "High"]),
            "medium_risk": 0,
            "low_risk": 0,
            "patients": [{"patient_id": p["patient_id"], "name": p["name"], "risk_level": p["prediction_result"].get("risk_level", "N/A"), "probability": p["prediction_result"].get("probability", 0), "assigned_doctor": p["assigned_doctor"], "created_at": p["created_at"].isoformat()} for p in patients if p["assigned_doctor"] == "dr_smith" and p["prediction_result"].get("risk_level") == "High"]
        }
    }
]
reports_collection.insert_many(reports)
print(f"✅ Inserted {len(reports)} reports.")

# ---- 6. Notes: REMOVED - no seed notes will be inserted ----
print("ℹ️  No notes seeded (empty collection).")

# ---- 7. Schedules: REMOVED - no seed schedules will be inserted ----
print("ℹ️  No schedules seeded (empty collection).")

# ---- Verify ----
print("\n📊 Database contents:")
for coll in db.list_collection_names():
    count = db[coll].count_documents({})
    print(f"  - {coll}: {count} documents")

print("\n👤 Users created:")
for u in users_collection.find({}, {"username": 1, "role": 1, "_id": 0}):
    print(f"  - {u['username']} ({u['role']})")

print("\n🎉 Seeding completed successfully!")
print("🔑 Login credentials:")
print("  dr_smith / password123   (Doctor)")
print("  admin_jones / password123 (Admin)")
print("  res_lee / password123    (Researcher)")
print("  sysadmin_root / password123 (System Admin)")