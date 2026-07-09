# Databricks notebook source
# MAGIC %md
# MAGIC # Prognexa AI
# MAGIC
# MAGIC ## Hospital Readmission Prediction and Patient Risk Intelligence System
# MAGIC
# MAGIC ### Notebook 03 : Model Training (XGBoost)
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## Objective
# MAGIC
# MAGIC The objective of this notebook is to train an XGBoost classification model for predicting hospital readmission.
# MAGIC
# MAGIC The notebook performs the following tasks:
# MAGIC
# MAGIC - Load the ML-ready dataset
# MAGIC - Convert Spark DataFrame to Pandas DataFrame
# MAGIC - Encode categorical features
# MAGIC - Split the dataset into training and testing sets
# MAGIC - Train the XGBoost model
# MAGIC - Prevent overfitting using suitable techniques
# MAGIC - Evaluate model performance
# MAGIC - Save the trained model
# MAGIC
# MAGIC The trained model will later be integrated into the FastAPI backend.

# COMMAND ----------

# MAGIC %pip install xgboost

# COMMAND ----------

# ==========================================================
# IMPORT REQUIRED LIBRARIES
# ----------------------------------------------------------
# Import all libraries required for model training,
# preprocessing, evaluation and model saving.
# ==========================================================

from pyspark.sql.functions import *

import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    ConfusionMatrixDisplay,
    RocCurveDisplay
)

import matplotlib.pyplot as plt

import joblib

print("✅ Libraries Imported Successfully")

# COMMAND ----------

# ==========================================================
# CHECK XGBOOST VERSION
# ==========================================================

import xgboost

print("XGBoost Version :", xgboost.__version__)

# COMMAND ----------

# ==========================================================
# LOAD ML READY DATASET
# ==========================================================

df = spark.read.parquet(
    "/Volumes/workspace/default/prognexa_ai/ml_ready_dataset"
)

display(df.limit(5))

# COMMAND ----------

# ==========================================================
# CONVERT SPARK DATAFRAME TO PANDAS
# ==========================================================

pdf = df.toPandas()

print("Dataset Shape :", pdf.shape)

# COMMAND ----------

# ==========================================================
# ENCODE CATEGORICAL FEATURES
# ----------------------------------------------------------
# Convert text columns into numerical values.
# ==========================================================

label_encoders = {}

categorical_columns = pdf.select_dtypes(include=["object"]).columns

for column in categorical_columns:

    encoder = LabelEncoder()

    pdf[column] = encoder.fit_transform(
        pdf[column].astype(str)
    )

    label_encoders[column] = encoder

print("✅ Encoding Completed")

# COMMAND ----------

# ==========================================================
# PREPARE FEATURES AND TARGET
# ==========================================================

X = pdf.drop(columns=["label"])

y = pdf["label"]

print("Features :", X.shape)

print("Target :", y.shape)

# COMMAND ----------

# ==========================================================
# TRAIN TEST SPLIT
# ==========================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

    stratify=y

)

print("Training Samples :", len(X_train))

print("Testing Samples :", len(X_test))

# COMMAND ----------

# MAGIC %md
# MAGIC # Step 5 : Train the XGBoost Model
# MAGIC
# MAGIC The model is configured to reduce overfitting using:
# MAGIC
# MAGIC - Maximum Tree Depth
# MAGIC - Subsampling
# MAGIC - Column Sampling
# MAGIC - L1 Regularization
# MAGIC - L2 Regularization
# MAGIC - Learning Rate

# COMMAND ----------

# ==========================================================
# CREATE XGBOOST MODEL
# ----------------------------------------------------------
# Parameters selected to reduce overfitting.
# ==========================================================

xgb_model = XGBClassifier(

    objective="binary:logistic",

    n_estimators=300,

    learning_rate=0.05,

    max_depth=4,

    min_child_weight=5,

    subsample=0.8,

    colsample_bytree=0.8,

    reg_alpha=0.5,

    reg_lambda=1.0,

    random_state=42,

    eval_metric="logloss"

)

print("✅ XGBoost Model Created")

# COMMAND ----------

