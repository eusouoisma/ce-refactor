import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { StoreProvider, useStore } from './components/Store';
import Sidebar from './components/Sidebar';
import AppRoutes from './routes';
import { getToken } from './utils/storage';

const theme = createTheme({
  palette: {
    primary: { main: '#1a237e' },
    secondary: { main: '#e91e63' },
  },
  typography: { fontFamily: 'Roboto, sans-serif' },
});

function AppLayout() {
  const { loading } = useStore();
  const token = getToken();

  if (loading) return null;

  // On login page, no sidebar
  if (!token || window.location.pathname === '/login') {
    return <AppRoutes />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 0, minHeight: '100vh', bgcolor: '#fafafa' }}>
        <AppRoutes />
      </Box>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <StoreProvider>
          <AppLayout />
        </StoreProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
