import React from 'react';
import PropTypes from 'prop-types';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

export default function RiskGauge({ value = 0, band = 'low', className = '' }) {
  // Map band to color code
  let bandColor = '#12B76A'; // Success / Low
  switch (band.toLowerCase()) {
    case 'high':
      bandColor = '#F97066'; // Danger
      break;
    case 'moderate':
      bandColor = '#F79009'; // Warning
      break;
    case 'low':
    default:
      bandColor = '#12B76A';
  }

  // Radial data format: value represents the gauge progress, remainder is background
  const data = [
    { name: 'gauge', value: value, fill: bandColor },
  ];

  return (
    <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="95%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: '#EAECF0' }}
            cornerRadius={6}
            dataKey="value"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center Label Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[28px] font-bold text-txt-primary leading-none">{value}%</span>
        <span className="text-[12px] uppercase tracking-wider font-bold text-txt-muted mt-1">{band} risk</span>
      </div>
    </div>
  );
}

RiskGauge.propTypes = {
  value: PropTypes.number.isRequired,
  band: PropTypes.oneOf(['high', 'moderate', 'low']),
  className: PropTypes.string,
};
