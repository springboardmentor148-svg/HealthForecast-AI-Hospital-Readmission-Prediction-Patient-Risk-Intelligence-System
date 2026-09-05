from pymongo.mongo_client import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017")
    client.admin.command('ping')
    print("✅ Connected to MongoDB successfully!")
    
    # List databases
    dbs = client.list_database_names()
    print(f"📁 Databases: {dbs}")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")