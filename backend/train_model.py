import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.pipeline.main import run_full_pipeline
from src.pipeline.report import generate_report


if __name__ == "__main__":
    print("Starting HealthForecast AI model training pipeline...")
    print("=" * 70)

    best_model, pipeline, results = run_full_pipeline()

    print("\nGenerating report...")
    report = generate_report()
    print("=" * 70)
    print("Done! All artifacts saved to backend/models/ and backend/reports/")
