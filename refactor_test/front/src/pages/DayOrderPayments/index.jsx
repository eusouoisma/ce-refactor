import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Switch, FormControlLabel } from '@mui/material';
import { API_URL } from '../../utils/env';
import { getAllMonths, formatMoney } from '../../utils/functions';

export default function DayOrderPayments() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [payments, setPayments] = useState([]);
  const [editValue, setEditValue] = useState({});
  const [editComments, setEditComments] = useState({});
  const months = getAllMonths();

  function load() {
    if (!activeMonths.length) return;
    fetch(`${API_URL}/day-order/list-all-payments?months=${activeMonths.join(',')}&year=${year}`)
      .then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, [activeMonths, year]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function saveValue(id, val) {
    await fetch(`${API_URL}/day-order/change-individual-payment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id, paymentNewValue: val }),
    });
    load();
  }

  async function saveComments(id, val) {
    await fetch(`${API_URL}/day-order/change-individual-comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id, commentsNewValue: val }),
    });
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Pagamentos - Ordem do Dia</Typography>
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
              <TableCell>Data</TableCell><TableCell>Função</TableCell><TableCell>Funcionário</TableCell>
              <TableCell>Chegada</TableCell><TableCell>Saída</TableCell><TableCell>Atividade</TableCell>
              <TableCell>Hora Tour</TableCell><TableCell>Valor</TableCell><TableCell>Comentários</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.formatedDate}</TableCell>
                <TableCell>{p.function}</TableCell>
                <TableCell>{p.employeeName}</TableCell>
                <TableCell>{p.arrival}</TableCell>
                <TableCell>{p.departure}</TableCell>
                <TableCell>{p.activity}</TableCell>
                <TableCell>{p.tourHour}</TableCell>
                <TableCell>
                  <TextField size="small" type="number" sx={{ width: 80 }}
                    value={editValue[p.id] ?? p.value}
                    onChange={e => setEditValue(prev => ({ ...prev, [p.id]: e.target.value }))}
                    onBlur={() => saveValue(p.id, editValue[p.id] ?? p.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField size="small" sx={{ width: 150 }}
                    value={editComments[p.id] ?? p.comments}
                    onChange={e => setEditComments(prev => ({ ...prev, [p.id]: e.target.value }))}
                    onBlur={() => saveComments(p.id, editComments[p.id] ?? p.comments)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
