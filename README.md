# HealthForecast AI – Hospital Readmission Prediction & Patient Risk Intelligence System

## Overview
**HealthForecast AI** is an end-to-end machine learning system designed to predict the risk of hospital readmission for diabetic patients within 30 days of discharge. 

In healthcare, hospital readmissions serve as a primary indicator of patient care quality and transition efficacy. Under the Hospital Readmission Reduction Program (HRRP), high readmission rates incur substantial financial penalties for clinical institutions. By predicting readmission risk before patient discharge, HealthForecast AI aims to support clinical decision-making, optimize discharge planning, reduce healthcare costs, and improve overall patient outcomes.

---

## Key Features
- **Comprehensive Preprocessing**: Automated handling of missing data (marked as `?` in the raw dataset), consolidating discharge dispositions, cleaning inconsistent records, and feature alignment.
- **Exploratory Data Analysis (EDA)**: Profiling demographic profiles, medical specialties, clinical visit metrics, and medication changes.
- **Feature Engineering**: Handling high-cardinality features, categorical encoding (label/binary encoding), and numerical normalization using standard scaling.
- **Multi-Model Pipeline**: Implementation and benchmarking of diverse classification algorithms.
- **Evaluation & Benchmarking**: Rigorous model comparison using multiple performance metrics.
- **Patient Risk Classification**: Grading patients into risk stratifications (low, medium, high) to guide targeted clinical care.

---

## Project Structure
```text
HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/
├── dataset/
│   └── diabetic_data.csv             # Raw UCI Diabetes 130-US Hospitals dataset
├── notebooks/
│   ├── Diabetes_Preprocessing.ipynb  # Exploratory Data Analysis & Preprocessing pipeline
│   ├── Model_Training.ipynb          # Multiclass Classification, Hyperparameter Tuning & AutoML
│   └── Binary_Classification.ipynb   # Binary Classification & Decision Threshold Optimization
├── pre-processed dataset/
│   ├── age_distribution.png          # Visualization of age cohorts
│   ├── correlation_heatmap.png       # Pearson correlation matrix heatmap
│   ├── dataset_summary.csv           # Missing values, data types, and shape summary
│   ├── numeric_summary_stats.csv     # Descriptive statistics for numeric features
│   ├── readmission_distribution.png  # Target variable balance plot
│   ├── target_class_balance.csv      # Statistics of readmission vs non-readmission
│   ├── test_processed.csv            # Processed test split (20%)
│   └── train_processed.csv           # Processed train split (80%)
├── LICENSE                           # Proprietary License terms
├── README.md                         # Project documentation (this file)
└── requirements.txt                  # Python dependencies
```

---

