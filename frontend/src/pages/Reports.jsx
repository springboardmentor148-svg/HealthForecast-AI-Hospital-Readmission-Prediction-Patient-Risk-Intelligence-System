import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert
} from '@mui/material';
import {
  Download, Visibility, Assessment, CheckCircle, Pending,
  PictureAsPdf, TableChart
} from '@mui/icons-material';
import api from '../api';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [reports, setReports] = useState([
    { id: 1, name: 'Monthly Readmission Report', type: 'Readmission', date: '2024-01-15', status: 'completed', size: '2.4 MB' },
    { id: 2, name: 'Patient Risk Assessment', type: 'Risk Analysis', date: '2024-01-14', status: 'pending', size: '1.8 MB' },
  ]);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/reports/generate/pdf');
      setSnackbar({ open: true, message: 'PDF Report generated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
    }
    setLoading(false);
  };

  const generateExcel = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/reports/generate/excel');
      setSnackbar({ open: true, message: 'Excel Report generated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate Excel', severity: 'error' });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Generating report...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Reports</Typography>
          <Typography variant="body2" color="textSecondary">Generate and manage healthcare analytics reports</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<PictureAsPdf />} onClick={generatePDF} sx={{ bgcolor: '#E74C3C' }}>
            PDF Report
          </Button>
          <Button variant="contained" startIcon={<TableChart />} onClick={generateExcel} sx={{ bgcolor: '#2ECC71' }}>
            Excel Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Total Reports</Typography>
              <Typography variant="h4" fontWeight={700}>{reports.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Completed</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {reports.filter(r => r.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>Report History</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{report.name}</Typography></TableCell>
                  <TableCell><Chip label={report.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    <Chip
                      icon={report.status === 'completed' ? <CheckCircle /> : <Pending />}
                      label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      color={report.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"><Visibility /></IconButton>
                    <IconButton size="small"><Download /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;