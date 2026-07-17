"""
src/clinical_support.py
Clinical Decision Support Module - Week 3
"""

import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class ClinicalDecisionSupport:
    """Generate clinical recommendations and care plans"""
    
    def __init__(self):
        self.model = joblib.load('models/risk_predictor.pkl')
        self.feature_names = joblib.load('models/feature_names.pkl')
        self.feature_importance = None
        
        # Get feature importance if available
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance = self.model.feature_importances_
    
    def predict_risk(self, patient_data):
        """Predict risk for a single patient"""
        # Prepare data
        X = np.zeros(len(self.feature_names))
        for i, feature in enumerate(self.feature_names):
            X[i] = patient_data.get(feature, 0)
        
        X = X.reshape(1, -1)
        risk_score = self.model.predict_proba(X)[0, 1]
        prediction = self.model.predict(X)[0]
        
        # Determine risk category
        if risk_score > 0.7:
            category = 'High'
            color = '🔴'
        elif risk_score > 0.4:
            category = 'Medium'
            color = '🟡'
        else:
            category = 'Low'
            color = '🟢'
        
        return {
            'risk_score': risk_score,
            'risk_category': category,
            'risk_color': color,
            'prediction': bool(prediction),
            'probability': risk_score
        }
    
    def generate_care_recommendations(self, patient_data, risk_result):
        """Generate personalized care recommendations"""
        risk_score = risk_result['risk_score']
        risk_category = risk_result['risk_category']
        
        recommendations = []
        
        # High risk recommendations
        if risk_score > 0.7:
            recommendations.extend([
                {
                    'priority': '⚠️ CRITICAL',
                    'action': 'Immediate follow-up within 7 days',
                    'reason': f'High readmission risk ({risk_score:.1%})',
                    'urgency': 'High'
                },
                {
                    'priority': '⚠️ CRITICAL',
                    'action': 'Schedule comprehensive medication review',
                    'reason': 'Medication optimization may reduce risk',
                    'urgency': 'High'
                },
                {
                    'priority': '⚠️ CRITICAL',
                    'action': 'Coordinate with primary care provider',
                    'reason': 'Ensure continuity of care post-discharge',
                    'urgency': 'High'
                },
                {
                    'priority': '⚠️ CRITICAL',
                    'action': 'Home health visit recommended',
                    'reason': 'Monitor for early signs of complications',
                    'urgency': 'High'
                }
            ])
        
        # Medium risk recommendations
        elif risk_score > 0.4:
            recommendations.extend([
                {
                    'priority': '📋 RECOMMENDED',
                    'action': 'Follow-up within 14 days',
                    'reason': f'Moderate readmission risk ({risk_score:.1%})',
                    'urgency': 'Medium'
                },
                {
                    'priority': '📋 RECOMMENDED',
                    'action': 'Review discharge medications',
                    'reason': 'Verify adherence to prescribed regimen',
                    'urgency': 'Medium'
                },
                {
                    'priority': '📋 RECOMMENDED',
                    'action': 'Patient education on warning signs',
                    'reason': 'Empower patient to seek early care',
                    'urgency': 'Medium'
                }
            ])
        
        # Low risk recommendations
        else:
            recommendations.extend([
                {
                    'priority': '✅ ROUTINE',
                    'action': 'Standard follow-up within 30 days',
                    'reason': f'Low readmission risk ({risk_score:.1%})',
                    'urgency': 'Low'
                },
                {
                    'priority': '✅ ROUTINE',
                    'action': 'Routine medication review',
                    'reason': 'Maintain current regimen',
                    'urgency': 'Low'
                }
            ])
        
        return recommendations
    
    def generate_follow_up_plan(self, patient_data, risk_result):
        """Generate structured follow-up plan"""
        risk_score = risk_result['risk_score']
        
        # Determine follow-up timeline
        if risk_score > 0.7:
            days = 7
            intensity = 'High'
            actions = [
                'Phone follow-up at day 3',
                'In-person visit at day 7',
                'Medication adherence check',
                'Home health visit'
            ]
        elif risk_score > 0.4:
            days = 14
            intensity = 'Medium'
            actions = [
                'Phone follow-up at day 7',
                'In-person visit at day 14',
                'Medication review'
            ]
        else:
            days = 30
            intensity = 'Low'
            actions = [
                'Phone follow-up at day 14',
                'In-person visit at day 30'
            ]
        
        plan = {
            'follow_up_days': days,
            'intensity': intensity,
            'scheduled_date': (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d'),
            'actions': actions,
            'tests_required': self._suggest_tests(patient_data, risk_score)
        }
        
        return plan
    
    def _suggest_tests(self, patient_data, risk_score):
        """Suggest relevant tests"""
        tests = ['Complete Blood Count (CBC)']
        
        # Diabetes-specific tests
        if patient_data.get('a1c_tested', 0) == 1:
            tests.append('Glycated Hemoglobin (HbA1c)')
        
        if patient_data.get('glucose_tested', 0) == 1:
            tests.append('Fasting Blood Glucose')
        
        # High risk patients
        if risk_score > 0.7:
            tests.extend([
                'Electrocardiogram (ECG)',
                'Chest X-ray',
                'Basic Metabolic Panel'
            ])
        
        return tests
    
    def generate_report(self, patient_data, patient_id='Unknown'):
        """Generate complete clinical report"""
        # Predict risk
        risk_result = self.predict_risk(patient_data)
        
        # Generate recommendations
        recommendations = self.generate_care_recommendations(patient_data, risk_result)
        
        # Generate follow-up plan
        follow_up_plan = self.generate_follow_up_plan(patient_data, risk_result)
        
        report = {
            'patient_id': patient_id,
            'assessment_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'risk_assessment': risk_result,
            'care_recommendations': recommendations,
            'follow_up_plan': follow_up_plan,
            'summary': self._generate_summary(risk_result, recommendations)
        }
        
        return report
    
    def _generate_summary(self, risk_result, recommendations):
        """Generate clinical summary"""
        urgent_count = len([r for r in recommendations if r['urgency'] == 'High'])
        days = recommendations[0]['action'].split()[-2] if recommendations else '30'
        
        summary = f"""
        CLINICAL SUMMARY
        =================
        Risk Category: {risk_result['risk_color']} {risk_result['risk_category']} ({risk_result['risk_score']:.1%})
        Urgent Actions Required: {urgent_count}
        Recommended Follow-up: {days} days
        Total Recommendations: {len(recommendations)}
        """
        
        return summary.strip()

if __name__ == "__main__":
    # Sample usage
    support = ClinicalDecisionSupport()
    
    sample_patient = {
        'age': 65,
        'time_in_hospital': 5,
        'medication_count': 4,
        'a1c_tested': 1,
        'glucose_tested': 1,
        'num_medications': 8,
        'num_lab_procedures': 15,
        'num_procedures': 3,
        'number_diagnoses': 5
    }
    
    print("="*60)
    print("CLINICAL DECISION SUPPORT - SAMPLE REPORT")
    print("="*60)
    
    report = support.generate_report(sample_patient, patient_id='P-12345')
    print(report['summary'])
    print("\n📋 Recommendations:")
    for rec in report['care_recommendations']:
        print(f"   {rec['priority']}: {rec['action']}")
    print(f"\n📅 Follow-up Plan: {report['follow_up_plan']['scheduled_date']}")