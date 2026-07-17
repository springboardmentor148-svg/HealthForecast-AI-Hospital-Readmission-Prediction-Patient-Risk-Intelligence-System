import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics as AnalyticsIcon,
  Assessment,
  LocalHospital,
} from '@mui/icons-material';
import { analyticsAPI } from '../api/endpoints';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await analyticsAPI.getReadmissionStats();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Healthcare Analytics
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Comprehensive analytics and insights for hospital performance
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#0A6E5E10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0A6E5E',
                  }}
                >
                  <LocalHospital />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Total Patients
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    97,109
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#2ECC7110',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2ECC71',
                  }}
                >
                  <TrendingDown />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Readmission Rate
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    11.46%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#F39C1210',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F39C12',
                  }}
                >
                  <AnalyticsIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Avg Risk Score
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    32.4%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional analytics content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Treatment Effectiveness
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Medication effectiveness analysis will be displayed here
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Feature Importance
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Top features affecting readmission risk
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Readmission Trends
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monthly readmission trend analysis
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;