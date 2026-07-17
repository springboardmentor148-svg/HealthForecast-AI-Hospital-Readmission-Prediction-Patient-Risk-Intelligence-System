import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  People,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { patientAPI } from '../api/endpoints';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const getRiskColor = (score) => {
    if (score > 0.7) return 'error';
    if (score > 0.4) return 'warning';
    return 'success';
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(search.toLowerCase()) ||
    patient.id?.toString().includes(search)
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
            Patients
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage and monitor patient records
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />}>
            Add Patient
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Total Patients
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {patients.length}
                  </Typography>
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
                  <Typography variant="body2" color="textSecondary">
                    High Risk
                  </Typography>
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
                  <Typography variant="body2" color="textSecondary">
                    Medium Risk
                  </Typography>
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
                  <Typography variant="body2" color="textSecondary">
                    Low Risk
                  </Typography>
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
      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          mb={3}
          flexWrap="wrap"
        >
          <TextField
            placeholder="Search patients..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 300 } }}
          />
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<FilterList />}>
              Filter
            </Button>
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
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#0A6E5E', width: 32, height: 32 }}>
                        {patient.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {patient.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {patient.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender || 'N/A'}</TableCell>
                  <TableCell>{(patient.risk_score * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Chip
                      label={patient.risk_score > 0.7 ? 'High' : patient.risk_score > 0.4 ? 'Medium' : 'Low'}
                      color={getRiskColor(patient.risk_score)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{patient.last_admission || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, patient)}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: '#E74C3C' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Patients;