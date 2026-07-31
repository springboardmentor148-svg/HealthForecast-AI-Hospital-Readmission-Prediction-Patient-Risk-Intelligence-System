import pandas as pd

from feature_loader import feature_names


def preprocess_data(patient):

    # Convert Pydantic object into dictionary
    patient = patient.model_dump()

    # Create dataframe having exactly the same columns
    # used while training the model
    input_df = pd.DataFrame(
        columns=feature_names,
        data=[[0] * len(feature_names)]
    )

    # ------------------------------------------------
    # Numerical Features
    # ------------------------------------------------

    numerical_columns = [

        "age",

        "admission_type_id",

        "discharge_disposition_id",

        "admission_source_id",

        "time_in_hospital",

        "num_lab_procedures",

        "num_procedures",

        "num_medications",

        "number_outpatient",

        "number_emergency",

        "number_inpatient",

        "number_diagnoses",

        "max_glu_serum",

        "A1Cresult",

        "change",

        "diabetesMed"

    ]

    for col in numerical_columns:

        if col in input_df.columns:

            input_df.loc[0, col] = patient[col]

    # ------------------------------------------------
    # Engineered Features
    # ------------------------------------------------

    if "total_visits" in input_df.columns:

        input_df.loc[0, "total_visits"] = (

            patient["number_outpatient"]

            + patient["number_emergency"]

            + patient["number_inpatient"]

        )

    if "high_medication" in input_df.columns:

        input_df.loc[0, "high_medication"] = (

            1 if patient["num_medications"] >= 20 else 0

        )

    if "total_procedures" in input_df.columns:

        input_df.loc[0, "total_procedures"] = (

            patient["num_lab_procedures"]

            + patient["num_procedures"]

        )

    # ------------------------------------------------
    # Gender
    # ------------------------------------------------

    gender_col = f"gender_{patient['gender']}"

    if gender_col in input_df.columns:

        input_df.loc[0, gender_col] = 1

    # ------------------------------------------------
    # Race
    # ------------------------------------------------

    race_col = f"race_{patient['race']}"

    if race_col in input_df.columns:

        input_df.loc[0, race_col] = 1

    # ------------------------------------------------
    # Medical Specialty
    # ------------------------------------------------

    specialty_col = f"medical_specialty_{patient['medical_specialty']}"

    if specialty_col in input_df.columns:

        input_df.loc[0, specialty_col] = 1

    # ------------------------------------------------
    # Diagnosis Categories
    # ------------------------------------------------

    for i in [1, 2, 3]:

        col = f"diag_{i}_cat_{patient[f'diag_{i}_cat']}"

        if col in input_df.columns:

            input_df.loc[0, col] = 1

    # ------------------------------------------------
    # Medication Encoding
    # ------------------------------------------------

    medications = [

        "metformin",

        "repaglinide",

        "nateglinide",

        "chlorpropamide",

        "glimepiride",

        "acetohexamide",

        "glipizide",

        "glyburide",

        "tolbutamide",

        "pioglitazone",

        "rosiglitazone",

        "acarbose",

        "miglitol",

        "troglitazone",

        "tolazamide",

        "insulin",

        "glyburide_metformin",

        "glipizide_metformin",

        "glimepiride_pioglitazone",

        "metformin_rosiglitazone",

        "metformin_pioglitazone"

    ]

    for med in medications:

        value = patient[med]

        column = med.replace("_", "-") + "_" + value

        if column in input_df.columns:

            input_df.loc[0, column] = 1

    return input_df