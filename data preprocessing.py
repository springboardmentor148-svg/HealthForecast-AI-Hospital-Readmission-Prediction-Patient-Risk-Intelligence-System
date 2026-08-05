import pandas as pd
import numpy as np

df = pd.read_csv(r"C:\Users\LAKSHYA GUPTA\Documents\AI Hospital Readmission\dataset\diabetic_data.csv")
df = df.drop(['weight', 'payer_code'], axis=1)

df['medical_specialty'] = df['medical_specialty'].replace('?', 'Missing')
df['race'] = df['race'].replace('?', 'Missing')

df = df.sort_values('encounter_id')
df = df.drop_duplicates(subset=['patient_nbr'], keep='first')

dead_or_hospice_codes = [11, 13, 14, 19, 20, 21]
df = df[~df['discharge_disposition_id'].isin(dead_or_hospice_codes)]

# Target
df['readmitted_binary'] = df['readmitted'].apply(lambda x: 1 if x == '<30' else 0)

# Age
def group_age(age):
    if age in ['[0-10)', '[10-20)', '[20-30)']:
        return '<30'
    elif age in ['[30-40)', '[40-50)']:
        return '[30,50)'
    elif age in ['[50-60)', '[60-70)']:
        return '[50,70)'
    else:
        return '[70,100)'
df['age_grouped'] = df['age'].apply(group_age)

#Diagnosis mapping
def map_diagnosis(icd9_code):
    if '?' in str(icd9_code) or 'V' in str(icd9_code) or 'E' in str(icd9_code):
        return 'Other'
    try:
        code = float(icd9_code)
    except ValueError:
        return 'Other'
    if 390 <= code <= 459 or code == 785:
        return 'Circulatory'
    elif 460 <= code <= 519 or code == 786:
        return 'Respiratory'
    elif 520 <= code <= 579 or code == 787:
        return 'Digestive'
    elif np.floor(code) == 250:
        return 'Diabetes'
    elif 800 <= code <= 999:
        return 'Injury'
    elif 710 <= code <= 739:
        return 'Musculoskeletal'
    elif 580 <= code <= 629 or code == 788:
        return 'Genitourinary'
    elif 140 <= code <= 239:
        return 'Neoplasms'
    else:
        return 'Other'

df['primary_diagnosis'] = df['diag_1'].apply(map_diagnosis)
df['secondary_diagnosis'] = df['diag_2'].apply(map_diagnosis)
df['tertiary_diagnosis'] = df['diag_3'].apply(map_diagnosis)

top_specialties = df['medical_specialty'].value_counts().nlargest(8).index.tolist()
df['med_specialty_grouped'] = df['medical_specialty'].apply(
    lambda x: x if x in top_specialties else 'Other'
)

# HbA1c
def map_hba1c(row):
    result = row['A1Cresult']
    med_change = row['change']
    if result == 'None':
        return 'Not measured'
    elif result == 'Norm':
        return 'Normal'
    elif result in ['>7', '>8'] and med_change == 'Ch':
        return 'High, changed'
    elif result in ['>7', '>8'] and med_change == 'No':
        return 'High, not changed'
    return 'Not measured'
df['hba1c_grouped'] = df.apply(map_hba1c, axis=1)

#Discharge disposition
def map_discharge(disp_id):
    if disp_id == 1:
        return 'Home'
    elif disp_id in [6, 8]:
        return 'Home_with_care'
    elif disp_id in [3, 4, 5, 22, 23, 24, 27, 28, 29, 30]:
        return 'Transferred_facility'
    else:
        return 'Other'
df['discharge_grouped'] = df['discharge_disposition_id'].apply(map_discharge)

# Admission source: finer groups
def map_admission(source_id):
    if source_id == 7:
        return 'Emergency'
    elif source_id in [1, 2, 3]:
        return 'Referral'
    elif source_id in [4, 5, 6, 10, 18, 22, 25, 26]:
        return 'Transfer'
    else:
        return 'Other'
df['admission_grouped'] = df['admission_source_id'].apply(map_admission)

#Medication / utilization flags
df['insulin_flag'] = df['insulin'].apply(lambda x: 0 if x == 'No' else 1)
df['diabetesMed_flag'] = df['diabetesMed'].map({'Yes': 1, 'No': 0})
df['change_flag'] = df['change'].map({'Ch': 1, 'No': 0})

categorical_features = [
    'age_grouped', 'race', 'med_specialty_grouped',
    'primary_diagnosis', 'secondary_diagnosis', 'tertiary_diagnosis',
    'hba1c_grouped', 'discharge_grouped', 'admission_grouped'
]

numeric_features = [
    'time_in_hospital', 'num_lab_procedures', 'num_procedures',
    'num_medications', 'number_outpatient', 'number_emergency',
    'number_inpatient', 'number_diagnoses',
    'insulin_flag', 'diabetesMed_flag', 'change_flag'
]

X = df[categorical_features + numeric_features]
y = df['readmitted_binary']

X_encoded = pd.get_dummies(X, columns=categorical_features, drop_first=True)
X_encoded.columns = X_encoded.columns.str.replace(r'[\[\]<,]', '_', regex=True)
