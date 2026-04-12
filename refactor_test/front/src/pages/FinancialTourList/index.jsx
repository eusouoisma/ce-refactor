import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Switch, FormControlLabel, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { getAllMonths, formatMoney } from '../../utils/functions';

export default function FinancialTourList() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [tours, setTours] = useState([]);
  const months = getAllMonths();

  function load() {
    if (!activeMonths.length) return;
    fetch(`${API_URL}/tours/list-all-financial?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json()).then(d => setTours(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function markLateCheck(tour) {
    await fetch(`${API_URL}/tours/mark-as-late-check?id=${tour.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastEditBy: userName }),
    });
    load();
  }

  async function cancelTour(tour) {
    const { value: cancelReason } = await Swal.fire({ title: 'Motivo do cancelamento', input: 'text', showCancelButton: true });
    if (cancelReason === undefined) return;
    await fetch(`${API_URL}/tours/cancel?id=${tour.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason, lastEditBy: userName }),
    });
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Tours Financeiros</Typography>
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
      <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell><TableCell>Hora</TableCell><TableCell>Atividade</TableCell>
              <TableCell>Cliente</TableCell><TableCell>Reserva</TableCell><TableCell>Empresa</TableCell>
              <TableCell>Fatura</TableCell><TableCell>Conta</TableCell><TableCell>Data Pgto</TableCell>
              <TableCell>Moeda</TableCell><TableCell>Valor</TableCell><TableCell>Líquido</TableCell>
              <TableCell>Late Check</TableCell><TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tours.map(t => (
              <TableRow key={t.id} sx={{ bgcolor: t.lateCheck == 1 ? '#fff9c4' : 'inherit' }}>
                <TableCell>{t.formatedTourDate}</TableCell>
                <TableCell>{t.tourHour}</TableCell>
                <TableCell>{t.activity}</TableCell>
                <TableCell>{t.client}</TableCell>
                <TableCell>{t.orderRef}</TableCell>
                <TableCell>{t.company}</TableCell>
                <TableCell>{t.invoiceNumber}</TableCell>
                <TableCell>{t.accountNumber}</TableCell>
                <TableCell>{t.formatedPaymentDate}</TableCell>
                <TableCell>{t.currency}</TableCell>
                <TableCell>{formatMoney(t.totalValue)}</TableCell>
                <TableCell>{formatMoney(t.netValue)}</TableCell>
                <TableCell>{t.lateCheck == 1 ? '✓' : ''}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-tour-financeiro?id=${t.id}`)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => cancelTour(t)}><CancelIcon fontSize="small" /></IconButton>
                  {t.lateCheck != 1 && <IconButton size="small" color="warning" onClick={() => markLateCheck(t)}><CheckIcon fontSize="small" /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
