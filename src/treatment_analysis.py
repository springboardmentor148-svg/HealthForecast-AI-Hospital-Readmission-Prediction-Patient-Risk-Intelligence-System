import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_auc_score, accuracy_score
import os
import warnings
warnings.filterwarnings('ignore')

class TreatmentEffectiveness:
    """Analyze treatment effectiveness and patient outcomes"""
    
    def __init__(self):
        self.df = None
        self.X = None
        self.y = None
        self.results = {}
        
    def load_data(self):
        """Load patient and treatment data"""
        print("\n" + "="*60)
        print("📂 LOADING DATA FOR TREATMENT ANALYSIS")
        print("="*60)
        
        self.X = joblib.load('data/processed/X_processed.pkl')
        self.y = joblib.load('data/processed/y_processed.pkl')
        
        print(f"✅ Loaded {self.X.shape[0]:,} patients with {self.X.shape[1]} features")
        print(f"✅ Readmission Rate: {self.y.mean():.2%}")
        return self.X, self.y
    
    def analyze_medication_effectiveness(self):
        """Analyze which medications reduce readmission risk"""
        print("\n" + "="*60)
        print("🔍 MEDICATION EFFECTIVENESS ANALYSIS")
        print("="*60)
        
        # Medication columns in the dataset
        medication_cols = ['metformin', 'insulin', 'glipizide', 
                          'glyburide', 'pioglitazone', 'rosiglitazone',
                          'acarbose', 'miglitol', 'tolazamide']
        
        results = []
        
        for med in medication_cols:
            if med in self.X.columns:
                # Patients on this medication
                on_med = self.X[self.X[med] != 'No']
                # Patients not on this medication
                off_med = self.X[self.X[med] == 'No']
                
                if len(on_med) > 0 and len(off_med) > 0:
                    on_rate = self.y.loc[on_med.index].mean()
                    off_rate = self.y.loc[off_med.index].mean()
                    
                    # Calculate effectiveness
                    absolute_reduction = (off_rate - on_rate) * 100
                    relative_reduction = ((off_rate - on_rate) / off_rate) * 100
                    
                    results.append({
                        'medication': med.upper(),
                        'patients_on': len(on_med),
                        'patients_off': len(off_med),
                        'readmission_rate_on': on_rate,
                        'readmission_rate_off': off_rate,
                        'absolute_reduction': absolute_reduction,
                        'relative_reduction': relative_reduction,
                        'effective': on_rate < off_rate
                    })
                    
                    status = "✅" if on_rate < off_rate else "⚠️"
                    print(f"{status} {med.upper()}: {absolute_reduction:.1f}% reduction")
        
        self.results['medication'] = pd.DataFrame(results)
        return self.results['medication']
    
    def analyze_treatment_outcomes_by_feature(self, feature, bins=4):
        """Analyze outcomes by feature categories"""
        print(f"\n📊 Analyzing outcomes by {feature}...")
        
        df = self.X.copy()
        df['readmitted'] = self.y
        
        # Create bins
        try:
            labels = [f'{feature}_Q{i+1}' for i in range(bins)]
            df[f'{feature}_bin'] = pd.qcut(df[feature], q=bins, labels=labels, duplicates='drop')
            
            analysis = df.groupby(f'{feature}_bin')['readmitted'].agg([
                ('count', 'count'),
                ('readmission_rate', 'mean')
            ]).reset_index()
            
            self.results[f'analysis_{feature}'] = analysis
            return analysis
        except Exception as e:
            print(f"⚠️ Could not analyze {feature}: {e}")
            return None
    
    def generate_effectiveness_report(self):
        """Generate comprehensive treatment effectiveness report"""
        print("\n" + "="*60)
        print("📝 GENERATING EFFECTIVENESS REPORT")
        print("="*60)
        
        # Create visualizations
        self.create_visualizations()
        
        # Generate summary
        med_results = self.results.get('medication', pd.DataFrame())
        
        if not med_results.empty:
            best_med = med_results.loc[med_results['absolute_reduction'].idxmax()]
            worst_med = med_results.loc[med_results['absolute_reduction'].idxmin()]
            
            report = {
                'summary': {
                    'total_patients': len(self.X),
                    'overall_readmission_rate': self.y.mean(),
                    'best_medication': best_med['medication'] if not best_med.empty else 'N/A',
                    'best_medication_reduction': best_med['absolute_reduction'] if not best_med.empty else 0,
                    'effective_medications': len(med_results[med_results['effective'] == True])
                },
                'medication_results': med_results.to_dict('records')
            }
            
            # Save report
            os.makedirs('reports', exist_ok=True)
            med_results.to_csv('reports/medication_effectiveness.csv', index=False)
            
            # Save report as text
            with open('reports/effectiveness_report.txt', 'w') as f:
                f.write("="*60 + "\n")
                f.write("TREATMENT EFFECTIVENESS REPORT\n")
                f.write("="*60 + "\n\n")
                f.write(f"Total Patients: {report['summary']['total_patients']:,}\n")
                f.write(f"Overall Readmission Rate: {report['summary']['overall_readmission_rate']:.2%}\n")
                f.write(f"Best Medication: {report['summary']['best_medication']}\n")
                f.write(f"Medication Reduction: {report['summary']['best_medication_reduction']:.1f}%\n")
                f.write(f"Effective Medications: {report['summary']['effective_medications']}\n")
            
            print("✅ Report saved to 'reports/effectiveness_report.txt'")
            return report
        
        return None
    
    def create_visualizations(self):
        """Create visualizations for treatment effectiveness"""
        print("\n📊 Creating visualizations...")
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # 1. Medication Effectiveness
        med_results = self.results.get('medication', pd.DataFrame())
        if not med_results.empty:
            med_sorted = med_results.sort_values('absolute_reduction', ascending=True)
            colors = ['green' if x > 0 else 'red' for x in med_sorted['absolute_reduction']]
            
            axes[0, 0].barh(med_sorted['medication'], med_sorted['absolute_reduction'], color=colors)
            axes[0, 0].axvline(x=0, color='black', linestyle='--', linewidth=1)
            axes[0, 0].set_xlabel('Absolute Reduction in Readmission Rate (%)')
            axes[0, 0].set_title('Medication Effectiveness (Higher is Better)')
        
        # 2. Readmission Rates by Medication
        if not med_results.empty:
            x = np.arange(len(med_results))
            width = 0.35
            
            axes[0, 1].bar(x - width/2, med_results['readmission_rate_on'], width, label='With Medication')
            axes[0, 1].bar(x + width/2, med_results['readmission_rate_off'], width, label='Without Medication')
            axes[0, 1].set_xlabel('Medication')
            axes[0, 1].set_ylabel('Readmission Rate')
            axes[0, 1].set_title('Readmission Rates by Medication')
            axes[0, 1].set_xticks(x)
            axes[0, 1].set_xticklabels(med_results['medication'], rotation=45)
            axes[0, 1].legend()
        
        # 3. Feature Analysis
        if 'analysis_time_in_hospital' in self.results:
            data = self.results['analysis_time_in_hospital']
            axes[1, 0].bar(data['time_in_hospital_bin'], data['readmission_rate'])
            axes[1, 0].set_xlabel('Stay Length Category')
            axes[1, 0].set_ylabel('Readmission Rate')
            axes[1, 0].set_title('Readmission by Stay Length')
            axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 4. Feature Importance from Model (if available)
        try:
            model = joblib.load('models/risk_predictor.pkl')
            if hasattr(model, 'feature_importances_'):
                feature_names = joblib.load('models/feature_names.pkl')
                importance = pd.DataFrame({
                    'feature': feature_names,
                    'importance': model.feature_importances_
                }).sort_values('importance', ascending=True).tail(15)
                
                axes[1, 1].barh(importance['feature'], importance['importance'])
                axes[1, 1].set_xlabel('Importance')
                axes[1, 1].set_title('Top 15 Feature Importance')
        except:
            pass
        
        plt.tight_layout()
        
        # Save
        os.makedirs('reports/visualizations', exist_ok=True)
        plt.savefig('reports/visualizations/treatment_effectiveness.png', dpi=150)
        print("✅ Visualization saved to 'reports/visualizations/treatment_effectiveness.png'")
        plt.show()
    
    def run_analysis(self):
        """Run complete treatment effectiveness analysis"""
        print("="*60)
        print("🚀 STARTING TREATMENT EFFECTIVENESS ANALYSIS")
        print("="*60)
        
        self.load_data()
        self.analyze_medication_effectiveness()
        self.analyze_treatment_outcomes_by_feature('time_in_hospital', 4)
        report = self.generate_effectiveness_report()
        
        print("\n" + "="*60)
        print("✅ TREATMENT EFFECTIVENESS ANALYSIS COMPLETE!")
        print("="*60)
        
        return report

if __name__ == "__main__":
    analyzer = TreatmentEffectiveness()
    analyzer.run_analysis()