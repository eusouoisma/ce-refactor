import React from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '../../components/Store';

export default function Default() {
  const { userName, currentYear } = useStore();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Bem-vindo, {userName}!</Typography>
      <Typography variant="body1">Ano fiscal atual: {currentYear}</Typography>
    </Box>
  );
}
