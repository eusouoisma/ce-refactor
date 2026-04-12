import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Button } from '@mui/material';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

export default function ComissionUpdate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { userName } = useStore();
  const [form, setForm] = useState({ orderRef: '', comissionersName: '', comissionersContact: '', comissionCurrency: '', comissionPrice: '', comissionPaid: false });
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/settings/currencies`).then(r => r.json()).then(d => setCurrencies(d.map ? d.map(x => x.value) : []));
    fetch(`${API_URL}/comissions/list-by-id?comission_id=${id}`).then(r => r.json()).then(d => {
      if (d.id) setForm({ ...d, comissionPaid: d.comissionPaid == 1 });
    });
  }, [id]);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit() {
    const res = await fetch(`${API_URL}/comissions/update?id=${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lastEditBy: userName }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', 'Erro ao salvar', 'error'); }
    else navigate('/listar-comissoes');
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Editar Comissão</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nº Reserva" value={form.orderRef} onChange={e => set('orderRef', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nome Comissionado" value={form.comissionersName} onChange={e => set('comissionersName', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Contato" value={form.comissionersContact} onChange={e => set('comissionersContact', e.target.value)} /></Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Moeda</InputLabel>
                <Select value={form.comissionCurrency} label="Moeda" onChange={e => set('comissionCurrency', e.target.value)}>
                  {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Valor" value={form.comissionPrice} onChange={e => set('comissionPrice', e.target.value)} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={!!form.comissionPaid} onChange={e => set('comissionPaid', e.target.checked)} />} label="Pago" /></Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
            <Button variant="text" onClick={() => navigate('/listar-comissoes')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
