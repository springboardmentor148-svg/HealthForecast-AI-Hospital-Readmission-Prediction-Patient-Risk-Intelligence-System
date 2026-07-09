# Databricks notebook source
# MAGIC %md
# MAGIC # Prognexa AI
# MAGIC
# MAGIC ## Hospital Readmission Prediction and Patient Risk Intelligence System
# MAGIC
# MAGIC ### Notebook 04 : Model Evaluation
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## Objective
# MAGIC
# MAGIC The objective of this notebook is to evaluate the performance of the trained XGBoost classification model.
# MAGIC
# MAGIC The evaluation includes:
# MAGIC
# MAGIC - Accuracy
# MAGIC - Precision
# MAGIC - Recall
# MAGIC - F1-Score
# MAGIC - ROC-AUC Score
# MAGIC - Confusion Matrix
# MAGIC - ROC Curve
# MAGIC - Feature Importance
# MAGIC
# MAGIC These metrics help determine how well the model predicts hospital readmission and whether it generalizes effectively to unseen patient data.

# COMMAND ----------

# ==========================================================
# IMPORT REQUIRED LIBRARIES
# ==========================================================

import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    RocCurveDisplay
)

print("✅ Libraries Imported")

# COMMAND ----------

# MAGIC %pip install xgboost
# MAGIC dbutils.library.restartPython()

# COMMAND ----------

# MAGIC %restart_python

# COMMAND ----------

# ==========================================================
# VERIFY XGBOOST INSTALLATION
# ==========================================================

import xgboost

print("XGBoost Version:", xgboost.__version__)

# COMMAND ----------

# ==========================================================
# LOAD TRAINED MODEL
# ----------------------------------------------------------
# Load the trained XGBoost model saved in Notebook 03.
# ==========================================================

import joblib
import os

model_path = "/Volumes/workspace/default/prognexa_ai/models/readmission_model.pkl"

if os.path.exists(model_path):
    xgb_model = joblib.load(model_path)
    print("✅ Model Loaded Successfully")
else:
    raise FileNotFoundError(
        f"Model not found at: {model_path}\n"
        "Please run Notebook 03 completely before running Notebook 04."
    )

# COMMAND ----------

# ==========================================================
# LOAD TEST DATA
# ----------------------------------------------------------
# Load the testing dataset saved in Notebook 03.
# ==========================================================

import pandas as pd

X_test = pd.read_csv(
    "/Volumes/workspace/default/prognexa_ai/models/X_test.csv"
)

y_test = pd.read_csv(
    "/Volumes/workspace/default/prognexa_ai/models/y_test.csv"
)

# Convert DataFrame to Series
y_test = y_test.squeeze()

print("✅ Test Dataset Loaded Successfully")

print("X_test Shape :", X_test.shape)
print("y_test Shape :", y_test.shape)

# COMMAND ----------

# MAGIC %md
# MAGIC # Step 1 : Generate Predictions
# MAGIC
# MAGIC The trained XGBoost model predicts whether a patient is likely to be readmitted.
# MAGIC
# MAGIC We generate:
# MAGIC
# MAGIC - Predicted Class
# MAGIC - Prediction Probability

# COMMAND ----------

# ==========================================================
# GENERATE PREDICTIONS
# ==========================================================

y_pred = xgb_model.predict(X_test)

y_prob = xgb_model.predict_proba(X_test)[:, 1]

print("✅ Predictions Generated Successfully")

# COMMAND ----------

# MAGIC %md
# MAGIC # Step 2 : Evaluate Model Performance
# MAGIC
# MAGIC Calculate important classification metrics.

# COMMAND ----------

# ==========================================================
# CALCULATE MODEL PERFORMANCE METRICS
# ==========================================================

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(y_test, y_pred)

recall = recall_score(y_test, y_pred)

f1 = f1_score(y_test, y_pred)

roc_auc = roc_auc_score(y_test, y_prob)

print("="*50)
print("MODEL PERFORMANCE")
print("="*50)

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")

# COMMAND ----------

# ==========================================================
# CLASSIFICATION REPORT
# ==========================================================

from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred))

# COMMAND ----------

# MAGIC %md
# MAGIC # Step 3 : Confusion Matrix
# MAGIC
# MAGIC Visualize correct and incorrect predictions.

# COMMAND ----------

# ==========================================================
# CONFUSION MATRIX
# ==========================================================

import matplotlib.pyplot as plt

from sklearn.metrics import (
    confusion_matrix,
    ConfusionMatrixDisplay
)

cm = confusion_matrix(y_test, y_pred)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm
)

disp.plot(cmap="Blues")

plt.title("Confusion Matrix")

plt.show()

# COMMAND ----------

# MAGIC %md
# MAGIC # Step 4 : ROC Curve
# MAGIC
# MAGIC ROC Curve evaluates how well the classifier separates the two classes.

# COMMAND ----------

# ==========================================================
# ROC CURVE
# ==========================================================

from sklearn.metrics import RocCurveDisplay

RocCurveDisplay.from_predictions(
    y_test,
    y_prob
)

plt.title("ROC Curve")

plt.show()

# COMMAND ----------

# ==========================================================
# FEATURE IMPORTANCE
# ==========================================================

importance = pd.DataFrame({

    "Feature": X_test.columns,

    "Importance": xgb_model.feature_importances_

})

importance = importance.sort_values(

    by="Importance",

    ascending=False

)

display(importance.head(20))

# COMMAND ----------

# ==========================================================
# FEATURE IMPORTANCE GRAPH
# ==========================================================

top20 = importance.head(20)

plt.figure(figsize=(10,8))

plt.barh(

    top20["Feature"],

    top20["Importance"]

)

plt.gca().invert_yaxis()

plt.xlabel("Importance Score")

plt.ylabel("Features")

plt.title("Top 20 Most Important Features")

plt.show()

# COMMAND ----------

# ==========================================================
# SAVE MODEL PERFORMANCE
# ==========================================================

performance = pd.DataFrame({

    "Metric":[

        "Accuracy",

        "Precision",

        "Recall",

        "F1 Score",

        "ROC-AUC"

    ],

    "Value":[

        accuracy,

        precision,

        recall,

        f1,

        roc_auc

    ]

})

performance.to_csv(

    "/Volumes/workspace/default/prognexa_ai/models/model_performance.csv",

    index=False

)

print("✅ Performance Report Saved Successfully")

display(performance)

# COMMAND ----------

# MAGIC %md
# MAGIC Model Evaluation Summary
# MAGIC Tasks Completed
# MAGIC Loaded the trained XGBoost model
# MAGIC Loaded the testing dataset
# MAGIC Generated predictions
# MAGIC Calculated Accuracy
# MAGIC Calculated Precision
# MAGIC Calculated Recall
# MAGIC Calculated F1 Score
# MAGIC Calculated ROC-AUC
# MAGIC Generated Classification Report
# MAGIC Displayed Confusion Matrix
# MAGIC Displayed ROC Curve
# MAGIC Identified Top Important Features
# MAGIC Saved Model Performance Report