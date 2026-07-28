# HealthForecastAI 🩺📊

HealthForecastAI is a machine learning project for predicting diabetic readmission using the **Diabetic Readmission Dataset** and an **XGBoost** classifier. The pipeline includes preprocessing, missing value handling, label encoding, feature scaling, train-test splitting, model training, and evaluation with standard classification metrics.

## Project Overview 🚀

The goal of this project is to build a practical readmission prediction workflow for healthcare analytics. The raw dataset is cleaned and transformed into model-ready features, then used to train an XGBoost model that predicts patient readmission outcomes.

The current model achieves an **accuracy of 59.65%** on the test set.

## Features ✨

- Data preprocessing for medical tabular data
- Missing value handling and cleanup of placeholder values
- Label encoding for categorical features
- Feature scaling with `StandardScaler`
- Train-test split with stratified sampling
- XGBoost model training for multi-class classification
- Feature importance analysis
- Confusion matrix evaluation
- Classification report generation

## Tech Stack 🛠️

- Python
- Pandas
- NumPy
- scikit-learn
- XGBoost
- Joblib

## Dataset 📁

This project uses the **Diabetic Readmission Dataset**, a healthcare dataset containing patient encounter records and clinical attributes related to readmission outcomes.

Dataset files included in the repository:

- `dataset/diabetic_data.csv` - raw dataset
- `dataset/clean_diabetic_data.csv` - cleaned dataset
- `dataset/train_data.csv` - training split
- `dataset/test_data.csv` - testing split

## Project Structure 📂

```text
HealthForecastAI/
├── backend/
│   ├── preprocessing.py
│   ├── model_training.py
│   └── prediction.py
├── dataset/
│   ├── diabetic_data.csv
│   ├── clean_diabetic_data.csv
│   ├── train_data.csv
│   └── test_data.csv
├── docs/
├── frontend/
├── images/
├── models/
├── notebooks/
├── screenshots/
└── README.md
```

## Installation ⚙️

### 1. Clone the repository

```bash
git clone https://github.com/your-username/HealthForecastAI.git
cd HealthForecastAI
```

### 2. Create a virtual environment

```bash
python -m venv .venv
.venv\\Scripts\\activate
```

### 3. Install dependencies

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

## Usage ▶️

### 1. Preprocess the dataset

Run the preprocessing script to clean the raw dataset and generate train/test splits:

```bash
python backend/preprocessing.py
```

### 2. Train and evaluate the model

Train the XGBoost model and generate evaluation metrics:

```bash
python backend/model_training.py
```

### 3. Model output

The trained model is saved as:

```text
dataset/xgboost_model.pkl
```

## Results 📈

The trained XGBoost classifier produces the following evaluation outputs:

- Accuracy: **59.65%**
- Confusion matrix for class-wise prediction analysis
- Classification report with precision, recall, and F1-score
- Feature importance ranking to identify influential variables

## Future Improvements 🔮

- Experiment with hyperparameter tuning for XGBoost
- Compare performance with Random Forest, LightGBM, and CatBoost
- Add cross-validation for more reliable evaluation
- Improve feature engineering for clinical variables
- Build a web or API-based prediction interface
- Save and version multiple trained model artifacts

## Author 👨‍💻

**HealthForecastAI Project**

Created for machine learning-based healthcare prediction and readmission risk analysis.
