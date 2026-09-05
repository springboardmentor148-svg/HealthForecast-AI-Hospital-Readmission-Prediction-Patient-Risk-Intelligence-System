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
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="textSecondary" fontWeight={500} fontSize={{ xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} fontSize={{ xs: '1.5rem', sm: '2rem', md: '2.125rem' }} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 },
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
          <Box display="flex" alignItems="center" sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              icon={isUp ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
              label={trend}
              color={isUp ? 'error' : 'success'}
              variant="outlined"
              sx={{
                height: 20,
                '& .MuiChip-label': { fontSize: { xs: 10, sm: 11, md: 12 } },
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1, fontSize: { xs: 9, sm: 10, md: 11 } }}>
              vs previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;