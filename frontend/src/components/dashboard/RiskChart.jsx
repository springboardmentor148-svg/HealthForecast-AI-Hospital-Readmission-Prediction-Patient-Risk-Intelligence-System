import React from 'react';

const RiskChart = ({ data }) => {
  const defaultData = [
    { range: '0-10%', count: 12000 },
    { range: '10-20%', count: 18000 },
    { range: '20-30%', count: 15000 },
    { range: '30-40%', count: 12000 },
    { range: '40-50%', count: 10000 },
    { range: '50-60%', count: 8000 },
    { range: '60-70%', count: 6000 },
    { range: '70-80%', count: 4000 },
    { range: '80-90%', count: 2000 },
    { range: '90-100%', count: 1000 },
  ];

  const chartData = data?.length > 0 ? data : defaultData;
  const maxCount = Math.max(...chartData.map(d => d.count));

  const getColor = (range) => {
    const value = parseInt(range?.replace('%', '') || 0);
    if (value > 70) return '#E74C3C';
    if (value > 40) return '#F39C12';
    return '#2ECC71';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', padding: '10px 0' }}>
      {chartData.map((item, index) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        return (
          <div
            key={index}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                width: '60%',
                maxWidth: '40px',
                height: `${Math.max(percentage, 5)}%`,
                minHeight: '10px',
                backgroundColor: getColor(item.range),
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: '#5A6A7A',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.count >= 1000 ? `${(item.count / 1000).toFixed(1)}k` : item.count}
              </span>
            </div>
            <span style={{ fontSize: '9px', marginTop: '6px', color: '#5A6A7A', textAlign: 'center' }}>
              {item.range}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RiskChart;