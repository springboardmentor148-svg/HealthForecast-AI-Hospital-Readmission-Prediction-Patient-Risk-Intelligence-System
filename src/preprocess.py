import pandas as pd
import numpy as np
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class DataPreprocessor:
    """Complete data preprocessing pipeline"""
    
    def __init__(self):
        self.df = None
        self.X = None
        self.y = None
        self.original_shape = None
        
    def load_data(self):
        """Load the dataset"""
        print("\n" + "="*60)
        print("📂 LOADING DATA")
        print("="*60)
        
        self.df = pd.read_csv('data/raw/diabetic_data.csv')
        self.original_shape = self.df.shape
        print(f"✅ Loaded {self.df.shape[0]:,} rows and {self.df.shape[1]} columns")
        return self.df
    
    def explore_data(self):
        """Print basic information about the dataset"""
        print("\n" + "="*60)
        print("📊 DATA EXPLORATION")
        print("="*60)
        
        print(f"\n📋 Shape: {self.df.shape}")
        
        # Missing values
        missing = self.df.isnull().sum()
        print(f"\n📋 Missing Values:\n{missing[missing > 0]}")
        
        # Readmission distribution
        print("\n📋 Readmission Distribution:")
        print(self.df['readmitted'].value_counts())
        
        # Create binary target
        self.df['readmitted_binary'] = (self.df['readmitted'] == '<30').astype(int)
        
        print("\n📋 Binary Target Distribution:")
        print(self.df['readmitted_binary'].value_counts())
        print(f"   - Readmitted within 30 days: {self.df['readmitted_binary'].sum():,}")
        print(f"   - Not readmitted: {len(self.df) - self.df['readmitted_binary'].sum():,}")
        
    def clean_data(self):
        """Clean the data following research paper guidelines"""
        print("\n" + "="*60)
        print("🧹 CLEANING DATA")
        print("="*60)
        
        df_clean = self.df.copy()
        
        # Replace '?' with NaN
        df_clean.replace('?', np.nan, inplace=True)
        
        # Drop columns with >50% missing values (except important ones)
        missing_percent = df_clean.isnull().mean()
        cols_to_drop = missing_percent[missing_percent > 0.5].index
        
        # IMPORTANT: Keep max_glu_serum and A1Cresult for feature engineering
        keep_cols = ['max_glu_serum', 'A1Cresult']
        cols_to_drop = [col for col in cols_to_drop if col not in keep_cols]
        
        if len(cols_to_drop) > 0:
            df_clean = df_clean.drop(columns=cols_to_drop)
            print(f"✅ Dropped columns with >50% missing: {list(cols_to_drop)}")
        else:
            print("✅ No columns with >50% missing to drop")
        
        # Remove invalid discharge dispositions
        invalid_discharge = [11, 13, 14, 19, 20, 21]
        df_clean = df_clean[~df_clean['discharge_disposition_id'].isin(invalid_discharge)]
        print(f"✅ Removed invalid discharge records. New shape: {df_clean.shape}")
        
        # Fill missing 'medical_specialty'
        if 'medical_specialty' in df_clean.columns:
            df_clean['medical_specialty'] = df_clean['medical_specialty'].fillna('Missing')
            print("✅ Filled missing 'medical_specialty'")
        
        # Drop rows with missing race or gender
        df_clean.dropna(subset=['race', 'gender'], inplace=True)
        print(f"✅ Dropped rows with missing race/gender. New shape: {df_clean.shape}")
        
        # Fill missing values in max_glu_serum and A1Cresult with 'None'
        if 'max_glu_serum' in df_clean.columns:
            df_clean['max_glu_serum'] = df_clean['max_glu_serum'].fillna('None')
        if 'A1Cresult' in df_clean.columns:
            df_clean['A1Cresult'] = df_clean['A1Cresult'].fillna('None')
        
        self.df = df_clean
        return self.df
    
    def feature_engineering(self):
        """Create new features"""
        print("\n" + "="*60)
        print("🔧 FEATURE ENGINEERING")
        print("="*60)
        
        df_fe = self.df.copy()
        features_created = []
        
        # Check if columns exist before using them
        if 'max_glu_serum' in df_fe.columns:
            df_fe['glucose_tested'] = (df_fe['max_glu_serum'] != 'None').astype(int)
            features_created.append('glucose_tested')
        else:
            print("⚠️ 'max_glu_serum' not found, skipping glucose_tested")
        
        if 'A1Cresult' in df_fe.columns:
            df_fe['a1c_tested'] = (df_fe['A1Cresult'] != 'None').astype(int)
            features_created.append('a1c_tested')
        else:
            print("⚠️ 'A1Cresult' not found, skipping a1c_tested")
        
        # 1. Total prior visits
        df_fe['total_prior_visits'] = (df_fe['number_outpatient'] + 
                                       df_fe['number_emergency'] + 
                                       df_fe['number_inpatient'])
        features_created.append('total_prior_visits')
        
        # 2. Medication count
        med_cols = ['metformin', 'repaglinide', 'nateglinide', 'chlorpropamide',
                    'glimepiride', 'glipizide', 'glyburide', 'pioglitazone',
                    'rosiglitazone', 'acarbose', 'miglitol', 'tolazamide',
                    'insulin', 'glyburide-metformin', 'glipizide-metformin',
                    'glimepiride-pioglitazone', 'metformin-rosiglitazone',
                    'metformin-pioglitazone']
        
        existing_meds = [col for col in med_cols if col in df_fe.columns]
        df_fe['medication_count'] = df_fe[existing_meds].apply(
            lambda x: sum(1 for val in x if val != 'No'), axis=1
        )
        features_created.append('medication_count')
        
        # 3. Changed medications
        df_fe['changed_medication'] = df_fe[existing_meds].apply(
            lambda x: sum(1 for val in x if val == 'Change'), axis=1
        )
        features_created.append('changed_medication')
        
        # 4. Stay length category
        df_fe['stay_length_category'] = pd.cut(
            df_fe['time_in_hospital'],
            bins=[0, 3, 7, 14, 30],
            labels=['Short', 'Medium', 'Long', 'Extended']
        )
        features_created.append('stay_length_category')
        
        print(f"✅ Created {len(features_created)} new features:")
        for f in features_created:
            print(f"   - {f}")
        
        self.df = df_fe
        return self.df
    
    def encode_categorical(self):
        """Encode categorical variables"""
        print("\n" + "="*60)
        print("🔄 ENCODING CATEGORICAL VARIABLES")
        print("="*60)
        
        df_enc = self.df.copy()
        
        # Ordinal encoding for age
        age_order = ['[0-10)', '[10-20)', '[20-30)', '[30-40)', 
                     '[40-50)', '[50-60)', '[60-70)', '[70-80)', 
                     '[80-90)', '[90-100)']
        age_mapping = {age: i for i, age in enumerate(age_order)}
        if 'age' in df_enc.columns:
            df_enc['age'] = df_enc['age'].map(age_mapping)
            print("✅ Encoded 'age'")
        
        # Ordinal encoding for stay length
        stay_order = {'Short': 0, 'Medium': 1, 'Long': 2, 'Extended': 3}
        if 'stay_length_category' in df_enc.columns:
            df_enc['stay_length_category'] = df_enc['stay_length_category'].map(stay_order)
            print("✅ Encoded 'stay_length_category'")
        
        # One-hot encoding for nominal columns
        nominal_cols = ['race', 'gender', 'admission_type_id', 
                       'discharge_disposition_id', 'admission_source_id',
                       'medical_specialty', 'diag_1']
        
        existing_nominal = [col for col in nominal_cols if col in df_enc.columns]
        
        df_enc = pd.get_dummies(df_enc, columns=existing_nominal, drop_first=True)
        print(f"✅ One-hot encoded {len(existing_nominal)} columns")
        print(f"✅ New shape: {df_enc.shape}")
        
        self.df = df_enc
        return self.df
    
    def prepare_final_data(self):
        """Prepare final dataset for modeling"""
        print("\n" + "="*60)
        print("💾 PREPARING FINAL DATA")
        print("="*60)
        
        self.y = self.df['readmitted_binary']
        
        # Drop unnecessary columns
        cols_to_drop = ['readmitted', 'readmitted_binary', 'encounter_id', 'patient_nbr']
        existing_cols_to_drop = [col for col in cols_to_drop if col in self.df.columns]
        self.X = self.df.drop(columns=existing_cols_to_drop)
        
        # Fill any remaining missing values
        self.X = self.X.fillna(0)
        
        # Create processed directory
        os.makedirs('data/processed', exist_ok=True)
        
        # Save processed data
        joblib.dump(self.X, 'data/processed/X_processed.pkl')
        joblib.dump(self.y, 'data/processed/y_processed.pkl')
        
        print(f"✅ Final X shape: {self.X.shape}")
        print(f"✅ Final y shape: {self.y.shape}")
        print(f"\n✅ Data saved to 'data/processed/'")
        print(f"   - X_processed.pkl: {self.X.shape[1]} features")
        print(f"   - y_processed.pkl: {self.y.shape[0]:,} samples")
        
        return self.X, self.y
    
    def run_pipeline(self):
        """Run complete pipeline"""
        print("="*60)
        print("🚀 STARTING PREPROCESSING PIPELINE")
        print("="*60)
        
        self.load_data()
        self.explore_data()
        self.clean_data()
        self.feature_engineering()
        self.encode_categorical()
        X, y = self.prepare_final_data()
        
        print("\n" + "="*60)
        print("✅ PIPELINE COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"   - Original samples: {self.original_shape[0]:,}")
        print(f"   - Final samples: {X.shape[0]:,}")
        print(f"   - Features: {X.shape[1]}")
        print(f"   - Target classes: {y.nunique()}")
        
        return X, y

if __name__ == "__main__":
    preprocessor = DataPreprocessor()
    X, y = preprocessor.run_pipeline()