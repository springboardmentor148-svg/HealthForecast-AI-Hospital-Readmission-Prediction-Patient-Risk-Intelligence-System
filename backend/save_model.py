# ==========================================
# SAVE MODEL FOR THE API
# Run this as the LAST cell in your training notebook,
# after `model` (tuned XGBoost) and `X_encoded` already exist.
# ==========================================

import joblib
import json

# 1. Save the trained model itself
joblib.dump(model, "readmission_model.joblib")

# 2. Save the exact column order the model was trained on.
#    This matters because pd.get_dummies() column order depends on
#    what categories happened to appear in your training data —
#    the API must rebuild rows with this exact same column order,
#    or the model will silently misread which feature is which.
feature_columns = list(X_encoded.columns)
with open("feature_columns.json", "w") as f:
    json.dump(feature_columns, f)

# 3. Save the raw category options for each categorical field,
#    so the API knows what values it's allowed to one-hot encode.
#    Adjust this list if your categorical_features list differs.
categorical_features = [
    'age_grouped', 'race', 'med_specialty_grouped',
    'primary_diagnosis', 'secondary_diagnosis', 'tertiary_diagnosis',
    'hba1c_grouped', 'discharge_grouped', 'admission_grouped'
]
category_options = {
    col: sorted(df[col].dropna().unique().tolist())
    for col in categorical_features
}
with open("category_options.json", "w") as f:
    json.dump(category_options, f)

print("Saved: readmission_model.joblib, feature_columns.json, category_options.json")
print(f"Model expects {len(feature_columns)} encoded columns.")
