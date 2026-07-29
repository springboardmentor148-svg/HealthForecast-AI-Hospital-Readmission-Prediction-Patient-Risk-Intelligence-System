import React from 'react';
import PropTypes from 'prop-types';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export default function BarChart({ 
  data = [], 
  dataKey = 'value', 
  xAxisKey = 'name', 
  color = '#7A5AF8',
  dataKeys = null,
  colors = [],
  className = '' 
}) {
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: '#667085', fontSize: 10, fontWeight: 500 }} 
            tickLine={false} 
            axisLine={{ stroke: '#EAECF0' }} 
          />
          <YAxis 
            tick={{ fill: '#667085', fontSize: 10, fontWeight: 500 }} 
            tickLine={false} 
            axisLine={{ stroke: '#EAECF0' }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #EAECF0', 
              borderRadius: '12px',
              fontSize: '12px',
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
          />
          {dataKeys && dataKeys.length > 0 ? (
            dataKeys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={colors[index] || color} 
                radius={[4, 4, 0, 0]} 
                maxBarSize={30}
              />
            ))
          ) : (
            <Bar 
              dataKey={dataKey} 
              fill={color} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={45}
            />
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataKey: PropTypes.string,
  xAxisKey: PropTypes.string,
  color: PropTypes.string,
  dataKeys: PropTypes.arrayOf(PropTypes.string),
  colors: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};
