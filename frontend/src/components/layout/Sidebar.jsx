import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  People,
  Analytics,
  Assessment,
  Settings,
  Logout,
  LocalHospital,
  Notifications,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#0A6E5E' },
  { text: 'Patients', icon: <People />, path: '/patients', color: '#3498DB' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics', color: '#9B59B6' },
  { text: 'Reports', icon: <Assessment />, path: '/reports', color: '#F39C12' },
  { text: 'Alerts', icon: <Notifications />, path: '/alerts', color: '#E74C3C' },
  { text: 'Settings', icon: <Settings />, path: '/settings', color: '#2C3E50' },
];

const quickActions = [
  { text: 'High Risk Patients', icon: <Warning />, color: '#E74C3C' },
  { text: 'Schedule Follow-up', icon: <Schedule />, color: '#F39C12' },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerWidth = 280;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
          color: 'white',
          py: 2,
          minHeight: 100,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <LocalHospital sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              HealthForecast
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              AI Intelligence System
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            margin: '0 auto',
            bgcolor: '#0A6E5E',
            fontSize: 28,
          }}
        >
          {user?.full_name?.charAt(0) || 'U'}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
          {user?.full_name || 'Administrator'}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {user?.role || 'Healthcare Administrator'}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  background: location.pathname === item.path ? 'linear-gradient(135deg, #0A6E5E, #3B9A8E)' : '#F0F4F8',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: item.color }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="textSecondary" sx={{ px: 2, display: 'block', mb: 1 }}>
          Quick Actions
        </Typography>
        {quickActions.map((action) => (
          <ListItem key={action.text} disablePadding>
            <ListItemButton
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': { background: '#F0F4F8' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: action.color }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText primary={action.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <List sx={{ px: 1, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => { logout(); navigate('/login'); }}
            sx={{
              borderRadius: 2,
              '&:hover': { background: '#FEE2E2' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#E74C3C' }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '2px 0 20px rgba(0,0,0,0.05)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;