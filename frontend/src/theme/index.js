import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0A6E5E',
      light: '#3B9A8E',
      dark: '#064A3F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5A623',
      light: '#F7C84A',
      dark: '#C47D10',
    },
    success: { main: '#2ECC71' },
    error: { main: '#E74C3C' },
    warning: { main: '#F39C12' },
    info: { main: '#3498DB' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
    text: { primary: '#1A2A3A', secondary: '#5A6A7A' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(10, 110, 94, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;