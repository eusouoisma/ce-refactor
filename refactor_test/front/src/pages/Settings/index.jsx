import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

const SETTING_TYPES = [
  'activity', 'platform', 'language', 'status', 'currency', 'paymentMethod',
  'paymentStatus', 'local', 'guide', 'company', 'accountNumber', 'country',
];

export default function Settings() {
  const navigate = useNavigate();
  const { setCurrentYear } = useStore();
  const [settings, setSettings] = useState([]);
  const [newSetting, setNewSetting] = useState({ type: 'activity', value: '' });
  const [newYear, setNewYear] = useState('');

  function load() {
    fetch(`${API_URL}/settings/list-all`).then(r => r.json()).then(d => setSettings(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function addSetting() {
    await fetch(`${API_URL}/settings/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSetting),
    });
    setNewSetting({ type: 'activity', value: '' });
    load();
  }

  async function deleteSetting(id) {
    const confirm = await Swal.fire({ title: 'Excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/settings/delete?id=${id}`);
    load();
  }

  async function updateYear() {
    await fetch(`${API_URL}/settings/update-current-year`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newYear }),
    });
    setCurrentYear(newYear);
    Swal.fire('Ano atualizado!', '', 'success');
  }

  async function logoutAll() {
    await fetch(`${API_URL}/users/logout-all`);
    navigate('/login');
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Configurações</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Ano Fiscal</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}><TextField fullWidth size="small" label="Novo Ano" value={newYear} onChange={e => setNewYear(e.target.value)} /></Grid>
            <Grid item xs={4}><Button variant="contained" onClick={updateYear}>Atualizar Ano</Button></Grid>
            <Grid item xs={4}><Button variant="outlined" color="error" onClick={logoutAll}>Logout Todos os Usuários</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Opções do Sistema</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth size="small"><InputLabel>Tipo</InputLabel>
                <Select value={newSetting.type} label="Tipo" onChange={e => setNewSetting(p => ({ ...p, type: e.target.value }))}>
                  {SETTING_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Valor" value={newSetting.value} onChange={e => setNewSetting(p => ({ ...p, value: e.target.value }))} /></Grid>
            <Grid item xs={2}><Button variant="contained" onClick={addSetting}>Adicionar</Button></Grid>
          </Grid>
          <TableContainer component={Paper} sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow><TableCell>Tipo</TableCell><TableCell>Valor</TableCell><TableCell /></TableRow>
              </TableHead>
              <TableBody>
                {settings.filter(s => !['orderRefCount', 'CurrentYear', 'currentYear'].includes(s.type)).map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.type}</TableCell>
                    <TableCell>{s.value}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => deleteSetting(s.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
