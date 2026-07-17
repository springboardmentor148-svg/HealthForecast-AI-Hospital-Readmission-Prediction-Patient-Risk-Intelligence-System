import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  TextField,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
} from '@mui/icons-material';

const Profile = () => {
  const user = {
    name: 'Dr. Trupti Sawarkar',
    email: 'trupti.sawarkar@healthforecast.ai',
    role: 'Healthcare Administrator',
    department: 'Clinical Analytics',
    location: 'Mumbai, India',
    phone: '+91 98765 43210',
    joined: 'January 2024',
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Profile
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Manage your account settings and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 16px',
                  bgcolor: '#0A6E5E',
                  fontSize: 48,
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user.name}
              </Typography>
              <Chip
                label={user.role}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
              <Box mt={2}>
                <Button variant="outlined" startIcon={<Edit />} fullWidth>
                  Edit Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Personal Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={user.name}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={user.phone}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={user.department}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={user.location}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />}>
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;