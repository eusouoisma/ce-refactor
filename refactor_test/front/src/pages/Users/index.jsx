import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', name: '', permissions: '1', password: '' });

  function load() {
    fetch(`${API_URL}/users/list-all`).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function createUser() {
    const res = await fetch(`${API_URL}/users/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.error === true ? 'Erro' : data.error, 'error'); }
    else { setNewUser({ username: '', name: '', permissions: '1', password: '' }); load(); }
  }

  async function deleteUser(id) {
    const confirm = await Swal.fire({ title: 'Excluir usuário?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/users/delete?id=${id}`);
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Usuários</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Novo Usuário</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}><TextField fullWidth size="small" label="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Nome" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Permissão</InputLabel>
                <Select value={newUser.permissions} label="Permissão" onChange={e => setNewUser(p => ({ ...p, permissions: e.target.value }))}>
                  {[1,2,3,4,5,6].map(n => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Senha" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></Grid>
            <Grid item xs={1}><Button variant="contained" onClick={createUser}>Criar</Button></Grid>
          </Grid>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>ID</TableCell><TableCell>Username</TableCell><TableCell>Nome</TableCell><TableCell>Permissão</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.permissions}</TableCell>
                <TableCell><IconButton size="small" color="error" onClick={() => deleteUser(u.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
