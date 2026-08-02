import pandas as pd
import numpy as np
df = pd.read_csv("dataset/diabetic_data.csv")
# Handle Missing Values
df.replace("?", np.nan, inplace=True)
# Drop Columns
df.drop(columns=["weight"], inplace=True)
# Convert target variable into binary
df["readmitted"] = df["readmitted"].map({
    "<30": 1,
    ">30": 0,
    "NO": 0
})
# Remove Unnecessary Identifier Features
df.drop(columns=["patient_nbr", "encounter_id"], inplace=True)
missing = df.isnull().sum()

missing = missing[missing > 0]

print(missing.sort_values(ascending=False))
print("===============")
# Remove Features With High Missing values And Unnecessary Info
df.drop(columns=[
    "max_glu_serum",
    "A1Cresult",
    "medical_specialty",
    "payer_code"
], inplace=True)
print("Rows before dropping:", len(df))
df = df.dropna(subset=["race", "diag_1", "diag_2", "diag_3"])
print("Rows after dropping:", len(df))
print(df.isnull().sum())
# Encoding
categorical_columns = df.select_dtypes(include=["object"]).columns
print(categorical_columns)
print("Rows before:", len(df))
df = df.dropna(subset=["race", "diag_1", "diag_2", "diag_3"])
print("Rows after:", len(df))
categorical_columns = df.select_dtypes(include=["object"]).columns
print(categorical_columns)