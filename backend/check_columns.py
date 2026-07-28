import pandas as pd

df = pd.read_csv("dataset/train_data.csv")

print(df.iloc[0].to_dict())