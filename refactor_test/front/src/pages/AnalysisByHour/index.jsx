import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, FormControlLabel, Checkbox } from '@mui/material';
import { API_URL } from '../../utils/env';

const DAYS = ['ALL', 'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export default function AnalysisByHour() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', day: 'ALL', activities: [] });
  const [availableActivities, setAvailableActivities] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/reports/available-activities`)
      .then(r => r.json()).then(d => setAvailableActivities(Array.isArray(d) ? d : []));
  }, []);

  function set(f, v) { setFilters(p => ({ ...p, [f]: v })); }

  function toggleActivity(a) {
    setFilters(p => ({
      ...p,
      activities: p.activities.includes(a) ? p.activities.filter(x => x !== a) : [...p.activities, a]
    }));
  }

  async function search() {
    const [hourRes, weekRes] = await Promise.all([
      fetch(`${API_URL}/reports/analysis-by-hour`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filters) }),
      fetch(`${API_URL}/reports/analysis-by-weekday`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filters) }),
    ]);
    const hourD = await hourRes.json();
    const weekD = await weekRes.json();
    setHourData(hourD.data || []);
    setWeekData(weekD.data || []);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Análise por Hora</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}><TextField fullWidth size="small" label="Data Inicial" type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Data Final" type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Dia da Semana</InputLabel>
                <Select value={filters.day} label="Dia da Semana" onChange={e => set('day', e.target.value)}>
                  {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {availableActivities.map(a => (
                <FormControlLabel key={a} control={<Checkbox checked={filters.activities.includes(a)} onChange={() => toggleActivity(a)} />} label={a} />
              ))}
            </Grid>
            <Grid item xs={2}><Button variant="contained" onClick={search}>Buscar</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Por Hora do Dia</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Pax Total</TableCell></TableRow></TableHead>
              <TableBody>
                {hourData.map((r, i) => (
                  <TableRow key={i}><TableCell>{r.hora}</TableCell><TableCell>{r.total}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Por Dia da Semana</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Dia</TableCell><TableCell>Pax Total</TableCell></TableRow></TableHead>
              <TableBody>
                {weekData.map((r, i) => (
                  <TableRow key={i}><TableCell>{r.dia}</TableCell><TableCell>{r.total}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
