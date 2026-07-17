import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Download,
  Visibility,
  Assessment,
  Schedule,
  CheckCircle,
  Pending,
} from '@mui/icons-material';

const Reports = () => {
  const [loading, setLoading] = useState(false);

  const reports = [
    {
      id: 1,
      name: 'Monthly Readmission Report',
      type: 'Readmission',
      date: '2024-01-15',
      status: 'completed',
      size: '2.4 MB',
    },
    {
      id: 2,
      name: 'Patient Risk Assessment',
      type: 'Risk Analysis',
      date: '2024-01-14',
      status: 'pending',
      size: '1.8 MB',
    },
    {
      id: 3,
      name: 'Treatment Effectiveness',
      type: 'Treatment',
      date: '2024-01-13',
      status: 'completed',
      size: '3.1 MB',
    },
    {
      id: 4,
      name: 'Hospital Performance Metrics',
      type: 'Performance',
      date: '2024-01-12',
      status: 'failed',
      size: '0 MB',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Pending />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Generate and manage healthcare analytics reports
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Assessment />}>
          Generate Report
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Reports
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {reports.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Completed
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {reports.filter(r => r.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Pending
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {reports.filter(r => r.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Failed
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {reports.filter(r => r.status === 'failed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reports Table */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Report History
          </Typography>
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small">
              Filter
            </Button>
            <Button variant="outlined" size="small">
              Export All
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date Generated</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {report.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(report.status)}
                      label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Reports;