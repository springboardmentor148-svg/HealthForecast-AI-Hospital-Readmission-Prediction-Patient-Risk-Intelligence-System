from database import engine
from models import Base

print("Connecting to MySQL...")

Base.metadata.create_all(bind=engine)

print("Connected Successfully!")