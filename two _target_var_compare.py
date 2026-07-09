# Databricks notebook source
# MAGIC %md
# MAGIC # Prognexa AI
# MAGIC
# MAGIC ## Hospital Readmission Prediction and Patient Risk Intelligence System
# MAGIC
# MAGIC ### Notebook 02 : ML Data Preparation
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## 📌 Objective
# MAGIC
# MAGIC The objective of this notebook is to prepare the cleaned dataset for machine learning model development.
# MAGIC
# MAGIC The dataset generated in **Notebook 01 (Data Preprocessing & Exploratory Data Analysis)** is loaded and transformed into a machine learning-ready dataset.
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## 🎯 Tasks Performed
# MAGIC
# MAGIC - Load the cleaned dataset generated in Notebook 01
# MAGIC - Handle any remaining missing values
# MAGIC - Create the binary target variable (`label`) for hospital readmission prediction
# MAGIC - Separate and identify numerical and categorical features
# MAGIC - Prepare the feature dataset for machine learning
# MAGIC - Save the machine learning-ready dataset for model training
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## 📤 Output
# MAGIC
# MAGIC By the end of this notebook, we will have:
# MAGIC
# MAGIC - A clean machine learning-ready dataset
# MAGIC - Clearly identified numerical and categorical features
# MAGIC - A binary target column (`label`)
# MAGIC - A dataset ready for training classification models
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## 📚 Next Notebook
# MAGIC
# MAGIC **Notebook 03 : Model Training**
# MAGIC
# MAGIC The next notebook will focus on:
# MAGIC
# MAGIC - Loading the ML-ready dataset
# MAGIC - Train-Test Split
# MAGIC - Model-specific feature encoding (where required)
# MAGIC - Training multiple classification models:
# MAGIC   - Logistic Regression
# MAGIC   - Random Forest (Bagging)
# MAGIC   - XGBoost (Boosting)
# MAGIC - Hyperparameter Tuning
# MAGIC - Cross-Validation
# MAGIC - Model Evaluation
# MAGIC - MLflow Experiment Tracking
# MAGIC - Selecting the Best Performing Model

# COMMAND ----------

# ==========================================================
# IMPORT LIBRARIES
# ==========================================================

from pyspark.sql.functions import *
from pyspark.sql.types import *

print("Libraries Imported Successfully")

# COMMAND ----------

# ==========================================================
# LOAD CLEAN DATASET
# ==========================================================

df = spark.read.parquet(
    "/Volumes/workspace/default/prognexa_ai/processed_diabetic_data"
)

display(df.limit(5))

# COMMAND ----------

# ==========================================================
# CHECK DATASET SIZE
# ==========================================================

print("Rows :", df.count())
print("Columns :", len(df.columns))

# COMMAND ----------

# ==========================================================
# CHECK SCHEMA
# ==========================================================

df.printSchema()

# COMMAND ----------

# ==========================================================
# HANDLE REMAINING NULL VALUES
# ==========================================================

df = df.fillna("Unknown")

print("Missing values handled.")

# COMMAND ----------

# ==========================================================
# CREATE TARGET LABEL
# ==========================================================

df = df.withColumn(
    "label",
    when(col("readmitted") == "NO", 0).otherwise(1)
)

display(df.select("readmitted", "label").limit(10))

# COMMAND ----------

# ==========================================================
# REMOVE TARGET COLUMN FROM FEATURES
# ==========================================================

feature_df = df.drop("readmitted")

display(feature_df.limit(5))

# COMMAND ----------

# ==========================================================
# DISPLAY ALL FEATURES
# ==========================================================

print(feature_df.columns)

# COMMAND ----------

# ==========================================================
# COUNT CATEGORICAL FEATURES
# ==========================================================

categorical = []

for field in feature_df.schema.fields:

    if isinstance(field.dataType, StringType):

        categorical.append(field.name)

print(categorical)

# COMMAND ----------

# ==========================================================
# COUNT NUMERICAL FEATURES
# ==========================================================

numerical = []

for field in feature_df.schema.fields:

    if not isinstance(field.dataType, StringType):

        numerical.append(field.name)

print(numerical)

# COMMAND ----------

# ==========================================================
# DISPLAY FEATURE SUMMARY
# ==========================================================

print("Categorical Features :", len(categorical))

print("Numerical Features :", len(numerical))

# COMMAND ----------

# ==========================================================
# SAVE ML READY DATASET
# ==========================================================

feature_df.write.mode("overwrite").parquet(
    "/Volumes/workspace/default/prognexa_ai/ml_ready_dataset"
)

print("ML Ready Dataset Saved.")

# COMMAND ----------

# ==========================================================
# VERIFY SAVED DATASET
# ==========================================================

verify_df = spark.read.parquet(
    "/Volumes/workspace/default/prognexa_ai/ml_ready_dataset"
)

display(verify_df.limit(5))

# COMMAND ----------

# MAGIC %md
# MAGIC # Summary
# MAGIC
# MAGIC ### Completed
# MAGIC
# MAGIC - Loaded cleaned dataset
# MAGIC - Handled remaining missing values
# MAGIC - Created binary target label
# MAGIC - Prepared feature dataset
# MAGIC - Identified categorical and numerical features
# MAGIC - Saved ML-ready dataset
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## Next Notebook
# MAGIC
# MAGIC ### 03_Model_Training
# MAGIC
# MAGIC The next notebook will perform:
# MAGIC
# MAGIC - Train-Test Split
# MAGIC - String Indexing (only required columns)
# MAGIC - Logistic Regression
# MAGIC - Random Forest (Bagging)
# MAGIC - XGBoost (Boosting)
# MAGIC - Cross Validation
# MAGIC - Hyperparameter Tuning
# MAGIC - MLflow Tracking
# MAGIC - Model Comparison
# MAGIC - Best Model Selection