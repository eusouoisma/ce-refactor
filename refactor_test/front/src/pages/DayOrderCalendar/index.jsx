import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';
import { API_URL } from '../../utils/env';

// Note: DayOrderCalendar exists but was not registered in original Root.jsx (RN-041)
export default function DayOrderCalendar() {
  const [date, setDate] = useState('');
  const [tours, setTours] = useState([]);

  async function load() {
    if (!date) return;
    const res = await fetch(`${API_URL}/day-order/list-tours-by-date?date=${date}`);
    const data = await res.json();
    setTours(data.data || []);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Calendário de Ordens do Dia</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size="small" label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={load}>Buscar</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hora</TableCell><TableCell>Tipo</TableCell><TableCell>Atividade</TableCell>
              <TableCell>Idioma</TableCell><TableCell>Guias</TableCell><TableCell>Pax</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tours.map((t, i) => (
              <TableRow key={i}>
                <TableCell>{t.tourHour}</TableCell><TableCell>{t.type}</TableCell>
                <TableCell>{t.activity}</TableCell><TableCell>{t.language}</TableCell>
                <TableCell>{t.guides}</TableCell><TableCell>{t.paxTotal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
