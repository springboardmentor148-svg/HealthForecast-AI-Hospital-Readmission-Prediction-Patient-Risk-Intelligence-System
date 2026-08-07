import React from 'react';

import { Link } from 'react-router-dom';

// Import named exports from styles.js
import { 
  containerStyle, 
  headerStyle, 
  subTextStyle, 
  gridStyle, 
  cardStyle, 
  sectionBoxStyle, 
  sectionTitleStyle, 
  tableStyle, 
  thGroupStyle, 
  thStyle, 
  tdStyle, 
  badgeStyle, 
  primaryBtnStyle, 
  secondaryBtnStyle,  
  barBgStyle, 
  barFillStyle

} from '../styles';

export default function AnalyticsPage() {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>Hospital Analytics & Treatment Outcomes</h2>
        <p style={subTextStyle}>Aggregate distribution metrics across diabetic patient admission demographics.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Risk Distribution Chart Mock */}
        <div style={sectionBoxStyle}>
          <h3>30-Day Readmission Risk Distribution</h3>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Based on 1,248 historical patient records</p>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                <span>Low Risk (&lt; 50% Probability)</span>
                <strong>88.7% (1,106 Patients)</strong>
              </div>
              <div style={barBgStyle}>
                <div style={{ ...barFillStyle, width: '88.7%', backgroundColor: '#22c55e' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                <span>High Risk (&ge; 50% Probability)</span>
                <strong>11.3% (142 Patients)</strong>
              </div>
              <div style={barBgStyle}>
                <div style={{ ...barFillStyle, width: '11.3%', backgroundColor: '#ef4444' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Risk Factor Contributors */}
        <div style={sectionBoxStyle}>
          <h3>Top Contributing Feature Weights (XGBoost)</h3>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Relative influence on 30-day readmission prediction</p>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { feature: 'Number of Inpatient Visits', weight: '34%' },
              { feature: 'Discharge Disposition ID', weight: '22%' },
              { feature: 'Emergency Room Visits', weight: '18%' },
              { feature: 'Number of Diagnoses', weight: '14%' },
              { feature: 'Diabetes Medication Prescribed', weight: '12%' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ fontSize: '14px', color: '#334155' }}>{f.feature}</span>
                <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{f.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}