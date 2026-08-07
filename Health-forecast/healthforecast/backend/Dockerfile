# Build with context = the project ROOT (see docker-compose.yml: `context: ..`),
# so this Dockerfile can reach both the single top-level requirements.txt
# and healthforecast/backend + healthforecast/model in one COPY set.
FROM python:3.11-slim

WORKDIR /app

# Installs from the project's single requirements.txt so the image never
# drifts from what's actually tested locally.
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY healthforecast/backend /app/backend
COPY healthforecast/model /app/model

WORKDIR /app/backend
ENV HF_JWT_SECRET=change-me-in-production

EXPOSE 8000
CMD ["sh", "-c", "python3 seed_db.py; uvicorn main:app --host 0.0.0.0 --port 8000"]
