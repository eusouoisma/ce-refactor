import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { API_URL } from '../../utils/env';
import { getAllMonths, formatMoney } from '../../utils/functions';

export default function SummaryTourList() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [tours, setTours] = useState([]);
  const [clientModal, setClientModal] = useState({ open: false, clients: [], date: '', hour: '' });
  const [editGroups, setEditGroups] = useState({});
  const months = getAllMonths();

  function load() {
    if (!activeMonths.length) return;
    fetch(`${API_URL}/tours/list-all-summary?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function showClients(tour) {
    if (tour.type !== 'regular') return;
    const res = await fetch(`${API_URL}/tours/list-clients-by-date-and-hour?date=${tour.tourDate}&hour=${tour.tourHour}`);
    const data = await res.json();
    setClientModal({ open: true, clients: data.clients || [], date: tour.tourDate, hour: tour.tourHour });
  }

  async function saveGroups(tour) {
    const groups = editGroups[tour.id] ?? tour.groups;
    await fetch(`${API_URL}/numberOfGroups/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tour.id, type: tour.type, date: tour.tourDate, hour: tour.tourHour, activity: tour.activity, groups }),
    });
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Resumo de Tours</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1} alignItems="center">
            <Grid item><TextField size="small" label="Ano" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} sx={{ width: 100 }} /></Grid>
            {months.map(m => (
              <Grid item key={m.num}>
                <FormControlLabel control={<Switch checked={activeMonths.includes(m.num)} onChange={() => toggleMonth(m.num)} size="small" />} label={m.name} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell><TableCell>Hora</TableCell><TableCell>Tipo</TableCell>
              <TableCell>Atividade</TableCell><TableCell>Duração</TableCell><TableCell>Idioma</TableCell>
              <TableCell>Guias</TableCell><TableCell>Pax</TableCell><TableCell>Grupos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tours.map((t, i) => (
              <TableRow key={i} onClick={() => showClients(t)} sx={{ cursor: t.type === 'regular' ? 'pointer' : 'default', '&:hover': { bgcolor: '#f5f5f5' } }}>
                <TableCell>{t.formatedTourDate}</TableCell>
                <TableCell>{t.tourHour}</TableCell>
                <TableCell>{t.type}</TableCell>
                <TableCell>{t.activity}</TableCell>
                <TableCell>{t.duration}</TableCell>
                <TableCell>{t.language}</TableCell>
                <TableCell>{t.guides}</TableCell>
                <TableCell>{t.paxTotal}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <TextField size="small" type="number" sx={{ width: 70 }}
                    value={editGroups[t.id] ?? t.groups ?? 0}
                    onChange={e => setEditGroups(p => ({ ...p, [t.id]: parseInt(e.target.value)||0 }))}
                    onBlur={() => saveGroups(t)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={clientModal.open} onClose={() => setClientModal({ open: false, clients: [], date: '', hour: '' })}>
        <DialogTitle>Clientes - {clientModal.date} {clientModal.hour}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Guia</TableCell><TableCell>Contato</TableCell></TableRow></TableHead>
            <TableBody>
              {clientModal.clients.map((c, i) => (
                <TableRow key={i}><TableCell>{c.client}</TableCell><TableCell>{c.companionName}</TableCell><TableCell>{c.companionContact}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setClientModal({ open: false, clients: [], date: '', hour: '' })}>Fechar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
