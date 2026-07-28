import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ==============================
# LOAD DATASET
# ==============================

df = pd.read_csv("dataset/diabetic_data.csv")

# ==============================
# FIRST 5 ROWS
# ==============================

print("========== FIRST 5 ROWS ==========")
print(df.head())

# ==============================
# DATASET SHAPE
# ==============================

print("\n========== DATASET SHAPE ==========")
print(df.shape)

# ==============================
# COLUMN NAMES
# ==============================

print("\n========== COLUMN NAMES ==========")
for column in df.columns:
    print(column)

# ==============================
# DATASET INFORMATION
# ==============================

print("\n========== DATASET INFORMATION ==========")
df.info()

# ==============================
# STATISTICAL SUMMARY
# ==============================

print("\n========== STATISTICAL SUMMARY ==========")
print(df.describe())

# ==============================
# CHECK ? VALUES
# ==============================

print("\n========== MISSING VALUES (?) ==========")
print((df == "?").sum())

# ==============================
# REPLACE ? WITH NaN
# ==============================

df.replace("?", np.nan, inplace=True)

print("\n========== MISSING VALUES AFTER REPLACING ? ==========")
print(df.isnull().sum())

# ==============================
# DUPLICATE RECORDS
# ==============================

print("\n========== DUPLICATE RECORDS ==========")
duplicates = df.duplicated().sum()
print("Total Duplicate Records:", duplicates)

# ==============================
# DROP UNNECESSARY COLUMNS
# ==============================

print("\n========== DROPPING UNNECESSARY COLUMNS ==========")

df.drop(columns=["encounter_id", "patient_nbr"], inplace=True)

print("Remaining Columns:", len(df.columns))

# ==============================
# DROP HIGH MISSING VALUE COLUMNS
# ==============================

print("\n========== DROPPING HIGH MISSING VALUE COLUMNS ==========")

columns_to_drop = [
    "weight",
    "max_glu_serum",
    "A1Cresult"
]

df.drop(columns=columns_to_drop, inplace=True)

print("Remaining Columns:", len(df.columns))

# ==============================
# DROP ZERO IMPORTANCE COLUMNS
# ==============================

print("\n========== DROPPING ZERO IMPORTANCE COLUMNS ==========")

zero_importance_columns = [
    "acetohexamide",
    "troglitazone",
    "examide",
    "citoglipton",
    "glimepiride-pioglitazone",
    "metformin-rosiglitazone",
    "metformin-pioglitazone"
]

df.drop(columns=zero_importance_columns, inplace=True, errors="ignore")

print("Remaining Columns:", len(df.columns))
print(df.columns)

# ==============================
# HANDLE REMAINING MISSING VALUES
# ==============================

print("\n========== HANDLING REMAINING MISSING VALUES ==========")

df["race"] = df["race"].fillna(df["race"].mode()[0])
df["diag_1"] = df["diag_1"].fillna(df["diag_1"].mode()[0])
df["diag_2"] = df["diag_2"].fillna(df["diag_2"].mode()[0])
df["diag_3"] = df["diag_3"].fillna(df["diag_3"].mode()[0])

df["payer_code"] = df["payer_code"].fillna("Unknown")
df["medical_specialty"] = df["medical_specialty"].fillna("Unknown")

print(df.isnull().sum())

# ==============================
# ENCODE CATEGORICAL COLUMNS
# ==============================

print("\n========== ENCODING CATEGORICAL COLUMNS ==========")

le = LabelEncoder()

categorical_columns = df.select_dtypes(include=["object"]).columns

for col in categorical_columns:
    df[col] = le.fit_transform(df[col])

print("Categorical Columns Encoded Successfully!")

# ==============================
# DATASET AFTER ENCODING
# ==============================

print("\n========== DATASET AFTER ENCODING ==========")
print(df.head())

print("\nDataset Shape:", df.shape)

print("\nData Types:")
print(df.dtypes)

# ==============================
# CONVERT 3 CLASSES TO 2 CLASSES
# ==============================

print("\n========== CONVERTING TARGET TO BINARY ==========")

# 0 = Readmitted (both <30 and >30)
# 1 = Not Readmitted (NO)

df["readmitted"] = df["readmitted"].replace({
    0: 0,
    1: 0,
    2: 1
})

print(df["readmitted"].value_counts())

# ==============================
# CHECK CLASS DISTRIBUTION
# ==============================

print("\n========== CLASS DISTRIBUTION ==========")

print(df["readmitted"].value_counts())

print("\nPercentage of Each Class:")

print(df["readmitted"].value_counts(normalize=True) * 100)

print("\n========== FEATURES AND TARGET ==========")

X = df.drop("readmitted", axis=1)
y = df["readmitted"]

print("Features Shape:", X.shape)
print("Target Shape:", y.shape)

print("\nFirst 5 Features:")
print(X.head())

print("\nFirst 5 Target Values:")
print(y.head())

print("\n========== TRAIN TEST SPLIT ==========")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
print("Training Features :", X_train.shape)
print("Testing Features  :", X_test.shape)
print("Training Labels   :", y_train.shape)
print("Testing Labels    :", y_test.shape)

print("\n========== SAVING TRAIN AND TEST DATA ==========")

# Training Dataset
train_data = X_train.copy()
train_data["readmitted"] = y_train.values

# Testing Dataset
test_data = X_test.copy()
test_data["readmitted"] = y_test.values

# Save CSV Files
train_data.to_csv("dataset/train_data.csv", index=False)
test_data.to_csv("dataset/test_data.csv", index=False)

print("Train dataset saved successfully!")
print("Test dataset saved successfully!")

print("\n========== FEATURE SCALING ==========")

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

print("Feature Scaling Completed Successfully!")

print("Training Data Shape:", X_train.shape)
print("Testing Data Shape:", X_test.shape)

print("\n========== SAVING PREPROCESSED DATASET ==========")

df.to_csv("dataset/clean_diabetic_data.csv", index=False)

print("Preprocessed dataset saved successfully!")

