import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# -----------------------------
# Load Dataset
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "dataset", "cleaned_diabetic_data.csv")

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(df.columns.tolist())
print(df.shape)

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

# -----------------------------
# Target Column
# -----------------------------
target = "readmitted"

if target not in df.columns:
    print(f"Error: '{target}' column not found!")
    print("Available Columns:")
    print(df.columns.tolist())
    exit()

# -----------------------------
# Features & Target
# -----------------------------
X = df.drop(columns=[target])
y = df[target]

# Convert categorical columns
X = pd.get_dummies(X)

print("Feature Shape:", X.shape)

# -----------------------------
# Train/Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training Started...")

# -----------------------------
# Random Forest Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=10,      # Reduced for faster training
    max_depth=10,         # Reduced depth
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("Training Completed!")

# -----------------------------
# Prediction
# -----------------------------
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print(f"Model Accuracy: {accuracy:.4f}")

# -----------------------------
# Save Model
# -----------------------------
MODEL_PATH = os.path.join(BASE_DIR, "readmission_model.pkl")

joblib.dump(model, MODEL_PATH)

print("Model Saved Successfully!")
print("Saved Location:", MODEL_PATH)