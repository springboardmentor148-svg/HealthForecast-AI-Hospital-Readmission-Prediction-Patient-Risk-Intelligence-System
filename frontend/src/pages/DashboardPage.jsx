import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
  secondaryBtnStyle 
} from '../styles';

export default function DashboardPage() {
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/dashboard/stats')
      .then((res) => {
        if (res.data) {
          setStats(res.data.stats || []);
          setRecentActivity(res.data.recent_activity || []);
        }
      })
      .catch((err) => console.error("Error connecting to dashboard API:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={containerStyle}>
        <h3>Connecting to live server...</h3>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>Healthcare Performance & Patient Overview Dashboard</h2>
        <p style={subTextStyle}>Real-time clinical insights and readmission risk metrics.</p>
      </header>

      {/* Dynamic Summary Cards */}
      <div style={gridStyle}>
        {stats.map((item, idx) => (
          <div key={idx} style={{ ...cardStyle, borderLeft: `5px solid ${item.color}`, backgroundColor: item.bg }}>
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>{item.title}</span>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a', margin: '8px 0' }}>{item.value}</div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{item.change}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '30px' }}>
        <div style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Recent Risk Assessments</h3>
          <table style={tableStyle}>
            <thead>
              <tr style={thGroupStyle}>
                <th style={thStyle}>Patient ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Age</th>
                <th style={thStyle}>Risk Level</th>
                <th style={thStyle}>Probability</th>
                <th style={thStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>
                    No risk assessments calculated yet.
                  </td>
                </tr>
              ) : (
                recentActivity.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}><strong>{row.id}</strong></td>
                    <td style={tdStyle}>{row.name}</td>
                    <td style={tdStyle}>{row.age}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(row.risk === 'High Risk')}>
                        {row.risk}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.prob}</td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{row.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Quick Navigation</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Direct access to core clinical workflows and predictive modeling.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/predict" style={primaryBtnStyle}>
              + Run New Readmission Risk Calculation
            </Link>
            <Link to="/patients" style={secondaryBtnStyle}>
              View Patient Directory
            </Link>
            <Link to="/analytics" style={secondaryBtnStyle}>
              Open System Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}