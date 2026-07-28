import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem, Tooltip, Badge,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Logout, Person, Settings } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ drawerWidth, handleDrawerToggle }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); navigate('/login'); };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#1A2A3A',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        height: '64px',
      }}
    >
      <Toolbar sx={{ height: '64px', minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          HealthForecast AI
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => navigate('/alerts')} size={isMobile ? 'small' : 'medium'}>
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  bgcolor: '#0A6E5E',
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36,
                  fontSize: isMobile ? 14 : 16,
                }}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              },
            }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              <Person sx={{ mr: 1.5 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <Settings sx={{ mr: 1.5 }} /> Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#E74C3C' }}>
              <Logout sx={{ mr: 1.5 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;