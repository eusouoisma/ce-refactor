import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { API_URL } from '../../utils/env';

export default function PrintList() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [hours, setHours] = useState([]);
  const [tours, setTours] = useState([]);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`${API_URL}/tours/available-hours?date=${selectedDate}&type=regular&status=Confirmado`)
      .then(r => r.json()).then(d => { setHours(Array.isArray(d) ? d : []); setSelectedHour(''); });
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || !selectedHour) return;
    fetch(`${API_URL}/tours/regular-list?date=${selectedDate}&hour=${selectedHour}`)
      .then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }, [selectedDate, selectedHour]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Imprimir Lista</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Data" type="date"
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Horário</InputLabel>
                <Select value={selectedHour} label="Horário" onChange={e => setSelectedHour(e.target.value)}>
                  {hours.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" onClick={() => window.print()}>Imprimir</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {tours.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Lista do Dia - {selectedDate} {selectedHour}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N</TableCell><TableCell>Agência/Guia</TableCell>
                <TableCell>Adulto</TableCell><TableCell>NET</TableCell><TableCell>Bras.</TableCell>
                <TableCell>Meia</TableCell><TableCell>Free</TableCell><TableCell>Total</TableCell>
                <TableCell>Nome Pax</TableCell><TableCell>Guia</TableCell>
                <TableCell>Pgto</TableCell><TableCell>Valor</TableCell>
                <TableCell>Comissão</TableCell><TableCell>St.Pgto</TableCell><TableCell>Obs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tours.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.n}</TableCell><TableCell>{t.guideAgency}</TableCell>
                  <TableCell>{t.adulto}</TableCell><TableCell>{t.net}</TableCell><TableCell>{t.brasileiro}</TableCell>
                  <TableCell>{t.meia}</TableCell><TableCell>{t.free}</TableCell><TableCell>{t.total}</TableCell>
                  <TableCell>{t.nomePax}</TableCell><TableCell>{t.guia}</TableCell>
                  <TableCell>{t.paymentMethod}</TableCell><TableCell>{t.valorTotal}</TableCell>
                  <TableCell>{t.comissao}</TableCell><TableCell>{t.statusPgto}</TableCell><TableCell>{t.obs}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2}><strong>Total</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.adulto)||0), 0)}</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.net)||0), 0)}</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.brasileiro)||0), 0)}</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.meia)||0), 0)}</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.free)||0), 0)}</strong></TableCell>
                <TableCell><strong>{tours.reduce((s, t) => s + (parseInt(t.total)||0), 0)}</strong></TableCell>
                <TableCell colSpan={7} />
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
