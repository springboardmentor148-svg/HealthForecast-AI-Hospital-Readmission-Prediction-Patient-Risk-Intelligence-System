from fastapi import FastAPI

app = FastAPI(
    title="HealthForecast AI",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message":"HealthForecast AI Backend Running"
    }