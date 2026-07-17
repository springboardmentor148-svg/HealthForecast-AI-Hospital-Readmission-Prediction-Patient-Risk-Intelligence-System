import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
  Box,
  Typography,
} from '@mui/material';

const getRiskColor = (score) => {
  if (score > 0.7) return 'error';
  if (score > 0.4) return 'warning';
  return 'success';
};

const getRiskLabel = (score) => {
  if (score > 0.7) return 'High';
  if (score > 0.4) return 'Medium';
  return 'Low';
};

const PatientTable = ({ patients }) => {
  if (!patients || patients.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="textSecondary">
          No patient data available
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="medium">
        <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Risk Score</TableCell>
            <TableCell>Risk Level</TableCell>
            <TableCell>Last Admission</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map((patient) => (
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
              <TableCell>{(patient.risk_score * 100).toFixed(1)}%</TableCell>
              <TableCell>
                <Chip
                  label={getRiskLabel(patient.risk_score)}
                  color={getRiskColor(patient.risk_score)}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </TableCell>
              <TableCell>{patient.last_admission}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
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