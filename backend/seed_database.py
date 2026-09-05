import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from passlib.context import CryptContext

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "healthforecast"

# Use same hashing as security.py
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except:
        salt = "HealthForecastSalt"
        import hashlib
        return f"sha256${hashlib.sha256((password + salt).encode()).hexdigest()}"

async def seed_database():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Create collections
    for collection in ["users", "patients", "predictions", "audit_logs"]:
        try:
            await db.create_collection(collection)
            print(f"✅ Created collection: {collection}")
        except Exception:
            print(f"⚠️ Collection {collection} already exists")
    
    # Users with correct password hashing
    users = [
        {"username": "admin", "email": "admin@healthforecast.ai", "hashed_password": hash_password("admin123"), "full_name": "System Administrator", "role": "system_admin", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"username": "dr_smith", "email": "dr.smith@hospital.com", "hashed_password": hash_password("doctor123"), "full_name": "Dr. John Smith", "role": "doctor", "hospital_id": "HOSP001", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"username": "dr_johnson", "email": "dr.johnson@hospital.com", "hashed_password": hash_password("doctor123"), "full_name": "Dr. Sarah Johnson", "role": "doctor", "hospital_id": "HOSP002", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"username": "admin_hospital", "email": "admin@hospital.com", "hashed_password": hash_password("admin123"), "full_name": "Hospital Admin", "role": "hospital_admin", "hospital_id": "HOSP001", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"username": "researcher", "email": "researcher@health.com", "hashed_password": hash_password("research123"), "full_name": "Healthcare Researcher", "role": "researcher", "is_active": True, "created_at": datetime.now(timezone.utc)}
    ]
    
    for user in users:
        existing = await db.users.find_one({"username": user["username"]})
        if existing:
            await db.users.update_one(
                {"username": user["username"]},
                {"$set": {"hashed_password": user["hashed_password"]}}
            )
            print(f"✅ Updated user: {user['username']}")
        else:
            await db.users.insert_one(user)
            print(f"✅ Added user: {user['username']}")
    
    print("\n" + "="*50)
    print("✅ DATABASE SEEDED SUCCESSFULLY!")
    print("="*50)
    print("\n🔑 Login Credentials:")
    print("   admin / admin123")
    print("   dr_smith / doctor123")
    print("   dr_johnson / doctor123")
    print("   admin_hospital / admin123")
    print("   researcher / research123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())