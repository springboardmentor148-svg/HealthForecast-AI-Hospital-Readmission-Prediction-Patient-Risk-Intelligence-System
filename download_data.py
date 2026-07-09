from ucimlrepo import fetch_ucirepo
import pandas as pd
import os

def download_dataset():
    """Download and save the dataset"""
    
    os.makedirs('data/raw', exist_ok=True)
    
    print("="*60)
    print("📥 DOWNLOADING DATASET")
    print("="*60)
    
    try:
        print("Fetching dataset from UCI Repository...")
        diabetes_data = fetch_ucirepo(id=296)
        
        X = diabetes_data.data.features
        y = diabetes_data.data.targets
        df = pd.concat([X, y], axis=1)
        
        file_path = 'data/raw/diabetic_data.csv'
        df.to_csv(file_path, index=False)
        
        print(f"\n✅ Dataset downloaded successfully!")
        print(f"📁 Saved to: {file_path}")
        print(f"📊 Shape: {df.shape[0]:,} rows, {df.shape[1]} columns")
        
        return df
        
    except Exception as e:
        print(f"\n❌ Error downloading dataset: {e}")
        print("\n📌 Alternative: Download manually from Kaggle")
        print("   1. Go to: https://www.kaggle.com/datasets/brandao/diabetes/data")
        print("   2. Click Download")
        print("   3. Extract and copy 'diabetic_data.csv' to 'data/raw/'")
        return None

if __name__ == "__main__":
    download_dataset()