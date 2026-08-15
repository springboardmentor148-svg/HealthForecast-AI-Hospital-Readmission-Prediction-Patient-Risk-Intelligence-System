import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch credentials from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

def sync_database():
    # Verify required credentials exist
    if not DB_PASSWORD or not DB_NAME:
        print("Error: DB_PASSWORD or DB_NAME is missing from your .env file.")
        sys.exit(1)

    connection = None
    cursor = None

    try:
        print(f"Connecting to database '{DB_NAME}' on {DB_HOST}:{DB_PORT}...")
        
        # Connect to PostgreSQL
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )

        cursor = connection.cursor()

        # Place your database creation/update queries here
        # Example schema synchronization query:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                event_name VARCHAR(100) NOT NULL,
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Commit transactions to database
        connection.commit()
        print("Database sync completed successfully!")

    except Exception as error:
        print(f"Error syncing database: {error}")
        if connection:
            connection.rollback()

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    sync_database()