# ==========================================================
# TRAIN MODEL
# ==========================================================

xgb_model.fit(
    X_train,
    y_train
)

print("✅ Model Training Completed")

# COMMAND ----------

# ==========================================================
# MAKE PREDICTIONS
# ==========================================================

y_pred = xgb_model.predict(X_test)

y_prob = xgb_model.predict_proba(X_test)[:,1]

print("Predictions Generated")

# COMMAND ----------

# ==========================================================
# CALCULATE MODEL METRICS
# ==========================================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(y_test, y_pred)

recall = recall_score(y_test, y_pred)

f1 = f1_score(y_test, y_pred)

roc_auc = roc_auc_score(y_test, y_prob)

print("Accuracy :", accuracy)

print("Precision :", precision)

print("Recall :", recall)

print("F1 Score :", f1)

print("ROC AUC :", roc_auc)

# COMMAND ----------

# ==========================================================
# CLASSIFICATION REPORT
# ==========================================================

print(classification_report(
    y_test,
    y_pred
))

# COMMAND ----------

# MAGIC %md
# MAGIC # Model Training Completed
# MAGIC
# MAGIC The XGBoost model has been successfully trained.
# MAGIC
# MAGIC The next section will evaluate the model using:
# MAGIC
# MAGIC - Confusion Matrix
# MAGIC - ROC Curve
# MAGIC - Feature Importance
# MAGIC - SHAP Explainability
# MAGIC - Saving the trained model

# COMMAND ----------

# ==========================================================
# SAVE TRAINED MODEL
# ==========================================================

import joblib
import os

model_dir = "/Volumes/workspace/default/prognexa_ai/models"

os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, "readmission_model.pkl")

joblib.dump(xgb_model, model_path)

print("✅ Model Saved Successfully")

print("Saved at:", model_path)

# COMMAND ----------

# ==========================================================
# SAVE TEST DATA
# ==========================================================

X_test.to_csv(
    "/Volumes/workspace/default/prognexa_ai/models/X_test.csv",
    index=False
)

y_test.to_csv(
    "/Volumes/workspace/default/prognexa_ai/models/y_test.csv",
    index=False
)

print("✅ Test Dataset Saved Successfully")

# COMMAND ----------

# ==========================================================
# EXPORT MODEL IN XGBOOST NATIVE JSON FORMAT
# ==========================================================

import os

model_dir = "/Volumes/workspace/default/prognexa_ai/models"

os.makedirs(model_dir, exist_ok=True)

json_model_path = os.path.join(
    model_dir,
    "readmission_model.json"
)

xgb_model.save_model(json_model_path)

print("✅ Model exported successfully!")
print(json_model_path)

# COMMAND ----------

# ==========================================================
# SAVE FEATURE COLUMN NAMES
# ==========================================================

import json
import os

feature_columns = X_train.columns.tolist()

save_path = "/Volumes/workspace/default/prognexa_ai/models/feature_columns.json"

with open(save_path, "w") as f:
    json.dump(feature_columns, f)

print("✅ Feature columns saved successfully!")

print("Total Features:", len(feature_columns))

# COMMAND ----------

# ==========================================================
# SAVE LABEL ENCODERS
# ==========================================================

import joblib
import os

encoder_path = "/Volumes/workspace/default/prognexa_ai/models/label_encoders.pkl"

joblib.dump(label_encoders, encoder_path)

print("✅ Label Encoders Saved Successfully")
print("Saved at:", encoder_path)

# COMMAND ----------

# ==========================================================
# VERIFY SAVED LABEL ENCODERS
# ==========================================================

import joblib

encoder_path = "/Volumes/workspace/default/prognexa_ai/models/label_encoders.pkl"

encoders = joblib.load(encoder_path)

print("Type :", type(encoders))
print("Length :", len(encoders))

if isinstance(encoders, dict):
    print("\nFirst 10 Keys:")
    print(list(encoders.keys())[:10])

    print("\nSample Encoder:")
    first_key = list(encoders.keys())[0]
    print(first_key)
    print(encoders[first_key])

else:
    print(encoders)