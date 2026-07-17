import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LocalHospital,
  Security,
  Analytics,
  People,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const FeatureCard = ({ icon, title, description }) => (
  <Box textAlign="center" p={2}>
    <Box sx={{ color: '#0A6E5E', fontSize: 40 }}>{icon}</Box>
    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="textSecondary">
      {description}
    </Typography>
  </Box>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <LocalHospital sx={{ fontSize: 48 }} />
                <Typography variant="h3" fontWeight={800}>
                  HealthForecast AI
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={400} sx={{ opacity: 0.9, mb: 4 }}>
                Hospital Readmission Prediction & Patient Risk Intelligence System
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FeatureCard
                    icon={<People />}
                    title="Patient Management"
                    description="Comprehensive patient records and history"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FeatureCard
                    icon={<Analytics />}
                    title="Risk Prediction"
                    description="AI-powered readmission risk scoring"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FeatureCard
                    icon={<Security />}
                    title="Clinical Decision"
                    description="Evidence-based care recommendations"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FeatureCard
                    icon={<Analytics />}
                    title="Analytics Dashboard"
                    description="Real-time hospital performance metrics"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={24}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box textAlign="center" mb={4}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(10, 110, 94, 0.3)',
                  }}
                >
                  <LocalHospital sx={{ fontSize: 36, color: 'white' }} />
                </Box>
                <Typography variant="h5" fontWeight={700} color="primary">
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sign in to access your dashboard
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #064A3F, #2A8A7E)',
                      boxShadow: '0 4px 20px rgba(10, 110, 94, 0.4)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>

                <Box mt={3} textAlign="center">
                  <Typography variant="caption" color="textSecondary">
                    © HealthForecast AI. All rights reserved.
                  </Typography>
                </Box>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;