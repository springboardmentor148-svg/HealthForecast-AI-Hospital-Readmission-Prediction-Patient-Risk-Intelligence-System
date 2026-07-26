from pathlib import Path

SEED = 42
TEST_SIZE = 0.2
VALIDATION_SIZE = 0.2

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_RAW_DIR = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"

RAW_DATA_PATH = DATA_RAW_DIR / "diabetic_data.csv"
PROCESSED_DATA_PATH = DATA_PROCESSED_DIR / "diabetic_data_processed.parquet"

MODEL_PATH = MODELS_DIR / "xgboost_best.pkl"
PIPELINE_PATH = MODELS_DIR / "preprocessing_pipeline.pkl"
METRICS_PATH = REPORTS_DIR / "metrics.json"
FEATURE_IMPORTANCE_PATH = REPORTS_DIR / "feature_importance.csv"
CONFIG_PATH = REPORTS_DIR / "training_config.json"

AGE_MAP = {
    '[0-10)': 5, '[10-20)': 15, '[20-30)': 25, '[30-40)': 35,
    '[40-50)': 45, '[50-60)': 55, '[60-70)': 65, '[70-80)': 75,
    '[80-90)': 85, '[90-100)': 95
}

TOP_MEDICAL_SPECIALTIES_THRESHOLD = 500

ICD9_CATEGORIES = {
    (390, 459.99): 'Circulatory', (460, 519.99): 'Respiratory',
    (520, 579.99): 'Digestive', (250, 250.99): 'Diabetes',
    (800, 999.99): 'Injury', (710, 739.99): 'Musculoskeletal',
    (580, 629.99): 'Genitourinary', (1, 139.99): 'Infectious',
    (140, 239.99): 'Neoplasms', (240, 279.99): 'Endocrine_Metabolic_Other',
    (280, 289.99): 'Blood', (290, 319.99): 'Mental',
    (320, 389.99): 'Nervous', (630, 679.99): 'Pregnancy_Childbirth',
    (680, 709.99): 'Skin', (740, 759.99): 'Congenital',
    (760, 779.99): 'Perinatal', (780, 799.99): 'Symptoms_IllDefined'
}
