FROM python:3.11-slim

# Install system dependencies needed for machine learning packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Add parent directory of backend package to PYTHONPATH
ENV PYTHONPATH=/app
ENV FLASK_APP=run:app

WORKDIR /app

# Install python dependencies first to leverage Docker build cache
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir --default-timeout=1000 --retries=20 catboost==1.2.10
RUN pip install --no-cache-dir --default-timeout=300 --retries=10 -r /app/backend/requirements.txt

# Copy ML model artifacts to the exact relative path required (/app/models)
COPY models /app/models
COPY dataset /app/dataset

# Copy the rest of the backend codebase
COPY backend /app/backend

# Switch working directory to backend root so flask finds migrations/
WORKDIR /app/backend

# Set entrypoint permissions and execute
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
