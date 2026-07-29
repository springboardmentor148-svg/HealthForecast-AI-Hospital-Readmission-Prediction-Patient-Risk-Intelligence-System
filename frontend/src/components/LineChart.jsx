import React from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export default function LineChart({ 
  data = [], 
  dataKey = 'value', 
  xAxisKey = 'name', 
  color = '#7A5AF8',
  className = '' 
}) {
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
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
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2.5} 
            dot={{ r: 2 }} 
            activeDot={{ r: 5 }} 
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

LineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataKey: PropTypes.string,
  xAxisKey: PropTypes.string,
  color: PropTypes.string,
  className: PropTypes.string,
};
