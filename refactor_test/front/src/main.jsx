import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { StoreProvider, useStore } from './components/Store';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AppRoutes from './routes';
import AiChat from './components/AiChat';
import { getToken } from './utils/storage';

import { COLORS } from './utils/colors';
export { COLORS };

const theme = createTheme({
  palette: {
    primary:    { main: COLORS.primary, dark: COLORS.primaryDark, light: COLORS.primaryLight, contrastText: '#fff' },
    secondary:  { main: '#ff3d57', contrastText: '#fff' },
    background: { default: COLORS.pageBg, paper: '#ffffff' },
    text:       { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
    error:      { main: '#e2445c' },
    success:    { main: '#00c875' },
    warning:    { main: '#fdab3d' },
    info:       { main: '#0086c0' },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.3px' },
    h5: { fontWeight: 700, letterSpacing: '-0.2px' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: COLORS.textSecondary },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.875rem' },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: `0 4px 12px ${COLORS.primaryGlow}`, bgcolor: COLORS.primaryDark },
        },
        outlinedPrimary: {
          borderColor: COLORS.primary,
          '&:hover': { bgcolor: COLORS.primaryAlpha },
        },
        textPrimary: {
          '&:hover': { bgcolor: COLORS.primaryAlpha },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        elevation2: { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            bgcolor: '#ffffff',
            '& fieldset': { borderColor: COLORS.border },
            '&:hover fieldset': { borderColor: '#c0c3d0' },
            '&.Mui-focused fieldset': { borderColor: COLORS.primary, borderWidth: 2 },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: COLORS.primary },
        },
      },
    },
    MuiSelect: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 4, fontSize: '0.78rem' },
        filled: { '& .MuiChip-label': { px: 1.5 } },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1rem', pb: 1 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", "Roboto", sans-serif',
          fontSize: '0.63rem',
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 8,
          paddingRight: 8,
          textAlign: 'center',
          color: COLORS.tableCellText,
        },
        head: {
          color: COLORS.tableHeaderText,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.14)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontFamily: '"Poppins", "Roboto", sans-serif',
          fontSize: '0.75rem',
          bgcolor: '#323338',
        },
        arrow: { color: '#323338' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: COLORS.border },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
  },
});

function AppLayout() {
  const { loading } = useStore();
  const token = getToken();

  if (loading) return null;

  if (!token || window.location.pathname === '/login') {
    return <AppRoutes />;
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: COLORS.pageBg,
      boxSizing: 'border-box',
    }}>
      <Topbar />
      <Box sx={{
        display: 'flex',
        flexGrow: 1,
        overflow: 'hidden',
        px: 1.5,
        pb: 1.5,
        gap: 1.5,
      }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            bgcolor: '#ffffff',
            borderRadius: 2.5,
            boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <AppRoutes />
        </Box>
      </Box>
      <AiChat />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <StoreProvider>
        <AppLayout />
      </StoreProvider>
    </BrowserRouter>
  </ThemeProvider>
);
