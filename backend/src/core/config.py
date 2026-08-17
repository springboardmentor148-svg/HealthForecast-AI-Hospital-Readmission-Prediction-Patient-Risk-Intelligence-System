import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        # Database
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://healthforecast:healthforecast@localhost:5432/healthforecast",
        )
        self.db_pool_size: int = int(os.getenv("DB_POOL_SIZE", "5"))
        self.db_max_overflow: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        self.db_pool_pre_ping: bool = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"

        # API / CORS
        self.cors_origins: list[str] = [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
            ).split(",")
            if o.strip()
        ]

        # Gemini
        self.gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")

        # Misc
        self.seed_db: bool = os.getenv("SEED_DB", "true").lower() == "true"
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
