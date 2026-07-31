from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "HealthForecast AI"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://healthforecast:healthforecast@localhost:5432/healthforecast"
    secret_key: str = "healthforecast-demo-secret-change-me"
    access_token_minutes: int = 480
    data_path: str = str(Path(__file__).resolve().parents[2] / "data" / "diabetic_data.csv")
    model_path: str = str(Path(__file__).resolve().parents[2] / "models" / "readmission_model.joblib")


settings = Settings()

