import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const drawerWidth = 280;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} />
      <Sidebar drawerWidth={drawerWidth} mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      
      {/* ====== CHANGED HERE ====== */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,               // <--- CHANGED: Set padding to 0
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // ml: { sm: `${drawerWidth}px` },
          mt: '0px',
          bgcolor: '#F0F4F8',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ mt: 2 }}>  {/* Keeps a small top margin between navbar and content */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;