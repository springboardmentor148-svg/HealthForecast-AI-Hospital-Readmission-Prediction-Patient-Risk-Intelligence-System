from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

USERNAME = "root"
PASSWORD = "Sabade@S1234"
HOST = "localhost"
PORT = "3306"
DATABASE = "healthforecast_ai"

encoded_password = quote_plus(PASSWORD)

DATABASE_URL = (
    f"mysql+pymysql://{USERNAME}:{encoded_password}@{HOST}:{PORT}/{DATABASE}"
)

print(DATABASE_URL)   # Temporary, for testing

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()