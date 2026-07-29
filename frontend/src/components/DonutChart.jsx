import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function DonutChart({ data = [], className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #EAECF0', 
              borderRadius: '12px',
              fontSize: '12px',
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#7A5AF8'} />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

DonutChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
};