## Dataset Information
This project utilizes the **UCI Diabetes 130-US Hospitals dataset** (representing clinical database records from 1999 to 2008). 
- **Attributes**: 55 features including patient demographics (age, race, gender), admission/discharge details, clinical measures (number of lab tests, medications, procedures), and diabetic medications.
- **Target Variable**: `readmitted` (Categorized into `<30` days, `>30` days, or `NO` readmission).
- **Reference**: Beata Strack, Jonathan P. DeShazo, Chrisny Gennings, Albert L. Olansen, Vera B. Luesch, Leslie I. Copley, and John R. Warren, *"Impact of HbA1c Measurement on Hospital Readmission Rates: Analysis of 70,000 Clinical Database Records,"* BioMed Research International, vol. 2014, Article ID 781670, 2014. [Dataset Link](https://archive.ics.uci.edu/ml/datasets/Diabetes+130-US+hospitals+for+years+1999-2008).

---

## Technologies and Libraries Used
- **Language**: Python (v3.10+)
- **Environment**: Jupyter Notebook / Google Colab
- **Data Wrangling & Processing**: `pandas`, `numpy`, `scipy`, `imbalanced-learn`
- **Visualization**: `matplotlib`, `seaborn`
- **Machine Learning Frameworks**: `scikit-learn`, `xgboost`, `lightgbm`, `catboost`
- **AutoML & Optimization**: `flaml`, `optuna`

---

## Machine Learning Models & Modeling Approaches
The project implements both **Multiclass Classification** (predicting three categories: `<30` days, `>30` days, or `NO` readmission) and **Binary Classification** (predicting readmitted `<30` days vs. not readmitted `<30` days). 

The following models and approaches are implemented and evaluated:
1. **Baselines**: Logistic Regression, Decision Tree, K-Nearest Neighbors (KNN), Linear SVM, Random Forest, Extra Trees, XGBoost, LightGBM, and CatBoost.
2. **Class-Balanced Models**: Balanced Random Forest, Balanced XGBoost (using sample weights), and Balanced LightGBM to handle label skewness.
3. **Hyperparameter Optimization**: Tuned XGBoost (using RandomizedSearchCV) and Tuned LightGBM (using Optuna optimization).
4. **AutoML Pipelines**: FLAML AutoML search and FLAML Tuned XGBoost.
5. **Hybrid Classifiers**: A hybrid clustering-classification pipeline using K-Means clustering + XGBoost/LightGBM.

---

## Evaluation Metrics
To assess and compare the performance of each model, the following metrics are utilized:
- **Accuracy**: Overall fraction of correct predictions.
- **Precision**: Proportion of positive identifications that were actually correct.
- **Recall (Sensitivity)**: Proportion of actual positives identified correctly (crucial for identifying high-risk patients).
- **F1-Score**: Harmonic mean of Precision and Recall.
- **Confusion Matrix**: Tabular representation of true/false positives and negatives.
- **Classification Report**: Summary table displaying precision, recall, and F1-score per class.

---

## Model Evaluation & Performance Benchmarks

### 1. Multiclass Classification Benchmarks (Target: `readmitted` - 3 classes)
The models below are sorted by overall evaluation Accuracy:

| Model | Category | Accuracy | Precision | Recall | F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Optuna Tuned LightGBM** | Hyperparameter-Tuned | **58.99%** | 56.24% | 58.99% | 54.57% |
| Tuned XGBoost (RandomizedSearchCV) | Hyperparameter-Tuned | 58.96% | 55.88% | 58.96% | 54.44% |
| LightGBM | Baseline | 58.92% | 55.66% | 58.92% | 54.44% |
| XGBoost | Baseline | 58.88% | 56.11% | 58.88% | 54.63% |
| XGBoost (Rare Feature Removal) | Feature-Engineered | 58.86% | 55.96% | 58.86% | 54.63% |
| K-Means + XGBoost (Hybrid) | Hybrid | 58.79% | 55.70% | 58.79% | 54.56% |
| Auto-Tuned LightGBM (RandomizedSearchCV) | Hyperparameter-Tuned | 58.72% | 55.44% | 58.72% | 54.42% |
| CatBoost | Baseline | 58.72% | 56.30% | 58.72% | 53.49% |
| FLAML Tuned XGBoost | AutoML | 58.70% | 55.86% | 58.70% | 53.88% |
| FLAML AutoML | AutoML | 58.70% | 55.85% | 58.70% | 53.87% |
| Balanced Random Forest | Class-Balanced | 57.95% | 55.23% | 57.95% | 52.74% |
| Random Forest | Baseline | 57.83% | 54.45% | 57.83% | 52.90% |
| Extra Trees | Baseline | 57.33% | 53.27% | 57.33% | 53.00% |
| Logistic Regression | Baseline | 56.70% | 52.58% | 56.70% | 49.63% |
| Linear SVM | Baseline | 56.59% | 48.58% | 56.59% | 48.50% |
| Balanced XGBoost (sample weights) | Class-Balanced | 51.92% | **56.15%** | 51.92% | 53.50% |
| Balanced LightGBM | Class-Balanced | 51.60% | 55.51% | 51.60% | 53.07% |
| K-Nearest Neighbors | Baseline | 48.76% | 47.30% | 48.76% | 47.94% |
| Decision Tree | Baseline | 46.69% | 47.32% | 46.69% | 46.99% |

### 2. Binary Classification Benchmarks (Target: readmitted `<30` days vs other)
The models below are sorted by evaluation F1-Score:

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Optuna Tuned Binary LightGBM (Threshold = 0.25)** | 72.30% | 20.16% | 49.60% | **28.67%** | 68.43% |
| K-Means + Optuna Binary LightGBM | 72.12% | 19.89% | 49.02% | 28.30% | 68.38% |
| Binary LightGBM | 67.16% | 18.36% | **55.91%** | 27.65% | 67.41% |
| Binary LightGBM (Threshold = 0.50) | 67.10% | 18.18% | 55.20% | 27.36% | 67.41% |
| Optuna Tuned Binary LightGBM (Threshold = 0.50) | **88.40%** | **38.82%** | 5.87% | 10.19% | **68.43%** |

*Note: For the binary prediction task, standardizing the decision threshold to 0.50 resulted in extremely low sensitivity (Recall = 5.87%) due to severe class imbalance. Lowering the decision threshold to 0.25 optimized the trade-off, boosting the F1-score to 28.67% and recall to 49.60% to effectively screen patients.*

---

## Installation & Setup

### Prerequisites
Make sure you have Python 3.8+ installed on your machine.

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/HealthForecast-AI.git
   cd HealthForecast-AI
   ```
2. **Set Up a Virtual Environment**:
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   * **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

All Jupyter notebooks are located in the [notebooks/](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/notebooks) directory. To execute or view them, follow these steps:

1. Launch Jupyter Notebook or JupyterLab:
   ```bash
   jupyter notebook
   ```

2. Open and run the notebooks in order:
   - **Step 1: Data Preprocessing & EDA**  
     Open [Diabetes_Preprocessing.ipynb](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/notebooks/Diabetes_Preprocessing.ipynb) to clean the raw dataset, handle missing values (`?`), explore distributions, and save train/test splits.
   - **Step 2: Multiclass Modeling & Tuning**  
     Open [Model_Training.ipynb](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/notebooks/Model_Training.ipynb) to train the multiclass classifiers, perform Optuna search, run FLAML AutoML, and evaluate benchmarking tables.
   - **Step 3: Binary Classification & Threshold Analysis**  
     Open [Binary_Classification.ipynb](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/notebooks/Binary_Classification.ipynb) to study binary readmission metrics and run decision-threshold optimization plots.

---

## Project Status
This project is currently **under active development** as part of an internship. Data preprocessing, exploratory data analysis, and model training/evaluation for both multiclass and binary classification tasks are fully completed. Next phases involve deploying the best-performing models and implementing Explainable AI (XAI) features.

---

## Future Scope
- **Model Deployment**: Expose the best-performing model via a REST API (using FastAPI or Flask) and build an interactive web interface (using Streamlit or React) for clinician interaction.
- **Explainable AI (XAI)**: Integrate SHAP (SHapley Additive exPlanations) and LIME to interpret individual predictions, allowing doctors to understand *why* a patient is classified as high-risk.
- **Real-Time Patient Risk Prediction**: Design integration hooks to pull live patient records from Electronic Health Records (EHR) systems to predict readmissions dynamically during patient stay.

---

## License
This project and its accompanying documentation are proprietary and the exclusive property of **Soumi Saha**. All Rights Reserved. Refer to the [LICENSE](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/LICENSE) file for the full terms and conditions.
