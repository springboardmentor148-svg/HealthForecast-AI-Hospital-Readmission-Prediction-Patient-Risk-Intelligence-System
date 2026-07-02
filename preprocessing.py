import pandas as pd

# ==========================
# Load Dataset
# ==========================
df = pd.read_csv("data/archive (2)/diabetic_data.csv")

# ==========================
# Display Basic Information
# ==========================
print("First 5 Rows:")
print(df.head())

print("\nDataset Shape:")
print(df.shape)

print("\nColumn Names:")
print(df.columns)

print("\nDataset Information:")
print(df.info())

# ==========================
# Replace '?' with NaN
# ==========================
df.replace("?", pd.NA, inplace=True)

# ==========================
# Check Missing Values
# ==========================
print("\nMissing Values:")
print(df.isnull().sum())

# ==========================
# Remove Duplicate Records
# ==========================
df.drop_duplicates(inplace=True)

# ==========================
# Fill Missing Numerical Values
# ==========================
numeric_columns = df.select_dtypes(include=['int64', 'float64']).columns

for col in numeric_columns:
    df[col] = df[col].fillna(df[col].median())

# ==========================
# Fill Missing Categorical Values
# ==========================
categorical_columns = df.select_dtypes(include=['object']).columns

for col in categorical_columns:
    df[col] = df[col].fillna(df[col].mode()[0])

# ==========================
# Verify Missing Values
# ==========================
print("\nMissing Values After Preprocessing:")
print(df.isnull().sum())

# ==========================
# Save Cleaned Dataset
# ==========================
df.to_csv("cleaned_diabetic_data.csv", index=False)

print("\nPreprocessing completed successfully!")
print("Cleaned dataset saved as: cleaned_diabetic_data.csv")

# ==========================
# Final Dataset Information
# ==========================
print("\nFinal Dataset Shape:")
print(df.shape)

print("\nFinal Dataset Information:")
print(df.info())