import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE

from xgboost import XGBClassifier

# ===========================
# Load Dataset
# ===========================

df = pd.read_csv("dataset/cleaned_diabetic_data.csv")

print("=" * 60)
print("DATASET LOADED SUCCESSFULLY")
print("=" * 60)

print("\nOriginal Target Distribution\n")
print(df["readmitted"].value_counts())

print("\nPercentage Distribution\n")
print(df["readmitted"].value_counts(normalize=True) * 100)

# ===========================
# Remove Unnecessary Columns
# ===========================

columns_to_drop = [
    "encounter_id",
    "patient_nbr"
]

for col in columns_to_drop:
    if col in df.columns:
        df.drop(col, axis=1, inplace=True)

# ===========================
# Convert Target to Binary
# ===========================

# High Risk (<30) = 1
# Not High Risk (>30 and NO) = 0

df["readmitted"] = df["readmitted"].apply(
    lambda x: 1 if x == "<30" else 0
)

print("\nBinary Target Distribution\n")
print(df["readmitted"].value_counts())

print("\nPercentage\n")
print(df["readmitted"].value_counts(normalize=True) * 100)

# ===========================
# Encode Categorical Features
# ===========================

label_encoders = {}

categorical_columns = df.select_dtypes(include="object").columns

for column in categorical_columns:

    encoder = LabelEncoder()

    df[column] = encoder.fit_transform(df[column].astype(str))

    label_encoders[column] = encoder

print("\nCategorical Feature Encoding Completed!")

# ===========================
# Selected Features
# ===========================

selected_features = [
    "race",
    "gender",
    "age",
    "weight",
    "admission_type_id",
    "discharge_disposition_id",
    "admission_source_id",
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "diag_1",
    "diag_2",
    "diag_3",
    "number_diagnoses",
    "max_glu_serum",
    "A1Cresult",
    "insulin",
    "change",
    "diabetesMed"
]

X = df[selected_features]
y = df["readmitted"]

print("\nSelected Features\n")
print(X.columns)

# ===========================
# Train Test Split
# ===========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

# ===========================
# Apply SMOTE
# ===========================

smote = SMOTE(random_state=42)

X_train, y_train = smote.fit_resample(
    X_train,
    y_train
)

print("\nAfter SMOTE\n")
print(pd.Series(y_train).value_counts())

print("\nReady for Binary XGBoost Training...\n")
# ===========================
# Binary XGBoost Model
# ===========================

xgb = XGBClassifier(

    objective="binary:logistic",

    eval_metric="logloss",

    random_state=42,



)

# ===========================
# Hyperparameter Tuning
# ===========================

param_dist = {

    "n_estimators": [300, 500, 700],

    "max_depth": [4, 6, 8],

    "learning_rate": [0.01, 0.03, 0.05],

    "min_child_weight": [1, 3, 5],

    "gamma": [0, 0.2, 0.5],

    "subsample": [0.8, 0.9, 1.0],

    "colsample_bytree": [0.8, 0.9, 1.0]

}

random_search = RandomizedSearchCV(

    estimator=xgb,

    param_distributions=param_dist,

    n_iter=40,

    cv=5,

    scoring="f1",

    random_state=42,

    n_jobs=-1,

    verbose=2

)

print("\n")
print("=" * 60)
print("TRAINING BINARY XGBOOST MODEL")
print("=" * 60)

random_search.fit(X_train, y_train)

model = random_search.best_estimator_

print("\nBest Parameters Found:\n")

print(random_search.best_params_)
# ===========================
# Prediction
# ===========================
# Predict probability of High Risk
y_prob = model.predict_proba(X_test)[:, 1]

# Choose threshold
threshold = 0.30

# Convert probabilities into predictions
y_pred = (y_prob >= threshold).astype(int)


# ===========================
# Evaluation
# ===========================

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

print("\n")
print("=" * 60)
print(" BINARY XGBOOST MODEL RESULTS ")
print("=" * 60)

print(f"\nAccuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC AUC   : {roc_auc:.4f}")

print("\nClassification Report\n")
print(classification_report(y_test, y_pred))

print("Confusion Matrix\n")
print(confusion_matrix(y_test, y_pred))

print("\nModel Training Completed Successfully!")

# ===========================
# Feature Importance
# ===========================

importance = pd.DataFrame({
    "Feature": selected_features,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print("\nFeature Importance\n")
print(importance)

plt.figure(figsize=(12,6))

plt.bar(
    importance["Feature"],
    importance["Importance"]
)

plt.xticks(rotation=90)

plt.xlabel("Features")

plt.ylabel("Importance")

plt.title("Binary XGBoost Feature Importance")

plt.tight_layout()

plt.show()

# ===========================
# Save Model
# ===========================

joblib.dump(model, "xgboost_model.pkl")

joblib.dump(label_encoders, "label_encoders.pkl")

joblib.dump(selected_features, "selected_features.pkl")

print("\nFiles Saved Successfully!")

print("✔ xgboost_model.pkl")
print("✔ label_encoders.pkl")
print("✔ selected_features.pkl")