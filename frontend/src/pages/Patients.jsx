import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Card, CardContent,
  Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, InputAdornment, LinearProgress, Menu, MenuItem,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Search, Add, FilterList, MoreVert, Visibility, Edit, Delete,
  People, Warning, CheckCircle, Close,
} from '@mui/icons-material';
import { patientAPI } from '../api/endpoints';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: '',
    race: '',
    contact: { phone: '', email: '', address: '' },
    medications: [],
  });
  const [medicationInput, setMedicationInput] = useState('');

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      showSnackbar('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async () => {
    try {
      if (!newPatient.patient_id || !newPatient.name || !newPatient.age) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }
      const patientData = { ...newPatient, age: parseInt(newPatient.age) };
      await patientAPI.create(patientData);
      showSnackbar('Patient added successfully!', 'success');
      setDialogOpen(false);
      resetForm();
      await fetchPatients();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Failed to add patient', 'error');
    }
  };

  const handlePredict = async (patientId) => {
    try {
      await patientAPI.predict(patientId);
      showSnackbar('Prediction completed!', 'success');
      await fetchPatients();
    } catch (error) {
      showSnackbar('Failed to predict risk', 'error');
    }
  };

  const handleDelete = async (patientId) => {
    try {
      await patientAPI.delete(patientId);
      showSnackbar('Patient deleted', 'success');
      await fetchPatients();
    } catch (error) {
      showSnackbar('Failed to delete patient', 'error');
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event, patient) => { setAnchorEl(event.currentTarget); setSelectedPatient(patient); };
  const handleMenuClose = () => { setAnchorEl(null); setSelectedPatient(null); };
  const showSnackbar = (message, severity = 'success') => { setSnackbar({ open: true, message, severity }); };
  const resetForm = () => {
    setNewPatient({ patient_id: '', name: '', age: '', gender: '', race: '', contact: { phone: '', email: '', address: '' }, medications: [] });
    setMedicationInput('');
  };
  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setNewPatient({ ...newPatient, medications: [...newPatient.medications, medicationInput.trim()] });
      setMedicationInput('');
    }
  };
  const handleRemoveMedication = (index) => {
    const updated = newPatient.medications.filter((_, i) => i !== index);
    setNewPatient({ ...newPatient, medications: updated });
  };

  const getRiskColor = (score) => {
    if (score > 0.7) return 'error';
    if (score > 0.4) return 'warning';
    return 'success';
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(search.toLowerCase()) ||
    patient.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading patients...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, className: 'animate-fade-in' }}>
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
          <Typography variant="h4" fontWeight={700} gutterBottom>Patients</Typography>
          <Typography variant="body2" color="textSecondary">Manage and monitor patient records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)} sx={{ bgcolor: '#0A6E5E' }}>
          Add Patient
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Patients</Typography>
                  <Typography variant="h4" fontWeight={700}>{patients.length}</Typography>
                </Box>
                <People sx={{ fontSize: 40, color: '#0A6E5E' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">High Risk</Typography>
                  <Typography variant="h4" fontWeight={700} color="error">
                    {patients.filter(p => p.risk_score > 0.7).length}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#E74C3C' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">Medium Risk</Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {patients.filter(p => p.risk_score > 0.4 && p.risk_score <= 0.7).length}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#F39C12' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">Low Risk</Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {patients.filter(p => p.risk_score <= 0.4).length}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: '#2ECC71' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Table */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search patients..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
            sx={{ minWidth: { xs: '100%', sm: 300 } }}
          />
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<FilterList />}>Filter</Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.patient_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#0A6E5E', width: 32, height: 32 }}>
                        {patient.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{patient.name}</Typography>
                        <Typography variant="caption" color="textSecondary">ID: {patient.patient_id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender || 'N/A'}</TableCell>
                  <TableCell>{patient.risk_score ? `${(patient.risk_score * 100).toFixed(1)}%` : 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={patient.risk_category || 'Unknown'} color={getRiskColor(patient.risk_score || 0)} size="small" />
                  </TableCell>
                  <TableCell>{patient.last_admission ? new Date(patient.last_admission).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, patient)}><MoreVert /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}><Visibility sx={{ mr: 1 }} /> View Details</MenuItem>
        <MenuItem onClick={() => selectedPatient && handlePredict(selectedPatient.patient_id)}>
          <Warning sx={{ mr: 1 }} /> Predict Risk
        </MenuItem>
        <MenuItem onClick={handleMenuClose}><Edit sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => selectedPatient && handleDelete(selectedPatient.patient_id)} sx={{ color: '#E74C3C' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Add Patient Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>Add New Patient</Typography>
            <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Patient ID *" value={newPatient.patient_id} onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name *" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Age *" type="number" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Gender" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} SelectProps={{ native: true }}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Race" value={newPatient.race} onChange={(e) => setNewPatient({ ...newPatient, race: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone" value={newPatient.contact.phone} onChange={(e) => setNewPatient({ ...newPatient, contact: { ...newPatient.contact, phone: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={newPatient.contact.email} onChange={(e) => setNewPatient({ ...newPatient, contact: { ...newPatient.contact, email: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" value={newPatient.contact.address} onChange={(e) => setNewPatient({ ...newPatient, contact: { ...newPatient.contact, address: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1}>
                <TextField fullWidth label="Add Medication" value={medicationInput} onChange={(e) => setMedicationInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()} />
                <Button variant="outlined" onClick={handleAddMedication} sx={{ minWidth: '80px' }}>Add</Button>
              </Box>
              <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                {newPatient.medications.map((med, index) => (
                  <Chip key={index} label={med} onDelete={() => handleRemoveMedication(index)} size="small" />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleAddPatient} variant="contained" sx={{ bgcolor: '#0A6E5E' }}>Add Patient</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Patients;