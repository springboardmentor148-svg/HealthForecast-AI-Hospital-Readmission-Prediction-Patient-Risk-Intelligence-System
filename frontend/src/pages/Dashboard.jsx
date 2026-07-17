import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Warning,
  CheckCircle,
  Schedule,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  LocalHospital,
  Refresh,
  Download,
} from '@mui/icons-material';
import { analyticsAPI } from '../api/endpoints';
import MetricCard from '../components/dashboard/MetricCard';
import RiskChart from '../components/dashboard/RiskChart';
import RiskDistribution from '../components/dashboard/RiskDistribution';
import PatientTable from '../components/dashboard/PatientTable';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  const metrics = data?.metrics || {
    totalPatients: 97109,
    readmissionRate: 0.1146,
    highRiskPatients: 6170,
    avgRiskScore: 0.32,
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Healthcare Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time patient readmission risk monitoring and analytics
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            size="small"
          >
            Export Report
          </Button>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Last 7 days</MenuItem>
            <MenuItem onClick={handleMenuClose}>Last 30 days</MenuItem>
            <MenuItem onClick={handleMenuClose}>Last 90 days</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Patients"
            value={metrics.totalPatients.toLocaleString()}
            icon={<People />}
            color="#0A6E5E"
            trend="+12.5%"
            trendDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Readmission Rate"
            value={`${(metrics.readmissionRate * 100).toFixed(1)}%`}
            icon={<TrendingDown />}
            color="#2ECC71"
            trend="-2.3%"
            trendDirection="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="High Risk Patients"
            value={metrics.highRiskPatients.toLocaleString()}
            icon={<Warning />}
            color="#E74C3C"
            trend="+5.2%"
            trendDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Avg Risk Score"
            value={`${(metrics.avgRiskScore * 100).toFixed(1)}%`}
            icon={<TrendingUp />}
            color="#F39C12"
            trend="-1.8%"
            trendDirection="down"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Risk Score Distribution
              </Typography>
              <Chip label="Last 30 days" size="small" variant="outlined" />
            </Box>
            <RiskChart data={data?.riskDistribution || []} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Risk Categories
            </Typography>
            <RiskDistribution data={data?.riskCategories || { low: 25000, medium: 15000, high: 6170 }} />
            
            <Box mt={3}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button variant="outlined" fullWidth startIcon={<People />}>
                  View All Patients
                </Button>
                <Button variant="outlined" fullWidth startIcon={<Warning />}>
                  High Risk Patients
                </Button>
                <Button variant="contained" fullWidth startIcon={<Schedule />}>
                  Generate Report
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Patient Table */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Recent Patients
          </Typography>
          <Button size="small" variant="outlined">
            View All
          </Button>
        </Box>
        <PatientTable patients={data?.recentPatients || []} />
      </Paper>
    </Box>
  );
};

export default Dashboard;