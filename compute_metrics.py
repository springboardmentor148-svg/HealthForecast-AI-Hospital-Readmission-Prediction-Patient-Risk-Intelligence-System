import json
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# ==========================================
# Existing trained model + test data load karo (dobara train nahi karna)
# ==========================================
print("========== LOADING EXISTING MODEL AND TEST DATA ==========")

model = joblib.load("dataset/xgboost_model.pkl")
test_data = pd.read_csv("dataset/test_data.csv")

X_test = test_data.drop("readmitted", axis=1)
y_test = test_data["readmitted"]

# ==========================================
# Predictions banao aur real metrics calculate karo
# ==========================================
print("========== CALCULATING REAL METRICS ==========")

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

metrics = {
    "accuracy": round(accuracy * 100, 2),
    "precision": round(precision * 100, 2),
    "recall": round(recall * 100, 2),
    "f1Score": round(f1 * 100, 2),
    "rocAuc": round(roc_auc * 100, 2),
    "testSamples": len(y_test),
}

print(f"Accuracy  : {metrics['accuracy']}%")
print(f"Precision : {metrics['precision']}%")
print(f"Recall    : {metrics['recall']}%")
print(f"F1-Score  : {metrics['f1Score']}%")
print(f"ROC-AUC   : {metrics['rocAuc']}%")

# ==========================================
# JSON file me save karo — backend yahi se real accuracy padhega
# ==========================================
with open("dataset/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("\nMetrics saved successfully!")
print("File Name : dataset/model_metrics.json")