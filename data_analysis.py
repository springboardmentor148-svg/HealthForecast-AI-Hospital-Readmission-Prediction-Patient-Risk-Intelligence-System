import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


df = pd.read_csv("dataset/cleaned_diabetic_data.csv")

print("First 5 Rows")
print(df.head())

print("\nShape")
print(df.shape)

print("\nInformation")
print(df.info())

print("\nStatistics")
print(df.describe())

print("\nMissing Values")
print(df.isnull().sum())

print("\nDuplicate Rows")
print(df.duplicated().sum())

print("\nData Types")
print(df.dtypes)

print("\nUnique Values")
print(df.nunique())



numeric_columns = df.select_dtypes(include=['int64','float64']).columns


df[numeric_columns].hist(figsize=(12,10))
plt.suptitle("Numeric Feature Distributions")
plt.tight_layout()
plt.show()


plt.figure(figsize=(10,8))
sns.heatmap(df[numeric_columns].corr(), annot=True, cmap='coolwarm')
plt.title("Correlation Heatmap")
plt.show()

for column in numeric_columns:
    plt.figure(figsize=(6,4))
    sns.boxplot(x=df[column])
    plt.title(column)
    plt.show()



categorical_columns = df.select_dtypes(include=['object']).columns

for column in categorical_columns:
    if df[column].nunique() <= 10:
        plt.figure(figsize=(8,5))
        sns.countplot(x=column, data=df)
        plt.xticks(rotation=45)
        plt.title(column)
        plt.show()


if "readmitted" in df.columns:
    plt.figure(figsize=(6,4))
    sns.countplot(x='readmitted', data=df)
    plt.title("Readmitted Distribution")
    plt.show()

    print(df['readmitted'].value_counts())

print("\nData Analysis Completed Successfully!")