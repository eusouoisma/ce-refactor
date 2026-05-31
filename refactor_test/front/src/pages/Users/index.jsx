import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Tooltip,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const makeActions = (deleteUser) => (row) => (
  <Tooltip title="Excluir usuário" arrow>
    <IconButton size="small" onClick={e => { e.stopPropagation(); deleteUser(row.id); }}>
      <DeleteRoundedIcon fontSize="small" color="error" />
    </IconButton>
  </Tooltip>
);

const COLUMNS = (rowActions) => [
  { key: '_actions',    label: 'Ações',     render: (_, row) => rowActions(row) },
  { key: 'id',          label: 'ID' },
  { key: 'username',    label: 'Username' },
  { key: 'name',        label: 'Nome' },
  { key: 'permissions', label: 'Permissão' },
];

const EMPTY_USER = { username: '', name: '', permissions: '1', password: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/users/list-all')
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createUser() {
    const res = await apiFetch('/users/create', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.error === true ? 'Erro ao criar usuário' : data.error, 'error');
    } else {
      setNewUser(EMPTY_USER);
      load();
    }
  }

  async function deleteUser(id) {
    const result = await Swal.fire({ title: 'Excluir usuário?', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' });
    if (!result.isConfirmed) return;
    await apiFetch(`/users/delete?id=${id}`);
    load();
  }

  const rowActions = makeActions(deleteUser);
  const columns = COLUMNS(rowActions);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">Usuários</Typography>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Novo Usuário</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <TextField fullWidth size="small" label="Username"
                value={newUser.username}
                onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth size="small" label="Nome"
                value={newUser.name}
                onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Permissão</InputLabel>
                <Select value={newUser.permissions} label="Permissão"
                  onChange={e => setNewUser(p => ({ ...p, permissions: e.target.value }))}>
                  {[1,2,3,4,5,6].map(n => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth size="small" label="Senha" type="password"
                value={newUser.password}
                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
              />
            </Grid>
            <Grid item xs={1}>
              <Button
                variant="contained"
                startIcon={<PersonAddRoundedIcon />}
                onClick={createUser}
                fullWidth
              >
                Criar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        altColumns
        actions={rowActions}
        emptyMessage="Nenhum usuário encontrado."
      />

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${users.length} usuário${users.length !== 1 ? 's' : ''}`}
        </Typography>
      </Box>
    </Box>
  );
}
