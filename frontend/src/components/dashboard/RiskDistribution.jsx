import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const RiskDistribution = ({ data }) => {
  const categories = [
    { label: 'Low Risk', value: data?.low || 25000, color: '#2ECC71' },
    { label: 'Medium Risk', value: data?.medium || 15000, color: '#F39C12' },
    { label: 'High Risk', value: data?.high || 6170, color: '#E74C3C' },
  ];

  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <Box>
      {categories.map((category) => (
        <Box key={category.label} sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight={500}>
              {category.label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {total > 0 ? ((category.value / total) * 100).toFixed(1) : 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (category.value / total) * 100 : 0}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E8ECF0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: category.color,
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
            {category.value.toLocaleString()} patients
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default RiskDistribution;