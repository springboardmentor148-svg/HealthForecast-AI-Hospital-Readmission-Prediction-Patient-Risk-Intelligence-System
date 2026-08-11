FROM python:3.13-slim

WORKDIR /app
RUN mkdir -p /app/data
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY ml/ ./ml/
COPY dataset/ ./dataset/
COPY models/ ./models/
COPY static/ ./static/

# The current application loads the ML files from the project root.
COPY ml/readmission_model.pkl ./readmission_model.pkl
COPY ml/label_encoders.pkl ./label_encoders.pkl

ENV PYTHONPATH=/app/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]