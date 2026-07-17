import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const MetricCard = ({ title, value, icon, color, trend, trendDirection }) => {
  const isUp = trendDirection === 'up';

  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="textSecondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `${color}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
            <Chip
              size="small"
              icon={isUp ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
              label={trend}
              color={isUp ? 'error' : 'success'}
              variant="outlined"
              sx={{ height: 24, '& .MuiChip-label': { fontSize: 12 } }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
              vs previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;