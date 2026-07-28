import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Alerts = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, className: 'animate-fade-in' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Alerts & Notifications</Typography>
          <Typography variant="body2" color="textSecondary">0 unread notifications</Typography>
        </Box>
        <Chip label="0 unread" color="success" />
      </Box>

      <Paper sx={{ p: 0, borderRadius: 3 }}>
        <List>
          <ListItem>
            <ListItemText primary="No notifications" secondary="You're all caught up!" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Alerts;