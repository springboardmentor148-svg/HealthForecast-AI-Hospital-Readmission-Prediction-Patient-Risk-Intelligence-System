import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Slider,
} from '@mui/material';
import {
  Security,
  Notifications,
  Language,
  Palette,
  Storage,
  Save,
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'en',
    riskThreshold: 70,
    autoRefresh: 60,
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Configure your application preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Notifications />
              <Typography variant="h6" fontWeight={600}>
                Notifications
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailAlerts}
                  onChange={(e) => handleChange('emailAlerts', e.target.checked)}
                />
              }
              label="Email Alerts"
            />
          </Paper>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Palette />
              <Typography variant="h6" fontWeight={600}>
                Appearance
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                />
              }
              label="Dark Mode"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.language}
                label="Language"
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Risk Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Security />
              <Typography variant="h6" fontWeight={600}>
                Risk Thresholds
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              High Risk Threshold: {settings.riskThreshold}%
            </Typography>
            <Slider
              value={settings.riskThreshold}
              onChange={(e, value) => handleChange('riskThreshold', value)}
              valueLabelDisplay="auto"
              min={50}
              max={90}
              step={5}
              marks={[
                { value: 50, label: '50%' },
                { value: 70, label: '70%' },
                { value: 90, label: '90%' },
              ]}
            />
          </Paper>
        </Grid>

        {/* Data Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Storage />
              <Typography variant="h6" fontWeight={600}>
                Data Settings
              </Typography>
            </Box>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Auto Refresh (seconds)</InputLabel>
              <Select
                value={settings.autoRefresh}
                label="Auto Refresh (seconds)"
                onChange={(e) => handleChange('autoRefresh', e.target.value)}
              >
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>60 seconds</MenuItem>
                <MenuItem value={120}>2 minutes</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            sx={{ mt: 2 }}
          >
            Save Settings
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;