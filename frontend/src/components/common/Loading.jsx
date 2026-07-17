import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress size={60} sx={{ color: '#0A6E5E' }} />
      <Typography variant="body1" sx={{ mt: 2, color: '#5A6A7A' }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;