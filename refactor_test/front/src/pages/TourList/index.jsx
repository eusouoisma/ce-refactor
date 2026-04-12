import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Switch, FormControlLabel,
  TextField, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Checkbox, Chip, Tooltip, IconButton, Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { formatMoney, getDayName, getAllMonths } from '../../utils/functions';

const months = getAllMonths();

export default function TourList() {
  const navigate = useNavigate();
  const { userPermissions, currentYear } = useStore();
  const perm = parseInt(userPermissions);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [tours, setTours] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  function loadTours() {
    if (activeMonths.length === 0) return;
    setLoading(true);
    fetch(`${API_URL}/tours/list-all?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json())
      .then(data => { setTours(Array.isArray(data) ? data : []); setSelected([]); })
      .catch(() => setTours([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTours(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function setFilter(col, val) {
    setFilters(p => ({ ...p, [col]: val }));
  }

  const filtered = tours.filter(t => {
    return Object.entries(filters).every(([col, val]) => {
      if (!val) return true;
      const v = String(t[col] || '').toLowerCase();
      return v.includes(val.toLowerCase());
    });
  });

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function cancelTour(tour) {
    if (perm === 5) return;
    const { value: cancelReason } = await Swal.fire({
      title: 'Motivo do cancelamento', input: 'text', showCancelButton: true,
    });
    if (cancelReason === undefined) return;
    await fetch(`${API_URL}/tours/cancel?id=${tour.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason, lastEditBy: '' }),
    });
    loadTours();
  }

  async function cancelSelected() {
    if (perm === 5) return;
    const { value: cancelReason } = await Swal.fire({
      title: 'Motivo do cancelamento', input: 'text', showCancelButton: true,
    });
    if (cancelReason === undefined) return;
    await fetch(`${API_URL}/tours/cancel-multiple?ids=${selected.join(',')}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason, lastEditBy: '' }),
    });
    loadTours();
  }

  const cols = [
    { key: 'status', label: 'Status' }, { key: 'formatedTourDate', label: 'Data' },
    { key: 'tourHour', label: 'Hora' }, { key: 'activity', label: 'Atividade' },
    { key: 'adicional', label: 'Adicional' }, { key: 'paxAdult', label: 'Adulto' },
    { key: 'paxNet', label: 'NET' }, { key: 'paxBrazilian', label: 'Bras.' },
    { key: 'paxHalf', label: 'Meia' }, { key: 'paxFree', label: 'Free' },
    { key: 'language', label: 'Idioma' }, { key: 'client', label: 'Cliente' },
    { key: 'orderRef', label: 'Reserva' }, { key: 'currency', label: 'Moeda' },
    { key: 'totalValue', label: 'Valor' }, { key: 'paymentMethod', label: 'Pgto' },
    { key: 'paymentStatus', label: 'St.Pgto' }, { key: 'ceGuide', label: 'Guia CE' },
    { key: 'country', label: 'País' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Listar Tours</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <TextField size="small" label="Ano" type="number" value={year}
                onChange={e => setYear(parseInt(e.target.value))} sx={{ width: 100 }} />
            </Grid>
            {months.map(m => (
              <Grid item key={m.num}>
                <FormControlLabel
                  control={<Switch checked={activeMonths.includes(m.num)} onChange={() => toggleMonth(m.num)} size="small" />}
                  label={m.name} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {selected.length > 1 && perm !== 5 && (
        <Button variant="contained" color="error" sx={{ mb: 2 }} onClick={cancelSelected}>
          Cancelar Selecionadas ({selected.length})
        </Button>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              {cols.map(c => (
                <TableCell key={c.key}>
                  <Typography variant="caption" fontWeight="bold">{c.label}</Typography>
                  <TextField
                    size="small" variant="standard" placeholder="Filtrar"
                    onChange={e => setFilter(c.key, e.target.value)}
                    sx={{ display: 'block', mt: 0.5 }} />
                </TableCell>
              ))}
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(tour => (
              <TableRow
                key={tour.id}
                sx={{ bgcolor: selected.includes(tour.id) ? '#fff9c4' : 'inherit', cursor: 'pointer' }}
                onClick={() => toggleSelect(tour.id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(tour.id)} onChange={() => toggleSelect(tour.id)} onClick={e => e.stopPropagation()} />
                </TableCell>
                {cols.map(c => (
                  <TableCell key={c.key} sx={{ whiteSpace: 'nowrap' }}>
                    {c.key === 'totalValue' && tour.type === 'regular' ? formatMoney(tour.totalValue) :
                     c.key === 'totalValue' ? '-' :
                     String(tour[c.key] || '')}
                  </TableCell>
                ))}
                <TableCell onClick={e => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => navigate(`/editar-tour?id=${tour.id}`)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {perm !== 5 && (
                    <IconButton size="small" color="error" onClick={() => cancelTour(tour)}>
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {filtered.length} tours exibidos
      </Typography>
    </Box>
  );
}
