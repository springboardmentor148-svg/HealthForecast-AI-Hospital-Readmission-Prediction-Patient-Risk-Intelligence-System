import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Paper, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton, MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, LocalHospital } from '@mui/icons-material';
import { authAPI } from '../api/endpoints';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'doctor',
    hospital_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'hospital_admin', label: 'Hospital Administrator' },
    { value: 'researcher', label: 'Healthcare Researcher' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)' }}>
        <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h5" color="success.main">✅ Registration Successful!</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Redirecting to login...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0A6E5E 0%, #3B9A8E 40%, #87CEEB 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box textAlign="center" mb={4}>
            <LocalHospital sx={{ fontSize: 48, color: '#0A6E5E' }} />
            <Typography variant="h5" fontWeight={700} color="primary">Create Account</Typography>
            <Typography variant="body2" color="textSecondary">Sign up to access HealthForecast AI</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person color="primary" /></InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person color="primary" /></InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email color="primary" /></InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              margin="normal"
              required
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Hospital ID (Optional)"
              name="hospital_id"
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              margin="normal"
              placeholder="e.g., HOSP001"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #064A3F, #2A8A7E)',
                  boxShadow: '0 4px 20px rgba(10,110,94,0.4)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>

            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#0A6E5E', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;