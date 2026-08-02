import pandas as pd
import numpy as np

def load_and_preprocess_data():
    df = pd.read_csv("dataset/diabetic_data.csv")

    df.replace("?", np.nan, inplace=True)

    df.drop(columns=[
        "weight",
        "max_glu_serum",
        "A1Cresult",
        "medical_specialty",
        "payer_code",
        "encounter_id",
        "patient_nbr"
    ], inplace=True)

    df["readmitted"] = df["readmitted"].map({
        "<30": 1,
        ">30": 0,
        "NO": 0
    })

    df = df.dropna(subset=["race", "diag_1", "diag_2", "diag_3"])

    return df


if __name__ == "__main__":
    df = load_and_preprocess_data()
    print("Dataset cleaned successfully!")
    print(df.shape)