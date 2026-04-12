import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Switch, FormControlLabel, Button, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RestoreIcon from '@mui/icons-material/Restore';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { getAllMonths } from '../../utils/functions';

export default function CanceledList() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [tours, setTours] = useState([]);
  const months = getAllMonths();

  function load() {
    if (!activeMonths.length) return;
    fetch(`${API_URL}/tours/list-canceled?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function uncancel(tour) {
    await fetch(`${API_URL}/tours/uncancel?id=${tour.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastEditBy: userName }),
    });
    navigate('/listar-tours');
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Tours Cancelados</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <TextField size="small" label="Ano" type="number" value={year}
                onChange={e => setYear(parseInt(e.target.value))} sx={{ width: 100 }} />
            </Grid>
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
              <TableCell>Data</TableCell><TableCell>Hora</TableCell><TableCell>Atividade</TableCell>
              <TableCell>Cliente</TableCell><TableCell>Reserva</TableCell><TableCell>Motivo</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tours.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.formatedTourDate}</TableCell>
                <TableCell>{t.tourHour}</TableCell>
                <TableCell>{t.activity}</TableCell>
                <TableCell>{t.client}</TableCell>
                <TableCell>{t.orderRef}</TableCell>
                <TableCell>{t.cancelReason}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-tour?id=${t.id}`)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="success" onClick={() => uncancel(t)}><RestoreIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
