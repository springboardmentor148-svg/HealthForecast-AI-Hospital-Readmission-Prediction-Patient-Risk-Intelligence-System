from preprocess import load_and_preprocess_data
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import (
    OneHotEncoder,
    OrdinalEncoder,
    StandardScaler
)
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# ===========================
# Load and Preprocess Dataset
# ===========================
df = load_and_preprocess_data()

# ===========================
# Separate Features & Target
# ===========================
X = df.drop("readmitted", axis=1)
y = df["readmitted"]

# ===========================
# Train-Test Split
# ===========================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ===========================
# Column Groups
# ===========================

one_hot_columns = [
    "race",
    "gender"
]

ordinal_columns = [
    "age",
    "diag_1",
    "diag_2",
    "diag_3",
    "metformin",
    "repaglinide",
    "nateglinide",
    "chlorpropamide",
    "glimepiride",
    "acetohexamide",
    "glipizide",
    "glyburide",
    "tolbutamide",
    "pioglitazone",
    "rosiglitazone",
    "acarbose",
    "miglitol",
    "troglitazone",
    "tolazamide",
    "examide",
    "citoglipton",
    "insulin",
    "glyburide-metformin",
    "glipizide-metformin",
    "glimepiride-pioglitazone",
    "metformin-rosiglitazone",
    "metformin-pioglitazone",
    "change",
    "diabetesMed"
]

numeric_columns = X_train.select_dtypes(
    include=["int64", "float64"]
).columns.tolist()

# ===========================
# Preprocessing
# ===========================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "onehot",
            OneHotEncoder(handle_unknown="ignore"),
            one_hot_columns
        ),

        (
            "ordinal",
            OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1
            ),
            ordinal_columns
        ),

        (
            "numeric",
            StandardScaler(),
            numeric_columns
        )
    ]
)

# ===========================
# Pipeline
# ===========================

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
    max_iter=5000,
    class_weight="balanced"
))
])

# ===========================
# Train
# ===========================

pipeline.fit(X_train, y_train)

# ===========================
# Predict
# ===========================

y_pred = pipeline.predict(X_test)

# ===========================
# Evaluation
# ===========================

print("Accuracy")
print(accuracy_score(y_test, y_pred))

print("\nClassification Report")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix")
print(confusion_matrix(y_test, y_pred))


os.makedirs("models", exist_ok=True)

joblib.dump(pipeline, "models/readmission_model.pkl")

print("Model saved successfully!")