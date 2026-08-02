import React from 'react';
import { containerStyle, headerStyle, subTextStyle, sectionBoxStyle, primaryBtnStyle } from '../styles';

export default function ReportsPage() {
  const handleDownload = () => {
    window.open('http://127.0.0.1:8000/api/reports/download-csv', '_blank');
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>Clinical Reports & Data Export</h2>
        <p style={subTextStyle}>Export aggregated readmission risk assessment datasets for real clinical audit.</p>
      </header>

      <div style={sectionBoxStyle}>
        <h3>Download Patient Outcome Report</h3>
        <p style={{ color: '#64748b', margin: '15px 0' }}>
          Download the latest clinical risk assessment records generated from your live database inputs.
        </p>
        <button onClick={handleDownload} style={primaryBtnStyle}>
          Download Patient Outcome CSV Report
        </button>
      </div>
    </div>
  );
}