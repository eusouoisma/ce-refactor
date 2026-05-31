import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button } from '@mui/material';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';

export default function MyUser() {
  const { userName } = useStore();
  const [form, setForm] = useState({ username: '', name: '', password: '' });

  async function handleSubmit() {
    const res = await apiFetch('/users/update', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.error === true ? 'Erro' : data.error, 'error'); }
    else { Swal.fire('Salvo!', '', 'success'); }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Meu Usuário</Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Nova Senha (opcional)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
