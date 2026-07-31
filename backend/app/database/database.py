# MongoDB Database Connection

# Import Async MongoDB Client
from motor.motor_asyncio import AsyncIOMotorClient

# Import dotenv to read .env file
from dotenv import load_dotenv

# Import os to read environment variables
import os


# Load Environment Variables
load_dotenv()


# Read MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")


# Create MongoDB Client
client = AsyncIOMotorClient(MONGODB_URL)


# Connect to Database
database = client[DATABASE_NAME]


# Test database connection
if __name__ == "__main__":
    print("MongoDB Client Created Successfully")
    print("Database Name:", DATABASE_NAME)