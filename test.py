import joblib

def verify_data():
    print("="*50)
    print("✅ DATA VERIFICATION")
    print("="*50)
    
    try:
        X = joblib.load('data/processed/X_processed.pkl')
        y = joblib.load('data/processed/y_processed.pkl')
        
        print(f"\n✅ X shape: {X.shape}")
        print(f"✅ y shape: {y.shape}")
        print(f"\n📋 Features ({X.shape[1]} total):")
        print(f"   {X.columns.tolist()[:10]}... (showing first 10)")
        print(f"\n📋 Target distribution:")
        print(y.value_counts())
        print(f"\n📋 Missing values in X: {X.isnull().sum().sum()}")
        print("\n" + "="*50)
        print("✅ DATA IS READY FOR MODELING!")
        print("="*50)
        return X, y
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nRun 'python src\\preprocess.py' first.")
        return None, None

if __name__ == "__main__":
    verify_data()