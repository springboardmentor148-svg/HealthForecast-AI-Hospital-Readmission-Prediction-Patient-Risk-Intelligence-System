import pandas as pd


df = pd.read_csv("dataset/diabetic_data.csv")

print("Original Shape:", df.shape)


df.drop_duplicates(inplace=True)


df.replace('?', pd.NA, inplace=True)


print("\nMissing Values Before:")
print(df.isnull().sum())
for column in df.columns:
    if df[column].dtype == 'object':
        mode = df[column].mode()
        if not mode.empty:
            df[column] = df[column].fillna(mode[0])
    else:
        df[column] = df[column].fillna(df[column].median())

print("\nMissing Values After:")
print(df.isnull().sum())

df.to_csv("dataset/cleaned_diabetic_data.csv", index=False)

print("\nPreprocessing Completed Successfully!")
print("Cleaned dataset saved as dataset/cleaned_diabetic_data.csv")