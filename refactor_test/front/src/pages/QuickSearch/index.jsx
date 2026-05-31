import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Autocomplete, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { formatMoney } from '../../utils/functions';

function Indicator({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.2, fontSize: '0.92rem' }}>{value}</Typography>
    </Paper>
  );
}

export default function QuickSearch() {
  const navigate = useNavigate();
  const { userName, userPermissions } = useStore();
  const perm = parseInt(userPermissions);
  const [reserva, setReserva] = useState('');
  const [cliente, setCliente] = useState('');
  const [reservaOptions, setReservaOptions] = useState([]);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [tours, setTours] = useState([]);

  async function fetchSuggestions(r, c) {
    const res = await apiFetch('/quick-search/search', {
      method: 'POST',
      body: JSON.stringify({ reserva: r, cliente: c }),
    });
    const data = await res.json();
    setReservaOptions(data.reservas || []);
    setClienteOptions(data.clientes || []);
  }

  async function search() {
    const res = await apiFetch('/quick-search/search-tours', {
      method: 'POST',
      body: JSON.stringify({ reserva, cliente }),
    });
    const data = await res.json();
    setTours(data.tours || []);
  }

  async function cancelTour(tour) {
    if (perm === 5) return;
    const { value: cancelReason } = await Swal.fire({ title: 'Motivo', input: 'text', showCancelButton: true });
    if (cancelReason === undefined) return;
    await apiFetch(`/tours/cancel?id=${tour.id}`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason, lastEditBy: userName }),
    });
    search();
  }

  const indicators = useMemo(() => {
    let paxTotal = 0;
    const totalValueByCurrency = {};
    tours.forEach(t => {
      paxTotal += (parseInt(t.paxAdult)||0) + (parseInt(t.paxHalf)||0) + (parseInt(t.paxNet)||0) + (parseInt(t.paxFree)||0) + (parseInt(t.paxBrazilian)||0);
      if (t.currency) {
        totalValueByCurrency[t.currency] = (totalValueByCurrency[t.currency] || 0) + parseFloat(t.totalValue || 0);
      }
    });
    return { paxTotal, totalValueByCurrency };
  }, [tours]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Busca Rápida</Typography>
        {tours.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Indicator label="Pax Total" value={indicators.paxTotal} />
            {(perm === 2 || perm === 4) && Object.entries(indicators.totalValueByCurrency).map(([currency, value]) => (
              <Indicator key={currency} label={`Valor (${currency})`} value={formatMoney(value)} />
            ))}
          </Box>
        )}
      </Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={reservaOptions.map(r => r.label)} inputValue={reserva}
                onInputChange={(_, v) => { setReserva(v); fetchSuggestions(v, cliente); }}
                renderInput={p => <TextField {...p} size="small" label="Nº de Reserva" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={clienteOptions.map(c => c.label)} inputValue={cliente}
                onInputChange={(_, v) => { setCliente(v); fetchSuggestions(reserva, v); }}
                renderInput={p => <TextField {...p} size="small" label="Cliente" />} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="contained" onClick={search}>Pesquisar</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {tours.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell><TableCell>Hora</TableCell><TableCell>Atividade</TableCell>
                <TableCell>Cliente</TableCell><TableCell>Reserva</TableCell><TableCell>Pax Total</TableCell>
                <TableCell>Valor</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tours.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.dateOfRegistrationFormated}</TableCell>
                  <TableCell>{t.tourHour}</TableCell>
                  <TableCell>{t.activity}</TableCell>
                  <TableCell>{t.client}</TableCell>
                  <TableCell>{t.orderRef}</TableCell>
                  <TableCell>{t.totalPax}</TableCell>
                  <TableCell>{formatMoney(t.totalValue)}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => navigate(`/editar-tour?id=${t.id}`)}><EditIcon fontSize="small" /></IconButton>
                    {perm !== 5 && <IconButton size="small" color="error" onClick={() => cancelTour(t)}><CancelIcon fontSize="small" /></IconButton>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
