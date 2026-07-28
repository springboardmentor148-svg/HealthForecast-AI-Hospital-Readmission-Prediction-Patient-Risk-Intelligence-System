import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Avatar, Box, Typography, useMediaQuery, useTheme,
} from '@mui/material';

const getRiskColor = (score) => {
  if (score > 0.7) return 'error';
  if (score > 0.4) return 'warning';
  return 'success';
};

const PatientTable = ({ patients }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!patients || patients.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="textSecondary">No patient data available</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
          <TableRow>
            <TableCell>Patient</TableCell>
            {!isMobile && <TableCell>Age</TableCell>}
            <TableCell>Risk Score</TableCell>
            <TableCell>Risk Level</TableCell>
            {!isMobile && <TableCell>Last Admission</TableCell>}
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id || patient.patient_id} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: '#0A6E5E', width: 28, height: 28, fontSize: 12 }}>
                    {patient.name?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 100 }}>
                      {patient.name || 'Unknown'}
                    </Typography>
                    {isMobile && (
                      <Typography variant="caption" color="textSecondary">
                        {patient.age || 'N/A'} yrs
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              {!isMobile && <TableCell>{patient.age || 'N/A'}</TableCell>}
              <TableCell>
                {patient.risk_score ? `${(patient.risk_score * 100).toFixed(1)}%` : 'N/A'}
              </TableCell>
              <TableCell>
                <Chip
                  label={patient.risk_level || patient.risk_category || 'Unknown'}
                  color={getRiskColor(patient.risk_score || 0)}
                  size="small"
                  sx={{ fontWeight: 500, height: 24, fontSize: '0.7rem' }}
                />
              </TableCell>
              {!isMobile && <TableCell>
                {patient.last_admission ? new Date(patient.last_admission).toLocaleDateString() : 'N/A'}
              </TableCell>}
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2, fontSize: '0.7rem', py: 0.5 }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PatientTable;