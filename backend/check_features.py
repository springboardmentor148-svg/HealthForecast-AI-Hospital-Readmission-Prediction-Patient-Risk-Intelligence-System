import joblib

model = joblib.load("../models/hospital_readmission_xgboost.pkl")
encoder = joblib.load("../models/ordinal_encoder.pkl")
feature_columns = joblib.load("../models/feature_columns.pkl")
model_info = joblib.load("../models/model_info.pkl")

print("Model Type:")
print(type(model))

print("\nEncoder Type:")
print(type(encoder))

print("\nFeature Columns:")
print(type(feature_columns))
print(feature_columns)

print("\nModel Info:")
print(type(model_info))
print(model_info)