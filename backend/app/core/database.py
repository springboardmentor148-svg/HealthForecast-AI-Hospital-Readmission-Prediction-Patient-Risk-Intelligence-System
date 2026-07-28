from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.patient import Patient
from app.models.prediction import Prediction
from app.models.audit import AuditLog

db = None
client = None

async def connect_to_mongo():
    global db, client
    try:
        print("🔗 Connecting to MongoDB...")
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
        
        await init_beanie(
            database=db,
            document_models=[User, Patient, Prediction, AuditLog]
        )
        print(f"📁 Database: {settings.DATABASE_NAME}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        raise

async def close_mongo_connection():
    if client:
        client.close()
        print("✅ Closed MongoDB connection")

def get_db():
    return db