import pandas as pd
import numpy as np
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
import matplotlib.pyplot as plt
import seaborn as sns

# ============================================================
# Load Data
# ============================================================

def load_and_fix_data():
    """Load data and ensure all columns are numeric"""
    
    print("="*60)
    print(" LOADING DATA")
    print("="*60)
    
    X = joblib.load('data/processed/X_processed.pkl')
    y = joblib.load('data/processed/y_processed.pkl')
    
    print(f" X shape: {X.shape}")
    print(f" y shape: {y.shape}")
    
    # Check for non-numeric columns
    non_numeric_cols = X.select_dtypes(include=['object']).columns.tolist()
    
    if non_numeric_cols:
        print(f"\n Found {len(non_numeric_cols)} non-numeric columns:")
        for col in non_numeric_cols:
            try:
                X[col] = pd.to_numeric(X[col], errors='raise')
            except:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
        print(" All columns are now numeric!")
    else:
        print(" All columns are already numeric!")
    
    return X, y

# ============================================================
# Train Models
# ============================================================

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models and compare performance"""
    
    print("\n" + "="*60)
    print(" TRAINING MODELS")
    print("="*60)
    
    models = {
        'Logistic Regression': LogisticRegression(
            max_iter=1000, 
            random_state=42, 
            class_weight='balanced'
        ),
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
    
    results = {}
    best_model = None
    best_score = 0
    best_name = ""
    
    for name, model in models.items():
        print(f"\n{'='*50}")
        print(f" Training {name}...")
        print('='*50)
        
        try:
            # Train
            model.fit(X_train, y_train)
            
            # Predict
            y_pred = model.predict(X_test)
            y_proba = model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, y_proba)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
            
            # Store results
            results[name] = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'roc_auc': roc_auc,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'model': model,
                'y_pred': y_pred,
                'y_proba': y_proba
            }
            
            # Print results
            print(f" Accuracy:  {accuracy:.4f}")
            print(f" Precision: {precision:.4f}")
            print(f" Recall:    {recall:.4f}")
            print(f" F1 Score:  {f1:.4f}")
            print(f" ROC-AUC:   {roc_auc:.4f}")
            print(f" CV Score:  {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
            
            # Confusion Matrix
            cm = confusion_matrix(y_test, y_pred)
            print(f"\n Confusion Matrix:")
            print(f"   TN: {cm[0,0]:,}  FP: {cm[0,1]:,}")
            print(f"   FN: {cm[1,0]:,}  TP: {cm[1,1]:,}")
            
            # Track best model
            if f1 > best_score:
                best_score = f1
                best_model = model
                best_name = name
                
        except Exception as e:
            print(f"❌ Error training {name}: {e}")
    
    return results, best_model, best_name

# ============================================================
# Feature Importance
# ============================================================

def analyze_feature_importance(best_model, X, feature_names):
    """Analyze and visualize feature importance"""
    
    print("\n" + "="*60)
    print(" FEATURE IMPORTANCE ANALYSIS")
    print("="*60)
    
    if hasattr(best_model, 'feature_importances_'):
        importance = best_model.feature_importances_
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        print("\n Top 10 Most Important Features:")
        print(importance_df.head(10).to_string(index=False))
        
        # Create plot
        plt.figure(figsize=(12, 10))
        top_features = importance_df.head(20)
        plt.barh(top_features['feature'], top_features['importance'])
        plt.xlabel('Feature Importance')
        plt.title('Top 20 Most Important Features')
        plt.tight_layout()
        
        # Save plot
        os.makedirs('reports/visualizations', exist_ok=True)
        plt.savefig('reports/visualizations/feature_importance.png', dpi=150)
        print("\n Feature importance plot saved to 'reports/visualizations/feature_importance.png'")
        plt.show()
        
        return importance_df
    
    elif hasattr(best_model, 'coef_'):
        importance = np.abs(best_model.coef_[0])
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        return importance_df
    
    else:
        print(" Model doesn't have feature importance attribute")
        return None

# ============================================================
# Save Results
# ============================================================

def save_results(results, best_model, best_name, X):
    """Save models and results"""
    
    print("\n" + "="*60)
    print(" SAVING MODELS")
    print("="*60)
    
    os.makedirs('models', exist_ok=True)
    
    # Save best model
    joblib.dump(best_model, 'models/risk_predictor.pkl')
    print(" Best model saved to 'models/risk_predictor.pkl'")
    
    # Save feature names
    joblib.dump(X.columns.tolist(), 'models/feature_names.pkl')
    print(" Feature names saved to 'models/feature_names.pkl'")
    
    # Save results
    results_df = pd.DataFrame({
        'Model': list(results.keys()),
        'Accuracy': [results[m]['accuracy'] for m in results],
        'Precision': [results[m]['precision'] for m in results],
        'Recall': [results[m]['recall'] for m in results],
        'F1 Score': [results[m]['f1'] for m in results],
        'ROC-AUC': [results[m]['roc_auc'] for m in results],
        'CV Mean': [results[m]['cv_mean'] for m in results],
        'CV Std': [results[m]['cv_std'] for m in results]
    })
    results_df.to_csv('models/model_results.csv', index=False)
    print(" Results saved to 'models/model_results.csv'")
    
    # Save report
    with open('models/model_report.txt', 'w') as f:
        f.write("="*60 + "\n")
        f.write("MODEL TRAINING REPORT\n")
        f.write("="*60 + "\n\n")
        f.write(f"Best Model: {best_name}\n")
        f.write(f"Accuracy:  {results[best_name]['accuracy']:.4f}\n")
        f.write(f"F1 Score:  {results[best_name]['f1']:.4f}\n")
        f.write(f"ROC-AUC:   {results[best_name]['roc_auc']:.4f}\n\n")
        f.write("="*60 + "\n")
        f.write("All Models Comparison\n")
        f.write("="*60 + "\n")
        f.write(results_df.to_string(index=False))
    
    print(" Report saved to 'models/model_report.txt'")
    
    print(f"\n Best Model: {best_name}")
    print(f"   Accuracy:  {results[best_name]['accuracy']:.4f}")
    print(f"   F1 Score:  {results[best_name]['f1']:.4f}")
    print(f"   ROC-AUC:   {results[best_name]['roc_auc']:.4f}")
    
    return results_df

# ============================================================
# MAIN PIPELINE
# ============================================================

def run_model_pipeline():
    """Run complete model building pipeline"""
    
    print("="*60)
    print(" STARTING MODEL BUILDING PIPELINE")
    print("="*60)
    
    # Load data
    X, y = load_and_fix_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n Train shape: {X_train.shape}")
    print(f" Test shape: {X_test.shape}")
    
    # Train models
    results, best_model, best_name = train_models(X_train, X_test, y_train, y_test)
    
    # Feature importance
    importance_df = analyze_feature_importance(best_model, X, X.columns.tolist())
    
    # Save results
    results_df = save_results(results, best_model, best_name, X)
    
   
    
    return results, best_model, results_df

if __name__ == "__main__":
    results, best_model, results_df = run_model_pipeline()