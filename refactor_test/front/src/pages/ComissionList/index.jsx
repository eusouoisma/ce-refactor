import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Switch, FormControlLabel, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaidIcon from '@mui/icons-material/Paid';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { getAllMonths } from '../../utils/functions';

export default function ComissionList() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [items, setItems] = useState([]);
  const months = getAllMonths();

  function load() {
    if (!activeMonths.length) return;
    fetch(`${API_URL}/comissions/list-all?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function deleteItem(id) {
    const confirm = await Swal.fire({ title: 'Excluir comissão?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/comissions/delete?id=${id}`);
    load();
  }

  async function pay(id) {
    await fetch(`${API_URL}/comissions/pay?id=${id}&lastEditBy=${userName}`);
    load();
  }

  async function unpay(id) {
    await fetch(`${API_URL}/comissions/unpay?id=${id}&lastEditBy=${userName}`);
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Comissões</Typography>
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
              <TableCell>Data Tour</TableCell><TableCell>Reserva</TableCell><TableCell>Nome</TableCell>
              <TableCell>Contato</TableCell><TableCell>Moeda</TableCell><TableCell>Valor</TableCell>
              <TableCell>Pago</TableCell><TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.tourDateFormated}</TableCell>
                <TableCell>{c.orderRef}</TableCell>
                <TableCell>{c.comissionersName}</TableCell>
                <TableCell>{c.comissionersContact}</TableCell>
                <TableCell>{c.comissionCurrency}</TableCell>
                <TableCell>{c.comissionPrice}</TableCell>
                <TableCell>{c.comissionPaid == 1 ? '✓' : ''}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-comissao?id=${c.id}`)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteItem(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                  {c.comissionPaid != 1
                    ? <IconButton size="small" color="success" onClick={() => pay(c.id)}><PaidIcon fontSize="small" /></IconButton>
                    : <IconButton size="small" color="warning" onClick={() => unpay(c.id)}><MoneyOffIcon fontSize="small" /></IconButton>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
