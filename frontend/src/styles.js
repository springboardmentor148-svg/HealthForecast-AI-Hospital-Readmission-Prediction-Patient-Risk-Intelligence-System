// --- Shared UI Styling Helper Objects ---
export const containerStyle = { padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' };
export const headerStyle = { marginBottom: '25px' };
export const subTextStyle = { color: '#64748b', marginTop: '5px' };
export const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' };
export const cardStyle = { padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
export const sectionBoxStyle = { background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' };
export const sectionTitleStyle = { margin: '0 0 15px 0', fontSize: '18px', color: '#0f172a' };
export const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
export const thGroupStyle = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
export const thStyle = { padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' };
export const tdStyle = { padding: '12px', fontSize: '14px', color: '#334155' };
export const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' };
export const primaryBtnStyle = { display: 'block', textAlign: 'center', background: '#0284c7', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', border: 'none', cursor: 'pointer' };
export const secondaryBtnStyle = { display: 'block', textAlign: 'center', background: '#f1f5f9', color: '#334155', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', marginTop: '10px' };
export const downloadBtnStyle = { background: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' };
export const barBgStyle = { width: '100%', backgroundColor: '#e2e8f0', borderRadius: '6px', height: '12px', overflow: 'hidden' };
export const barFillStyle = { height: '100%', borderRadius: '6px' };
export const badgeStyle = (isHigh) => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: isHigh ? '#fee2e2' : '#dcfce7',
  color: isHigh ? '#dc2626' : '#16a34a'
});