"""
Database Seeding Script for MongoDB Atlas
Run this once to populate your database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import bcrypt
import os

# ============================================================
# CONFIGURATION - UPDATE YOUR PASSWORD HERE
# ============================================================
MONGODB_URL = "mongodb+srv://TruptiSawarkar:Info123@cluster0.tlahbyu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "healthforecast"

# ============================================================
# HELPER FUNCTIONS
# ============================================================
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def utc_now():
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)

# ============================================================
# USERS DATA
# ============================================================
USERS = [
    {
        "username": "admin",
        "email": "admin@healthforecast.ai",
        "hashed_password": hash_password("admin123"),
        "full_name": "System Administrator",
        "role": "system_admin",
        "is_active": True,
        "created_at": utc_now(),
        "last_login": None
    },
    {
        "username": "dr_smith",
        "email": "dr.smith@hospital.com",
        "hashed_password": hash_password("doctor123"),
        "full_name": "Dr. John Smith",
        "role": "doctor",
        "hospital_id": "HOSP001",
        "is_active": True,
        "created_at": utc_now(),
        "last_login": None
    },
    {
        "username": "dr_johnson",
        "email": "dr.johnson@hospital.com",
        "hashed_password": hash_password("doctor123"),
        "full_name": "Dr. Sarah Johnson",
        "role": "doctor",
        "hospital_id": "HOSP002",
        "is_active": True,
        "created_at": utc_now(),
        "last_login": None
    },
    {
        "username": "admin_hospital",
        "email": "admin@hospital.com",
        "hashed_password": hash_password("admin123"),
        "full_name": "Hospital Administrator",
        "role": "hospital_admin",
        "hospital_id": "HOSP001",
        "is_active": True,
        "created_at": utc_now(),
        "last_login": None
    },
    {
        "username": "researcher",
        "email": "researcher@health.com",
        "hashed_password": hash_password("research123"),
        "full_name": "Healthcare Researcher",
        "role": "researcher",
        "is_active": True,
        "created_at": utc_now(),
        "last_login": None
    }
]

# ============================================================
# PATIENTS DATA
# ============================================================
PATIENTS = [
    {
        "patient_id": "P1001",
        "name": "John Doe",
        "age": 65,
        "gender": "Male",
        "race": "Caucasian",
        "contact": {
            "phone": "+1-555-0101",
            "email": "john.doe@email.com",
            "address": "123 Main St, Boston, MA"
        },
        "medical_history": [
            {
                "diagnosis": "Type 2 Diabetes",
                "date": datetime(2023, 6, 15, tzinfo=timezone.utc),
                "notes": "HbA1c: 8.2%"
            }
        ],
        "medications": ["Metformin", "Insulin"],
        "risk_score": 0.72,
        "risk_category": "High",
        "last_admission": datetime(2024, 1, 15, tzinfo=timezone.utc),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "patient_id": "P1002",
        "name": "Jane Smith",
        "age": 58,
        "gender": "Female",
        "race": "African American",
        "contact": {
            "phone": "+1-555-0102",
            "email": "jane.smith@email.com",
            "address": "456 Oak Ave, New York, NY"
        },
        "medical_history": [
            {
                "diagnosis": "Hypertension",
                "date": datetime(2023, 8, 20, tzinfo=timezone.utc),
                "notes": "BP: 145/90"
            }
        ],
        "medications": ["Lisinopril", "Glipizide"],
        "risk_score": 0.45,
        "risk_category": "Medium",
        "last_admission": datetime(2024, 1, 14, tzinfo=timezone.utc),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "patient_id": "P1003",
        "name": "Robert Johnson",
        "age": 72,
        "gender": "Male",
        "race": "Caucasian",
        "contact": {
            "phone": "+1-555-0103",
            "email": "robert.j@email.com",
            "address": "789 Pine St, Chicago, IL"
        },
        "medical_history": [
            {
                "diagnosis": "Heart Failure",
                "date": datetime(2023, 10, 5, tzinfo=timezone.utc),
                "notes": "EF: 35%"
            }
        ],
        "medications": ["Metformin", "Glyburide", "Furosemide"],
        "risk_score": 0.85,
        "risk_category": "High",
        "last_admission": datetime(2024, 1, 13, tzinfo=timezone.utc),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "patient_id": "P1004",
        "name": "Maria Garcia",
        "age": 45,
        "gender": "Female",
        "race": "Hispanic",
        "contact": {
            "phone": "+1-555-0104",
            "email": "maria.g@email.com",
            "address": "321 Elm St, Los Angeles, CA"
        },
        "medical_history": [
            {
                "diagnosis": "Gestational Diabetes",
                "date": datetime(2023, 9, 10, tzinfo=timezone.utc),
                "notes": "Resolved post-pregnancy"
            }
        ],
        "medications": ["Insulin"],
        "risk_score": 0.28,
        "risk_category": "Low",
        "last_admission": datetime(2024, 1, 12, tzinfo=timezone.utc),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "patient_id": "P1005",
        "name": "David Brown",
        "age": 55,
        "gender": "Male",
        "race": "Caucasian",
        "contact": {
            "phone": "+1-555-0105",
            "email": "david.b@email.com",
            "address": "654 Cedar Rd, Houston, TX"
        },
        "medical_history": [
            {
                "diagnosis": "Type 2 Diabetes",
                "date": datetime(2023, 7, 25, tzinfo=timezone.utc),
                "notes": "HbA1c: 7.5%"
            }
        ],
        "medications": ["Metformin", "Pioglitazone"],
        "risk_score": 0.52,
        "risk_category": "Medium",
        "last_admission": datetime(2024, 1, 11, tzinfo=timezone.utc),
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]

# ============================================================
# PREDICTIONS DATA
# ============================================================
PREDICTIONS = [
    {
        "patient_id": "P1001",
        "risk_score": 0.72,
        "readmission_probability": 0.72,
        "risk_category": "High",
        "predicted_readmission": True,
        "model_version": "1.0.0",
        "feature_values": {
            "age": 65,
            "time_in_hospital": 5,
            "num_medications": 8,
            "num_diagnoses": 4
        },
        "created_at": utc_now(),
        "doctor_id": "dr_smith"
    },
    {
        "patient_id": "P1002",
        "risk_score": 0.45,
        "readmission_probability": 0.45,
        "risk_category": "Medium",
        "predicted_readmission": False,
        "model_version": "1.0.0",
        "feature_values": {
            "age": 58,
            "time_in_hospital": 3,
            "num_medications": 4,
            "num_diagnoses": 2
        },
        "created_at": utc_now(),
        "doctor_id": "dr_smith"
    },
    {
        "patient_id": "P1003",
        "risk_score": 0.85,
        "readmission_probability": 0.85,
        "risk_category": "High",
        "predicted_readmission": True,
        "model_version": "1.0.0",
        "feature_values": {
            "age": 72,
            "time_in_hospital": 7,
            "num_medications": 10,
            "num_diagnoses": 5
        },
        "created_at": utc_now(),
        "doctor_id": "dr_johnson"
    }
]

# ============================================================
# MAIN SEEDING FUNCTION
# ============================================================
async def seed_atlas():
    """Seed MongoDB Atlas with sample data"""
    
    print("="*70)
    print("🌱 SEEDING MONGODB ATLAS")
    print("="*70)
    
    try:
        # Connect to Atlas
        print("\n🔗 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected successfully!")
        
        # ============================================================
        # Create Collections
        # ============================================================
        print("\n📁 Creating collections...")
        collections = ["users", "patients", "predictions", "audit_logs"]
        for collection in collections:
            try:
                await db.create_collection(collection)
                print(f"   ✅ Created: {collection}")
            except Exception:
                print(f"   ⚠️ Already exists: {collection}")
        
        # ============================================================
        # Create Indexes
        # ============================================================
        print("\n🔍 Creating indexes...")
        try:
            await db.users.create_index([("username", 1)], unique=True)
            print("   ✅ users.username index")
        except Exception as e:
            print(f"   ⚠️ users.username: {e}")
        
        try:
            await db.users.create_index([("email", 1)], unique=True)
            print("   ✅ users.email index")
        except Exception as e:
            print(f"   ⚠️ users.email: {e}")
        
        try:
            await db.patients.create_index([("patient_id", 1)], unique=True)
            print("   ✅ patients.patient_id index")
        except Exception as e:
            print(f"   ⚠️ patients.patient_id: {e}")
        
        try:
            await db.patients.create_index([("risk_category", 1)])
            print("   ✅ patients.risk_category index")
        except Exception as e:
            print(f"   ⚠️ patients.risk_category: {e}")
        
        try:
            await db.predictions.create_index([("patient_id", 1)])
            print("   ✅ predictions.patient_id index")
        except Exception as e:
            print(f"   ⚠️ predictions.patient_id: {e}")
        
        try:
            await db.predictions.create_index([("created_at", -1)])
            print("   ✅ predictions.created_at index")
        except Exception as e:
            print(f"   ⚠️ predictions.created_at: {e}")
        
        # ============================================================
        # Insert Users
        # ============================================================
        print("\n👤 Adding users...")
        for user in USERS:
            existing = await db.users.find_one({"username": user["username"]})
            if existing:
                print(f"   ⚠️ User exists: {user['username']}")
            else:
                await db.users.insert_one(user)
                print(f"   ✅ Added: {user['username']} ({user['role']})")
        
        # ============================================================
        # Insert Patients
        # ============================================================
        print("\n🏥 Adding patients...")
        for patient in PATIENTS:
            existing = await db.patients.find_one({"patient_id": patient["patient_id"]})
            if existing:
                print(f"   ⚠️ Patient exists: {patient['patient_id']}")
            else:
                await db.patients.insert_one(patient)
                print(f"   ✅ Added: {patient['patient_id']} - {patient['name']}")
        
        # ============================================================
        # Insert Predictions
        # ============================================================
        print("\n📊 Adding predictions...")
        for pred in PREDICTIONS:
            result = await db.predictions.insert_one(pred)
            print(f"   ✅ Added prediction for: {pred['patient_id']}")
        
        # ============================================================
        # Summary
        # ============================================================
        print("\n" + "="*70)
        print("📊 DATABASE SEEDING COMPLETE!")
        print("="*70)
        
        users_count = await db.users.count_documents({})
        patients_count = await db.patients.count_documents({})
        predictions_count = await db.predictions.count_documents({})
        
        print(f"\n📋 Collection Counts:")
        print(f"   👤 Users: {users_count}")
        print(f"   🏥 Patients: {patients_count}")
        print(f"   📊 Predictions: {predictions_count}")
        
        print("\n🔑 Login Credentials:")
        print("   ┌────────────────────────────┬──────────────────┐")
        print("   │ Username                   │ Password         │")
        print("   ├────────────────────────────┼──────────────────┤")
        print("   │ admin                      │ admin123         │")
        print("   │ dr_smith                   │ doctor123        │")
        print("   │ dr_johnson                 │ doctor123        │")
        print("   │ admin_hospital             │ admin123         │")
        print("   │ researcher                 │ research123      │")
        print("   └────────────────────────────┴──────────────────┘")
        
        client.close()
        print("\n✅ Database seeding completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n📌 Troubleshooting:")
        print("   1. Check your MongoDB Atlas password")
        print("   2. Ensure your IP is whitelisted in Atlas")
        print("   3. Verify the connection string is correct")

# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":
    asyncio.run(seed_atlas())