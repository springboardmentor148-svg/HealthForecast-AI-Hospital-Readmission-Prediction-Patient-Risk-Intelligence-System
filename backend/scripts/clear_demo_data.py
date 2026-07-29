from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / ".flaskenv")

DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

TABLES_TO_CLEAR = [
    "prediction_history",
    "predictions",
    "treatment_effectiveness",
    "patients",
    "activity_logs",
]


def _count_rows(connection, table_name: str) -> int:
    result = connection.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
    return int(result.scalar_one())


def main() -> int:
    if not DB_URL:
        print("DATABASE_URL is not configured", file=sys.stderr)
        return 1

    engine = create_engine(DB_URL)
    with engine.begin() as connection:
        before_counts = {table: _count_rows(connection, table) for table in TABLES_TO_CLEAR}
        user_count_before = _count_rows(connection, "users")

        for table in TABLES_TO_CLEAR:
            connection.execute(text(f"DELETE FROM {table}"))

    with engine.connect() as connection:
        after_counts = {table: _count_rows(connection, table) for table in TABLES_TO_CLEAR}
        user_count_after = _count_rows(connection, "users")

    print("Demo data clear summary")
    for table in TABLES_TO_CLEAR:
        print(f"- {table}: deleted {before_counts[table]} rows, remaining {after_counts[table]}")
    print(f"- users: before {user_count_before}, after {user_count_after}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
