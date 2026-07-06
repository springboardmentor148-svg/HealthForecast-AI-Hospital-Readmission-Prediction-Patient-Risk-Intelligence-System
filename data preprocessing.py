import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

def main():
    data_path = 'diabetic_data.csv'
    
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Please download it from UCI and place it in the same directory.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)

    print("Cleaning data...")
    df = df.drop(['weight', 'payer_code'], axis=1)

    # Handle missing values encoded as '?'
    df['medical_specialty'] = df['medical_specialty'].replace('?', 'Missing')
    df['race'] = df['race'].replace('?', 'Missing')

    # Keep only the first encounter per patient
    df = df.sort_values('encounter_id')
    df = df.drop_duplicates(subset=['patient_nbr'], keep='first')

    dead_or_hospice_codes = [11, 13, 14, 19, 20, 21]
    df = df[~df['discharge_disposition_id'].isin(dead_or_hospice_codes)]

    # Binary target variable (1 = Readmitted <30 days, 0 = Otherwise)
    df['readmitted_binary'] = df['readmitted'].apply(lambda x: 1 if x == '<30' else 0)

    # Features(Grouping)
   
    print("Engineering features...")

    # A. Age Grouping
    def group_age(age):
        if age in ['[0-10)', '[10-20)', '[20-30)']: return '<30'
        elif age in ['[30-40)', '[40-50)', '[50-60)']: return '[30, 60)'
        else: return '[60, 100)'
    df['age_grouped'] = df['age'].apply(group_age)

    # B. Primary Diagnosis Grouping
    def map_diagnosis(icd9_code):
        if '?' in str(icd9_code) or 'V' in str(icd9_code) or 'E' in str(icd9_code): return 'Other'
        try: 
            code = float(icd9_code) 
        except ValueError: 
            return 'Other'
        
        if 390 <= code <= 459 or code == 785: return 'Circulatory'
        elif 460 <= code <= 519 or code == 786: return 'Respiratory'
        elif 520 <= code <= 579 or code == 787: return 'Digestive'
        elif np.floor(code) == 250: return 'Diabetes'
        elif 800 <= code <= 999: return 'Injury'
        elif 710 <= code <= 739: return 'Musculoskeletal'
        elif 580 <= code <= 629 or code == 788: return 'Genitourinary'
        elif 140 <= code <= 239: return 'Neoplasms'
        else: return 'Other'
    df['primary_diagnosis'] = df['diag_1'].apply(map_diagnosis)

    # C. Medical Specialty Grouping
    top_specialties = ['InternalMedicine', 'Cardiology', 'Surgery-General', 'Family/GeneralPractice', 'Missing']
    df['med_specialty_grouped'] = df['medical_specialty'].apply(lambda x: x if x in top_specialties else 'Other')

    # D. HbA1c & Medication Change Grouping
    def map_hba1c(row):
        result = row['A1Cresult']
        med_change = row['change']
        if result == 'None': return 'Not measured'
        elif result == 'Norm': return 'Normal'
        elif result in ['>7', '>8'] and med_change == 'Ch': return 'High, changed'
        elif result in ['>7', '>8'] and med_change == 'No': return 'High, not changed'
        return 'Not measured'
    df['hba1c_grouped'] = df.apply(map_hba1c, axis=1)

    # E. Discharge & Admission Grouping
    df['discharge_grouped'] = df['discharge_disposition_id'].apply(lambda x: 'Home' if x == 1 else 'Otherwise')

    def map_admission(source_id):
        if source_id == 7: return 'Emergency'
        elif source_id in [1, 2, 3]: return 'Referral'
        else: return 'Other'
    df['admission_grouped'] = df['admission_source_id'].apply(map_admission)


    # 4. Random Forest Model

    features = [
        'age_grouped', 'race', 'med_specialty_grouped', 
        'primary_diagnosis', 'time_in_hospital', 'hba1c_grouped',
        'discharge_grouped', 'admission_grouped'
    ]

    X = df[features]
    y = df['readmitted_binary']

    print("Encoding categories...")
    X_encoded = pd.get_dummies(X, drop_first=True)
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

   
    print("Training Random Forest Model... (This may take 5-15 seconds)")
    model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
    model.fit(X_train, y_train)

    # ==========================================
    # 6. EVALUATE & TUNE
    # ==========================================
    print("\n==========================================")
    print(" DEFAULT EVALUATION (Threshold = 0.50)")
    print("==========================================")
    y_pred_default = model.predict(X_test)
    print("Accuracy Score:", accuracy_score(y_test, y_pred_default))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred_default))

    print("\n==========================================")
    print(" TUNED EVALUATION (Threshold = 0.25)")
    print(" (Optimized to catch more high-risk patients)")
    print("==========================================")
    
    # Get raw probabilities for Class 1 (Readmitted)
    probabilities = model.predict_proba(X_test)[:, 1]
    
    # Apply custom lower threshold
    custom_threshold = 0.25
    y_pred_tuned = (probabilities >= custom_threshold).astype(int)
    
    print("Accuracy Score:", accuracy_score(y_test, y_pred_tuned))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred_tuned))

if __name__ == "__main__":
    main()