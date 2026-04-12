import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';
import { API_URL } from '../../utils/env';

export default function AnalysisByCountry() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', orderBy: 'pax', from: 0, to: 100 });
  const [data, setData] = useState([]);

  function set(f, v) { setFilters(p => ({ ...p, [f]: v })); }

  async function search() {
    const res = await fetch(`${API_URL}/reports/analysis-by-country`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });
    const d = await res.json();
    setData(Array.isArray(d) ? d : []);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Análise por País</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}><TextField fullWidth size="small" label="Data Inicial" type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Data Final" type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Ordenar</InputLabel>
                <Select value={filters.orderBy} label="Ordenar" onChange={e => set('orderBy', e.target.value)}>
                  <MenuItem value="pax">Pax</MenuItem>
                  <MenuItem value="valor">Valor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={1}><TextField fullWidth size="small" label="De" type="number" value={filters.from} onChange={e => set('from', parseInt(e.target.value)||0)} /></Grid>
            <Grid item xs={1}><TextField fullWidth size="small" label="Até" type="number" value={filters.to} onChange={e => set('to', parseInt(e.target.value)||100)} /></Grid>
            <Grid item xs={2}><Button variant="contained" onClick={search}>Buscar</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell><TableCell>País</TableCell><TableCell>Moeda</TableCell>
              <TableCell>Pax</TableCell><TableCell>% Pax</TableCell>
              <TableCell>Valor Total</TableCell><TableCell>% Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.index}</TableCell><TableCell>{r.country}</TableCell><TableCell>{r.currency}</TableCell>
                <TableCell>{r.totalPax}</TableCell><TableCell>{r.paxPercent}%</TableCell>
                <TableCell>{r.valorTotal}</TableCell><TableCell>{r.valorPercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
