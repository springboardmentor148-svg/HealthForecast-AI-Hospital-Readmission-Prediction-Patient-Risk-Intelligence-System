import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE


# ===========================
# Load Dataset
# ===========================

df = pd.read_csv("dataset/cleaned_diabetic_data.csv")

# ===========================
# Drop Unnecessary Columns
# ===========================

columns_to_drop = ["encounter_id", "patient_nbr"]

for col in columns_to_drop:
    if col in df.columns:
        df.drop(col, axis=1, inplace=True)

# ===========================
# Encode Target Variable
# ===========================

target_encoder = LabelEncoder()

df["readmitted"] = target_encoder.fit_transform(df["readmitted"])

print("\nTarget Classes:")
print(target_encoder.classes_)

# ===========================
# Encode Categorical Features
# ===========================

label_encoders = {}

categorical_columns = df.select_dtypes(include="object").columns

for column in categorical_columns:
    encoder = LabelEncoder()
    df[column] = encoder.fit_transform(df[column].astype(str))
    label_encoders[column] = encoder

print("\nEncoding Completed Successfully!")

# ===========================
# Selected Features
# ===========================

selected_features = [
    "race",
    "gender",
    "age",
    "weight",
    "admission_type_id",
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_diagnoses",
    "A1Cresult",
    "insulin",
    "change",
    "diabetesMed"
]

# ===========================
# Split Features & Target
# ===========================

X = df[selected_features]
y = df["readmitted"]
smote = SMOTE(random_state=42)

X, y = smote.fit_resample(X, y)

print("\nSelected Features:")
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

# ===========================
# Random Forest + Hyperparameter Tuning
# ===========================

xgb = XGBClassifier(
    objective="multi:softprob",
    num_class=3,
    eval_metric="mlogloss",
    random_state=42
)

param_dist = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 5, 7, 10],
    "learning_rate": [0.01, 0.05, 0.1],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0]
}

random_search = RandomizedSearchCV(
estimator=xgb,
    param_distributions=param_dist,
    n_iter=20,
    cv=5,
    scoring="accuracy",
    random_state=42,
    n_jobs=-1,
    verbose=2
)

print("\nTraining Model... Please Wait...\n")

random_search.fit(X_train, y_train)

model = random_search.best_estimator_

print("\nBest Parameters Found:")
print(random_search.best_params_)

# ===========================
# Prediction
# ===========================

y_pred = model.predict(X_test)

# ===========================
# Evaluation
# ===========================

accuracy = accuracy_score(y_test, y_pred)

print("\n")
print("=" * 60)
print(" RANDOM FOREST MODEL RESULTS ")
print("=" * 60)

print(f"\nAccuracy : {accuracy:.4f}")

print("\nClassification Report\n")
print(classification_report(y_test, y_pred))

print("Confusion Matrix\n")
print(confusion_matrix(y_test, y_pred))

print("\nModel Training Completed Successfully!")

# ===========================
# Save Files
# ===========================

joblib.dump(model, "random_forest_model.pkl")
joblib.dump(label_encoders, "label_encoders.pkl")
joblib.dump(target_encoder, "label_encoder.pkl")
joblib.dump(selected_features, "selected_features.pkl")

print("\nFiles Saved Successfully!")

print("✔ random_forest_model.pkl")
print("✔ label_encoders.pkl")
print("✔ label_encoder.pkl")
print("✔ selected_features.pkl")