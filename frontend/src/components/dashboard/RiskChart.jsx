import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

  const colors = ['#2ECC71', '#2ECC71', '#2ECC71', '#F39C12', '#F39C12', '#F39C12', '#E74C3C', '#E74C3C', '#E74C3C', '#E74C3C'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
        <XAxis dataKey="range" stroke="#5A6A7A" fontSize={12} />
        <YAxis stroke="#5A6A7A" fontSize={12} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
          formatter={(value) => [value, 'Patients']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RiskChart;