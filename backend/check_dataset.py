import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "dataset", "cleaned_diabetic_data.csv")

df = pd.read_csv(DATA_PATH)

print(df.columns.tolist())
print(df.shape)