# Backend Dockerfile — FastAPI + Uvicorn

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed by some ML libraries (e.g. xgboost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better Docker layer caching —
# this layer only rebuilds when requirements.txt actually changes,
# not on every code change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]