"""
ML Model Training Script for HealthForecast AI
Trains XGBoost model on Diabetes 130-US Hospitals dataset
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, 
    f1_score, roc_auc_score, classification_report
)
import warnings
warnings.filterwarnings('ignore')
import os

class ModelTrainer:
    def __init__(self):
        self.df = None
        self.X = None
        self.y = None
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.results = {}
        self.label_encoders = {}
        
    def load_data(self):
        """Load and preprocess the dataset"""
        print("\n" + "="*60)
        print("📂 LOADING DATASET")
        print("="*60)
        
        try:
            from ucimlrepo import fetch_ucirepo
            print("📥 Downloading Diabetes 130-US Hospitals dataset from UCI...")
            diabetes_data = fetch_ucirepo(id=296)
            self.df = pd.concat([diabetes_data.data.features, diabetes_data.data.targets], axis=1)
            
            os.makedirs('data/raw', exist_ok=True)
            self.df.to_csv('data/raw/diabetic_data.csv', index=False)
            
        except Exception as e:
            print(f"⚠️ UCI download failed: {e}")
            if os.path.exists('data/raw/diabetic_data.csv'):
                self.df = pd.read_csv('data/raw/diabetic_data.csv')
            else:
                raise FileNotFoundError("Dataset not found.")
        
        print(f"✅ Dataset loaded: {self.df.shape[0]:,} rows, {self.df.shape[1]} columns")
        return self.df
    
    def preprocess_data(self):
        """Preprocess the dataset"""
        print("\n" + "="*60)
        print("🔧 PREPROCESSING DATA")
        print("="*60)
        
        df = self.df.copy()
        
        # Replace '?' with NaN
        df.replace('?', np.nan, inplace=True)
        
        # Drop columns with >50% missing
        missing_percent = df.isnull().mean()
        cols_to_drop = missing_percent[missing_percent > 0.5].index.tolist()
        
        if len(cols_to_drop) > 0:
            df = df.drop(columns=cols_to_drop)
            print(f"✅ Dropped columns with >50% missing: {cols_to_drop}")
        else:
            print("✅ No columns with >50% missing")
        
        # Remove invalid discharge dispositions
        invalid_discharge = [11, 13, 14, 19, 20, 21]
        df = df[~df['discharge_disposition_id'].isin(invalid_discharge)]
        print(f"✅ Removed invalid discharge records: {df.shape[0]:,} rows")
        
        # Fill missing values
        if 'medical_specialty' in df.columns:
            df['medical_specialty'] = df['medical_specialty'].fillna('Missing')
        
        df.dropna(subset=['race', 'gender'], inplace=True)
        print(f"✅ Dropped rows with missing race/gender: {df.shape[0]:,} rows")
        
        # Feature Engineering
        # 1. Total prior visits
        df['total_prior_visits'] = (df['number_outpatient'] + 
                                    df['number_emergency'] + 
                                    df['number_inpatient'])
        
        # 2. Medication count
        med_cols = ['metformin', 'repaglinide', 'nateglinide', 'chlorpropamide',
                    'glimepiride', 'glipizide', 'glyburide', 'pioglitazone',
                    'rosiglitazone', 'acarbose', 'miglitol', 'tolazamide',
                    'insulin', 'glyburide-metformin', 'glipizide-metformin',
                    'glimepiride-pioglitazone', 'metformin-rosiglitazone',
                    'metformin-pioglitazone']
        
        existing_meds = [col for col in med_cols if col in df.columns]
        df['medication_count'] = df[existing_meds].apply(
            lambda x: sum(1 for val in x if val != 'No'), axis=1
        )
        
        # 3. Changed medications
        df['changed_medication'] = df[existing_meds].apply(
            lambda x: sum(1 for val in x if val == 'Change'), axis=1
        )
        
        # 4. Stay length category - FIX: Convert to numeric immediately
        df['stay_length_category'] = pd.cut(
            df['time_in_hospital'],
            bins=[0, 3, 7, 14, 30],
            labels=[0, 1, 2, 3]  # Numeric labels instead of strings
        )
        
        print("✅ Created new features: total_prior_visits, medication_count, changed_medication, stay_length_category")
        
        # Identify all categorical columns
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        # Remove target from categorical list
        if 'readmitted' in categorical_cols:
            categorical_cols.remove('readmitted')
        
        # Encode all categorical variables
        print(f"🔍 Encoding {len(categorical_cols)} categorical columns...")
        for col in categorical_cols:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
                print(f"   ✅ Encoded: {col}")
        
        # Create target variable (readmitted within 30 days)
        df['readmitted_binary'] = (df['readmitted'] == '<30').astype(int)
        
        # Drop unnecessary columns
        cols_to_drop = ['readmitted', 'encounter_id', 'patient_nbr']
        existing_cols_to_drop = [col for col in cols_to_drop if col in df.columns]
        df = df.drop(columns=existing_cols_to_drop)
        
        # Separate features and target
        self.y = df['readmitted_binary']
        self.X = df.drop('readmitted_binary', axis=1)
        
        # Fill any remaining missing values
        self.X = self.X.fillna(0)
        
        # Ensure all columns are numeric
        for col in self.X.columns:
            if self.X[col].dtype == 'object':
                self.X[col] = self.X[col].astype(str).astype('category').cat.codes
        
        print(f"✅ Preprocessed: X={self.X.shape[0]:,} rows, {self.X.shape[1]} features")
        print(f"✅ Target distribution:\n{self.y.value_counts()}")
        print(f"✅ All columns are now numeric: {self.X.dtypes.unique()}")
        return self.X, self.y
    
    def train_models(self):
        """Train and evaluate multiple models"""
        print("\n" + "="*60)
        print("🚀 TRAINING MODELS")
        print("="*60)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42, stratify=self.y
        )
        print(f"✅ Train: {X_train.shape[0]:,} rows, Test: {X_test.shape[0]:,} rows")
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Save feature names
        self.feature_names = self.X.columns.tolist()
        
        # Models to train
        models = {
            'Random Forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced',
                n_jobs=-1
            ),
            'XGBoost': XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                scale_pos_weight=1.5,
                use_label_encoder=False,
                eval_metric='logloss'
            )
        }
        
        best_model = None
        best_f1 = 0
        best_name = ""
        
        for name, model in models.items():
            print(f"\n📊 Training {name}...")
            model.fit(X_train_scaled, y_train)
            
            # Predictions
            y_pred = model.predict(X_test_scaled)
            y_proba = model.predict_proba(X_test_scaled)[:, 1]
            
            # Metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, y_proba)
            
            self.results[name] = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'roc_auc': roc_auc,
                'model': model
            }
            
            print(f"   ✅ Accuracy:  {accuracy:.4f}")
            print(f"   ✅ Precision: {precision:.4f}")
            print(f"   ✅ Recall:    {recall:.4f}")
            print(f"   ✅ F1 Score:  {f1:.4f}")
            print(f"   ✅ ROC-AUC:   {roc_auc:.4f}")
            
            if f1 > best_f1:
                best_f1 = f1
                best_model = model
                best_name = name
        
        self.model = best_model
        
        print(f"\n🏆 BEST MODEL: {best_name}")
        print(f"   F1 Score: {best_f1:.4f}")
        print(f"   ROC-AUC:  {self.results[best_name]['roc_auc']:.4f}")
        
        return self.model
    
    def save_models(self):
        """Save the trained models"""
        print("\n" + "="*60)
        print("💾 SAVING MODELS")
        print("="*60)
        
        os.makedirs('models', exist_ok=True)
        
        joblib.dump(self.model, 'models/risk_predictor.pkl')
        print("✅ Model saved to 'models/risk_predictor.pkl'")
        
        joblib.dump(self.scaler, 'models/scaler.pkl')
        print("✅ Scaler saved to 'models/scaler.pkl'")
        
        joblib.dump(self.feature_names, 'models/feature_names.pkl')
        print("✅ Feature names saved to 'models/feature_names.pkl'")
        
        # Save label encoders
        joblib.dump(self.label_encoders, 'models/label_encoders.pkl')
        print("✅ Label encoders saved to 'models/label_encoders.pkl'")
        
        results_df = pd.DataFrame(self.results).T
        results_df.to_csv('models/model_results.csv')
        print("✅ Results saved to 'models/model_results.csv'")
        
        print("\n📋 Classification Report:")
        X_train, X_test, y_train, y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42, stratify=self.y
        )
        y_pred = self.model.predict(self.scaler.transform(X_test))
        print(classification_report(y_test, y_pred))
    
    def train(self):
        """Run complete training pipeline"""
        print("="*60)
        print("🤖 ML MODEL TRAINING PIPELINE")
        print("="*60)
        
        self.load_data()
        self.preprocess_data()
        self.train_models()
        self.save_models()
        
        print("\n" + "="*60)
        print("✅ TRAINING COMPLETE!")
        print("="*60)
        print("\n📊 Results Summary:")
        for name, metrics in self.results.items():
            print(f"\n{name}:")
            print(f"   Accuracy: {metrics['accuracy']:.4f}")
            print(f"   F1 Score: {metrics['f1']:.4f}")
            print(f"   ROC-AUC:  {metrics['roc_auc']:.4f}")
        
        return self.model

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.train()