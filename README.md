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
├── pre-processed dataset/
│   ├── age_distribution.png          # Visualization of age cohorts
│   ├── correlation_heatmap.png       # Pearson correlation matrix heatmap
│   ├── dataset_summary.csv           # Missing values, data types, and shape summary
│   ├── numeric_summary_stats.csv     # Descriptive statistics for numeric features
│   ├── readmission_distribution.png  # Target variable balance plot
│   ├── target_class_balance.csv      # Statistics of readmission vs non-readmission
│   ├── test_processed.csv            # Processed test split (20%)
│   └── train_processed.csv           # Processed train split (80%)
├── pre-processing notebook/
│   └── Diabetes_Preprocessing.ipynb  # Jupyter Notebook for EDA and preprocessing pipeline
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
- **Language**: Python (v3.8+)
- **Environment**: Jupyter Notebook / Google Colab
- **Data Wrangling**: `pandas`, `numpy`
- **Visualization**: `matplotlib`, `seaborn`
- **Machine Learning**: `scikit-learn`, `xgboost`

---

## Machine Learning Models
The project implements and evaluates the following machine learning models to identify the optimal classifier for readmission prediction:
1. **Logistic Regression** (Baseline linear classifier)
2. **Decision Tree** (Non-linear interpretable baseline)
3. **Random Forest** (Ensemble bagging model)
4. **K-Nearest Neighbors (KNN)** (Instance-based classifier)
5. **Support Vector Machine (SVM)** (Maximum-margin classification)
6. **XGBoost** (Optimized gradient boosting framework)

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

### 1. Data Preprocessing & EDA
To review and run the data cleaning, exploratory analysis, and train-test splitting steps:
1. Launch Jupyter Notebook or JupyterLab:
   ```bash
   jupyter notebook
   ```
2. Open the notebook [Diabetes_Preprocessing.ipynb](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/pre-processing%20notebook/Diabetes_Preprocessing.ipynb) in the `pre-processing notebook/` directory.
3. Execute the cells to process the raw dataset and generate visualizations. The cleaned datasets and metrics will be saved in `pre-processed dataset/`.

### 2. Model Training & Evaluation (Active Development)
The modeling pipeline is currently being developed. Once completed, scripts or notebooks for model training and evaluation will be added to the project.

---

## Project Status
This project is currently **under active development** as part of an internship. The preprocessing, feature engineering, and exploratory data analysis phases are complete, and model implementation is underway.

---

## Future Scope
- **Model Deployment**: Expose the best-performing model via a REST API (using FastAPI or Flask) and build an interactive web interface (using Streamlit or React) for clinician interaction.
- **Explainable AI (XAI)**: Integrate SHAP (SHapley Additive exPlanations) and LIME to interpret individual predictions, allowing doctors to understand *why* a patient is classified as high-risk.
- **Real-Time Patient Risk Prediction**: Design integration hooks to pull live patient records from Electronic Health Records (EHR) systems to predict readmissions dynamically during patient stay.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.
