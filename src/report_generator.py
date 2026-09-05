"""
src/report_generator.py
Healthcare Performance Report Generator - Week 3
Generates comprehensive reports for hospital administrators and clinicians
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

class ReportGenerator:
    """Generate healthcare performance reports"""
    
    def __init__(self):
        self.X = None
        self.y = None
        self.model = None
        self.feature_names = None
        self.risk_scores = None
        self.X_clean = None  # Cleaned version for predictions
        self.results = {}
        self.report_date = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        # Load data
        self.load_data()
    
    def load_data(self):
        """Load all necessary data and clean non-numeric columns"""
        print("\n" + "="*60)
        print("📂 LOADING DATA FOR REPORT GENERATION")
        print("="*60)
        
        # Load data
        self.X = joblib.load('data/processed/X_processed.pkl')
        self.y = joblib.load('data/processed/y_processed.pkl')
        self.model = joblib.load('models/risk_predictor.pkl')
        self.feature_names = joblib.load('models/feature_names.pkl')
        
        # Fix non-numeric columns
        print("🔧 Fixing non-numeric columns...")
        self.X_clean = self.X.copy()
        
        # Find non-numeric columns
        non_numeric_cols = self.X_clean.select_dtypes(include=['object']).columns.tolist()
        
        if non_numeric_cols:
            print(f"   Found {len(non_numeric_cols)} non-numeric columns")
            for col in non_numeric_cols:
                try:
                    self.X_clean[col] = pd.to_numeric(self.X_clean[col], errors='raise')
                except:
                    le = LabelEncoder()
                    self.X_clean[col] = le.fit_transform(self.X_clean[col].astype(str))
        
        # Fill any NaN values
        self.X_clean = self.X_clean.fillna(0)
        print("   ✅ All columns are now numeric!")
        
        # Calculate risk scores on cleaned data
        self.risk_scores = self.model.predict_proba(self.X_clean)[:, 1]
        
        print(f"✅ Loaded {len(self.X):,} patients")
        print(f"✅ Readmission Rate: {self.y.mean():.2%}")
        
        # Add risk categories to X for analysis
        self.X['readmitted'] = self.y
        self.X['risk_score'] = self.risk_scores
        self.X['risk_category'] = pd.cut(
            self.risk_scores, 
            bins=[0, 0.4, 0.7, 1], 
            labels=['Low', 'Medium', 'High']
        )
    
    def generate_summary_report(self):
        """Generate executive summary report"""
        print("\n" + "="*60)
        print("📊 GENERATING EXECUTIVE SUMMARY")
        print("="*60)
        
        # Calculate key metrics
        self.results['summary'] = {
            'report_date': self.report_date,
            'total_patients': len(self.X),
            'readmitted_count': int(self.y.sum()),
            'readmission_rate': f"{self.y.mean():.2%}",
            'high_risk_patients': int(sum(self.risk_scores > 0.7)),
            'medium_risk_patients': int(sum((self.risk_scores > 0.4) & (self.risk_scores <= 0.7))),
            'low_risk_patients': int(sum(self.risk_scores <= 0.4)),
            'high_risk_rate': f"{sum(self.risk_scores > 0.7) / len(self.X):.2%}",
            'avg_risk_score': f"{self.risk_scores.mean():.2%}",
            'avg_stay_length': f"{self.X['time_in_hospital'].mean():.1f} days",
            'readmitted_high_risk': int(self.X[(self.X['readmitted'] == 1) & (self.risk_scores > 0.7)].shape[0]),
            'total_features': len(self.feature_names)
        }
        
        print("✅ Executive summary generated")
        return self.results['summary']
    
    def generate_demographic_report(self):
        """Generate demographic analysis report"""
        print("\n📊 Generating demographic report...")
        
        demographic = {}
        
        # Age analysis
        if 'age' in self.X.columns:
            age_bins = [0, 30, 50, 65, 80, 100]
            age_labels = ['<30', '30-50', '50-65', '65-80', '80+']
            self.X['age_group'] = pd.cut(self.X['age'], bins=age_bins, labels=age_labels)
            
            age_data = self.X.groupby('age_group')['readmitted'].agg([
                ('count', 'count'),
                ('rate', 'mean'),
                ('avg_risk', lambda x: self.X.loc[x.index, 'risk_score'].mean())
            ]).reset_index()
            
            demographic['age'] = age_data.to_dict('records')
            print(f"   ✅ Age analysis complete")
        
        # Gender analysis
        if 'gender' in self.X.columns:
            gender_data = self.X.groupby('gender')['readmitted'].agg([
                ('count', 'count'),
                ('rate', 'mean'),
                ('avg_risk', lambda x: self.X.loc[x.index, 'risk_score'].mean())
            ]).reset_index()
            
            demographic['gender'] = gender_data.to_dict('records')
            print(f"   ✅ Gender analysis complete")
        
        self.results['demographic'] = demographic
        return demographic
    
    def generate_clinical_report(self):
        """Generate clinical metrics report"""
        print("\n📊 Generating clinical report...")
        
        clinical = {}
        
        # Stay length analysis
        if 'time_in_hospital' in self.X.columns:
            clinical['stay_length'] = {
                'mean': self.X['time_in_hospital'].mean(),
                'median': self.X['time_in_hospital'].median(),
                'max': self.X['time_in_hospital'].max(),
                'min': self.X['time_in_hospital'].min(),
                'std': self.X['time_in_hospital'].std()
            }
        
        # Medication analysis
        medication_cols = ['metformin', 'insulin', 'glipizide', 
                          'glyburide', 'pioglitazone', 'rosiglitazone']
        clinical['medications'] = {}
        
        for med in medication_cols:
            if med in self.X.columns:
                on_med = self.X[self.X[med] != 0] if self.X[med].dtype != 'object' else self.X[self.X[med] != 'No']
                clinical['medications'][med] = {
                    'patients_on': len(on_med),
                    'readmission_rate': self.y.loc[on_med.index].mean() if len(on_med) > 0 else 0,
                    'percentage': len(on_med) / len(self.X) * 100
                }
        
        # Lab tests analysis
        lab_cols = ['num_lab_procedures', 'num_procedures', 'num_medications', 'number_diagnoses']
        clinical['lab_tests'] = {}
        for col in lab_cols:
            if col in self.X.columns:
                clinical['lab_tests'][col] = {
                    'mean': self.X[col].mean(),
                    'median': self.X[col].median(),
                    'max': self.X[col].max(),
                    'min': self.X[col].min()
                }
        
        self.results['clinical'] = clinical
        print("✅ Clinical report generated")
        return clinical
    
    def generate_performance_report(self):
        """Generate model performance report"""
        print("\n📊 Generating performance report...")
        
        performance = {}
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            performance['top_features'] = importance_df.head(10).to_dict('records')
            performance['feature_importance_summary'] = {
                'total_features': len(self.feature_names),
                'top_feature': importance_df.iloc[0]['feature'],
                'top_feature_importance': float(importance_df.iloc[0]['importance'])
            }
        
        # Risk score distribution
        performance['risk_distribution'] = {
            'mean': float(self.risk_scores.mean()),
            'median': float(np.median(self.risk_scores)),
            'std': float(self.risk_scores.std()),
            'min': float(self.risk_scores.min()),
            'max': float(self.risk_scores.max())
        }
        
        self.results['performance'] = performance
        print("✅ Performance report generated")
        return performance
    
    def generate_recommendations(self):
        """Generate actionable recommendations"""
        print("\n📊 Generating recommendations...")
        
        recommendations = []
        
        # 1. High risk patients
        high_risk = sum(self.risk_scores > 0.7)
        if high_risk > 0:
            recommendations.append({
                'category': 'Patient Care',
                'priority': 'HIGH',
                'recommendation': f'Implement intensive follow-up for {high_risk:,} high-risk patients',
                'reason': f'These patients have >70% readmission risk',
                'action_items': [
                    'Schedule follow-up within 7 days',
                    'Assign care coordinator',
                    'Medication review and adherence check'
                ]
            })
        
        # 2. Medication effectiveness
        medication_cols = ['metformin', 'insulin', 'glipizide', 'glyburide']
        effective_meds = []
        
        for med in medication_cols:
            if med in self.X.columns:
                if self.X[med].dtype == 'object':
                    on_med = self.X[self.X[med] != 'No']
                    off_med = self.X[self.X[med] == 'No']
                else:
                    on_med = self.X[self.X[med] != 0]
                    off_med = self.X[self.X[med] == 0]
                
                if len(on_med) > 0 and len(off_med) > 0:
                    on_rate = self.y.loc[on_med.index].mean()
                    off_rate = self.y.loc[off_med.index].mean()
                    if on_rate < off_rate:
                        effective_meds.append(med)
        
        if effective_meds:
            recommendations.append({
                'category': 'Treatment',
                'priority': 'MEDIUM',
                'recommendation': f'Consider increasing use of effective medications: {", ".join(effective_meds)}',
                'reason': 'These medications are associated with lower readmission rates',
                'action_items': [
                    'Review patient medication lists',
                    'Consider adding effective medications where appropriate',
                    'Monitor for adverse effects'
                ]
            })
        
        # 3. Stay length
        if 'time_in_hospital' in self.X.columns:
            avg_stay = self.X['time_in_hospital'].mean()
            long_stay_patients = self.X[self.X['time_in_hospital'] > 7]
            if len(long_stay_patients) > 0:
                long_stay_rate = self.y.loc[long_stay_patients.index].mean()
                recommendations.append({
                    'category': 'Operational',
                    'priority': 'MEDIUM',
                    'recommendation': f'Optimize discharge planning for patients with extended stays',
                    'reason': f'{len(long_stay_patients):,} patients have stays >7 days ({long_stay_rate:.1%} readmission rate)',
                    'action_items': [
                        'Review discharge protocols',
                        'Early discharge planning for high-risk patients',
                        'Coordinate with care transition team'
                    ]
                })
        
        self.results['recommendations'] = recommendations
        print("✅ Recommendations generated")
        return recommendations
    
    def create_visualizations(self):
        """Create report visualizations"""
        print("\n📊 Creating visualizations...")
        
        os.makedirs('reports/visualizations', exist_ok=True)
        
        # 1. Risk Score Distribution
        plt.figure(figsize=(10, 6))
        plt.hist(self.risk_scores, bins=50, edgecolor='black', alpha=0.7)
        plt.axvline(x=0.4, color='orange', linestyle='--', label='Medium Risk Threshold')
        plt.axvline(x=0.7, color='red', linestyle='--', label='High Risk Threshold')
        plt.xlabel('Risk Score')
        plt.ylabel('Number of Patients')
        plt.title('Patient Risk Score Distribution')
        plt.legend()
        plt.tight_layout()
        plt.savefig('reports/visualizations/risk_distribution.png', dpi=150)
        plt.close()
        print("   ✅ Risk distribution plot saved")
        
        # 2. Readmission by Risk Category
        if 'risk_category' in self.X.columns:
            plt.figure(figsize=(8, 6))
            risk_rates = self.X.groupby('risk_category')['readmitted'].mean()
            colors = ['green', 'orange', 'red']
            risk_rates.plot(kind='bar', color=colors)
            plt.xlabel('Risk Category')
            plt.ylabel('Readmission Rate')
            plt.title('Readmission Rate by Risk Category')
            plt.xticks(rotation=0)
            plt.tight_layout()
            plt.savefig('reports/visualizations/readmission_by_risk.png', dpi=150)
            plt.close()
            print("   ✅ Readmission by risk plot saved")
        
        # 3. Top Features
        if hasattr(self.model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=True).tail(15)
            
            plt.figure(figsize=(10, 8))
            plt.barh(importance_df['feature'], importance_df['importance'])
            plt.xlabel('Feature Importance')
            plt.title('Top 15 Most Important Features')
            plt.tight_layout()
            plt.savefig('reports/visualizations/top_features.png', dpi=150)
            plt.close()
            print("   ✅ Feature importance plot saved")
        
        # 4. Age Distribution (if available)
        if 'age' in self.X.columns:
            plt.figure(figsize=(10, 6))
            age_bins = [0, 30, 50, 65, 80, 100]
            age_labels = ['<30', '30-50', '50-65', '65-80', '80+']
            self.X['age_group'] = pd.cut(self.X['age'], bins=age_bins, labels=age_labels)
            age_data = self.X.groupby('age_group')['readmitted'].mean()
            
            plt.bar(age_data.index, age_data.values, color='steelblue')
            plt.xlabel('Age Group')
            plt.ylabel('Readmission Rate')
            plt.title('Readmission Rate by Age Group')
            plt.tight_layout()
            plt.savefig('reports/visualizations/age_readmission.png', dpi=150)
            plt.close()
            print("   ✅ Age distribution plot saved")
        
        print("✅ All visualizations created")
    
    def save_report(self, format='txt'):
        """Save complete report to file"""
        print("\n" + "="*60)
        print("💾 SAVING REPORT")
        print("="*60)
        
        os.makedirs('reports', exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save as text
        if format == 'txt':
            filename = f'reports/healthcare_report_{timestamp}.txt'
            
            with open(filename, 'w') as f:
                f.write("="*70 + "\n")
                f.write("HEALTHCARE PERFORMANCE REPORT\n")
                f.write("="*70 + "\n")
                f.write(f"Generated: {self.report_date}\n")
                f.write("="*70 + "\n\n")
                
                # Summary
                f.write("EXECUTIVE SUMMARY\n")
                f.write("-"*40 + "\n")
                for key, value in self.results.get('summary', {}).items():
                    f.write(f"  {key.replace('_', ' ').title()}: {value}\n")
                f.write("\n")
                
                # Demographic
                if 'demographic' in self.results:
                    f.write("DEMOGRAPHIC ANALYSIS\n")
                    f.write("-"*40 + "\n")
                    demo = self.results['demographic']
                    if 'age' in demo:
                        f.write("\nBy Age:\n")
                        for row in demo['age']:
                            f.write(f"  {row['age_group']}: {row['count']:,} patients, {row['rate']:.1%} readmission rate\n")
                    
                    if 'gender' in demo:
                        f.write("\nBy Gender:\n")
                        for row in demo['gender']:
                            f.write(f"  {row['gender']}: {row['count']:,} patients, {row['rate']:.1%} readmission rate\n")
                    f.write("\n")
                
                # Clinical
                if 'clinical' in self.results:
                    f.write("CLINICAL METRICS\n")
                    f.write("-"*40 + "\n")
                    clinical = self.results['clinical']
                    if 'stay_length' in clinical:
                        f.write(f"Average Stay: {clinical['stay_length']['mean']:.1f} days\n")
                        f.write(f"Median Stay: {clinical['stay_length']['median']:.1f} days\n")
                        f.write(f"Max Stay: {clinical['stay_length']['max']} days\n\n")
                    
                    f.write("Medication Usage:\n")
                    for med, data in clinical['medications'].items():
                        f.write(f"  {med}: {data['patients_on']:,} patients ({data['percentage']:.1f}%), {data['readmission_rate']:.1%} readmission\n")
                    f.write("\n")
                
                # Recommendations
                if 'recommendations' in self.results:
                    f.write("RECOMMENDATIONS\n")
                    f.write("-"*40 + "\n")
                    for rec in self.results['recommendations']:
                        f.write(f"\n[{rec['priority']}] {rec['category']}: {rec['recommendation']}\n")
                        f.write(f"  Reason: {rec['reason']}\n")
                        f.write("  Action Items:\n")
                        for action in rec['action_items']:
                            f.write(f"    - {action}\n")
                
                # Performance
                if 'performance' in self.results:
                    f.write("\nPERFORMANCE METRICS\n")
                    f.write("-"*40 + "\n")
                    perf = self.results['performance']
                    if 'feature_importance_summary' in perf:
                        f.write(f"Top Feature: {perf['feature_importance_summary']['top_feature']}\n")
                    if 'risk_distribution' in perf:
                        f.write(f"Avg Risk Score: {perf['risk_distribution']['mean']:.2%}\n")
            
            print(f"✅ Text report saved to: {filename}")
        
        # Save as CSV
        csv_filename = f'reports/healthcare_data_{timestamp}.csv'
        data_df = self.X.copy()
        data_df['readmitted'] = self.y
        data_df['risk_score'] = self.risk_scores
        data_df.to_csv(csv_filename, index=False)
        print(f"✅ CSV data saved to: {csv_filename}")
        
        return filename
    
    def generate_complete_report(self):
        """Generate all reports and visualizations"""
        print("="*60)
        print("🚀 STARTING COMPLETE REPORT GENERATION")
        print("="*60)
        
        # Generate all reports
        self.generate_summary_report()
        self.generate_demographic_report()
        self.generate_clinical_report()
        self.generate_performance_report()
        self.generate_recommendations()
        self.create_visualizations()
        
        # Save reports
        report_file = self.save_report('txt')
        
        print("\n" + "="*60)
        print("✅ REPORT GENERATION COMPLETE!")
        print("="*60)
        print(f"\n📁 Reports saved in 'reports/' folder:")
        print(f"   - {report_file}")
        print(f"   - reports/healthcare_data_*.csv")
        print(f"   - reports/visualizations/*.png")
        print("\n📊 Summary:")
        print(f"   - Total Patients: {len(self.X):,}")
        print(f"   - Readmission Rate: {self.y.mean():.2%}")
        print(f"   - High Risk Patients: {sum(self.risk_scores > 0.7):,}")
        print(f"   - Recommendations: {len(self.results.get('recommendations', []))}")
        
        return self.results

if __name__ == "__main__":
    # Generate complete report
    generator = ReportGenerator()
    results = generator.generate_complete_report()