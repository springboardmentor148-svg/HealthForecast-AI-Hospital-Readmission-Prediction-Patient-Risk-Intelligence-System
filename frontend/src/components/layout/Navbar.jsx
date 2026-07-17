import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  Logout,
  Person,
  Search,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E8ECF0',
        boxShadow: 'none',
        color: '#1A2A3A',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0A6E5E, #3B9A8E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            HealthForecast AI
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            backgroundColor: '#F0F4F8',
            borderRadius: 2,
            px: 2,
            py: 0.5,
            flex: 1,
            maxWidth: 400,
          }}
        >
          <Search sx={{ color: '#5A6A7A', mr: 1 }} />
          <InputBase
            placeholder="Search patients, records..."
            fullWidth
            sx={{ '& .MuiInputBase-input': { py: 1 } }}
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Toggle theme">
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotifOpen}>
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: '#0A6E5E', width: 36, height: 36 }}>
                {user?.full_name?.charAt(0) || 'U'}
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
            <MenuItem onClick={() => { handleClose(); window.location.href = '/profile'; }}>
              <Person sx={{ mr: 2 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); window.location.href = '/settings'; }}>
              <Settings sx={{ mr: 2 }} /> Settings
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); logout(); }}>
              <Logout sx={{ mr: 2 }} /> Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 320,
                maxWidth: 400,
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              },
            }}
          >
            <MenuItem>
              <Box>
                <Typography variant="body2" fontWeight={600}>High Risk Alert</Typography>
                <Typography variant="caption" color="textSecondary">Patient #1245 needs immediate attention</Typography>
              </Box>
            </MenuItem>
            <MenuItem>
              <Box>
                <Typography variant="body2" fontWeight={600}>New Admission</Typography>
                <Typography variant="caption" color="textSecondary">Patient #1246 admitted to ICU</Typography>
              </Box>
            </MenuItem>
            <MenuItem>
              <Box>
                <Typography variant="body2" fontWeight={600}>Report Ready</Typography>
                <Typography variant="caption" color="textSecondary">Monthly analytics report generated</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;