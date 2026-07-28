import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)
import joblib

# ==========================================
# LOAD TRAIN & TEST DATASET
# ==========================================
print("========== LOADING TRAIN AND TEST DATA ==========")

train_data = pd.read_csv("dataset/train_data.csv")
test_data = pd.read_csv("dataset/test_data.csv")

print("Training Dataset Shape :", train_data.shape)
print("Testing Dataset Shape  :", test_data.shape)

# ==========================================
# FEATURES AND TARGET
# ==========================================
print("\n========== FEATURES AND TARGET ==========")

X_train = train_data.drop("readmitted", axis=1)
y_train = train_data["readmitted"]

X_test = test_data.drop("readmitted", axis=1)
y_test = test_data["readmitted"]

print("Training Features :", X_train.shape)
print("Training Labels   :", y_train.shape)
print("Testing Features  :", X_test.shape)
print("Testing Labels    :", y_test.shape)

# ==========================================
# CREATE XGBOOST MODEL
# ==========================================
print("\n========== CREATING XGBOOST MODEL ==========")

model = XGBClassifier(
    objective="binary:logistic",

    n_estimators=200,
    learning_rate=0.1,
    max_depth=6,

    subsample=0.8,
    colsample_bytree=0.8,

    random_state=42,
    eval_metric="logloss",
    tree_method="hist"
)

print("Model Created Successfully!")

# ==========================================
# TRAIN MODEL
# ==========================================
print("\n========== TRAINING MODEL ==========")

model.fit(X_train, y_train)

print("Model Training Completed Successfully!")

# ==========================================
# MAKE PREDICTIONS
# ==========================================
print("\n========== MAKING PREDICTIONS ==========")

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("Prediction Completed Successfully!")

# ==========================================
# MODEL ACCURACY
# ==========================================
print("\n========== MODEL ACCURACY ==========")

accuracy = accuracy_score(y_test, y_pred)

print(f"Accuracy : {accuracy * 100:.2f}%")

print("\n========== OTHER METRICS ==========")

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

print(f"Precision : {precision * 100:.2f}%")
print(f"Recall    : {recall * 100:.2f}%")
print(f"F1-Score  : {f1 * 100:.2f}%")
print(f"ROC-AUC   : {roc_auc * 100:.2f}%")

# ==========================================
# CONFUSION MATRIX
# ==========================================
print("\n========== CONFUSION MATRIX ==========")

cm = confusion_matrix(y_test, y_pred)

print(cm)

# ==========================================
# CLASSIFICATION REPORT
# ==========================================
print("\n========== CLASSIFICATION REPORT ==========")

print(classification_report(y_test, y_pred))

# ==========================================
# PREDICTION DISTRIBUTION
# ==========================================
print("\n========== PREDICTION DISTRIBUTION ==========")

print(pd.Series(y_pred).value_counts())

# ==========================================
# FEATURE IMPORTANCE
# ==========================================
print("\n========== FEATURE IMPORTANCE ==========")

importance = pd.DataFrame({
    "Feature": X_train.columns,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(by="Importance", ascending=False)

print(importance)

# ==========================================
# SAVE TRAINED MODEL
# ==========================================
joblib.dump(model, "dataset/xgboost_model.pkl")

print("\nModel Saved Successfully!")
print("File Name : dataset/xgboost_model.pkl")

importance.to_csv("dataset/feature_importance.csv", index=False)
print("Feature Importance Saved Successfully!")