from pymongo import MongoClient

from app.config import (
    MONGO_URL,
    MONGO_DB
)


# ==========================================
# MONGODB CLIENT
# ==========================================

client = MongoClient(

    MONGO_URL,

    serverSelectionTimeoutMS=5000

)


# ==========================================
# DATABASE
# ==========================================

mongo_db = client[
    MONGO_DB
]


# ==========================================
# COLLECTIONS
# ==========================================

analytics_collection = mongo_db[
    "analytics"
]

research_collection = mongo_db[
    "research_datasets"
]

audit_collection = mongo_db[
    "audit_logs"
]

model_monitoring_collection = mongo_db[
    "model_monitoring"
]


# ==========================================
# TEST MONGODB CONNECTION
# ==========================================

def test_mongodb_connection():

    try:

        client.admin.command(
            "ping"
        )

        return True

    except Exception:

        return False