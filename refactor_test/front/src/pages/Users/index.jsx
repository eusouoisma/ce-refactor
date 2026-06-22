import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';
import { PERMISSION_LABELS, isReadOnly } from '../../utils/permissions';

const EMPTY_USER = { username: '', name: '', permissions: '1', password: '', email: '' };

export default function Users() {
  const { userPermissions } = useStore();
  const canEdit = !isReadOnly(userPermissions);
  const isSuperAdmin = Number(userPermissions) === 4;

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

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
    if (!canEdit) return;
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
    if (!canEdit) return;
    const result = await Swal.fire({ title: 'Excluir usuário?', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' });
    if (!result.isConfirmed) return;
    await apiFetch(`/users/delete?id=${id}`);
    load();
  }

  function openEdit(row) {
    setEditUser({ id: row.id, username: row.username, name: row.name, email: row.email ?? '', permissions: String(row.permissions), password: '' });
  }

  async function saveEdit() {
    const res = await apiFetch('/users/admin-update', {
      method: 'POST',
      body: JSON.stringify(editUser),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', typeof data.error === 'string' ? data.error : 'Erro ao salvar', 'error');
    } else {
      setEditUser(null);
      load();
    }
  }

  async function toggleTwofa(id, enabled) {
    await apiFetch('/users/set-2fa', {
      method: 'POST',
      body: JSON.stringify({ id, enabled }),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, twofa_enabled: enabled } : u));
  }

  const columns = [
    { key: 'username',    label: 'Username' },
    { key: 'name',        label: 'Nome' },
    { key: 'email',       label: 'Email' },
    { key: 'permissions', label: 'Permissão', render: (val) => PERMISSION_LABELS[Number(val)] ?? val },
    ...(isSuperAdmin ? [{
      key: 'twofa_enabled',
      label: '2FA',
      render: (val, row) => (
        <Switch
          size="small"
          checked={val !== false}
          onChange={e => toggleTwofa(row.id, e.target.checked)}
          onClick={e => e.stopPropagation()}
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.primary }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: COLORS.primary } }}
        />
      ),
    }] : []),
  ];

  const rowActions = (row) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
      {isSuperAdmin && (
        <Tooltip title="Editar usuário" arrow>
          <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit(row); }}>
            <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
          </IconButton>
        </Tooltip>
      )}
      {canEdit && (
        <Tooltip title="Excluir usuário" arrow>
          <IconButton size="small" onClick={e => { e.stopPropagation(); deleteUser(row.id); }}>
            <DeleteRoundedIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">Usuários</Typography>
      </Box>

      {canEdit && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Novo Usuário</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <TextField fullWidth size="small" label="Username"
                  value={newUser.username}
                  onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth size="small" label="Nome"
                  value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth size="small" label="Email (para 2FA)"
                  value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Permissão</InputLabel>
                  <Select value={newUser.permissions} label="Permissão"
                    onChange={e => setNewUser(p => ({ ...p, permissions: e.target.value }))}>
                    {Object.entries(PERMISSION_LABELS).map(([val, label]) => (
                      <MenuItem key={val} value={val}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth size="small" label="Senha" type="password"
                  value={newUser.password}
                  onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                />
              </Grid>
              <Grid item xs={1}>
                <Button variant="contained" startIcon={<PersonAddRoundedIcon />} onClick={createUser} fullWidth>
                  Criar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Username"
                value={editUser?.username ?? ''}
                onChange={e => setEditUser(p => ({ ...p, username: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Nome"
                value={editUser?.name ?? ''}
                onChange={e => setEditUser(p => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth size="small" label="Email"
                value={editUser?.email ?? ''}
                onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Permissão</InputLabel>
                <Select value={editUser?.permissions ?? '1'} label="Permissão"
                  onChange={e => setEditUser(p => ({ ...p, permissions: e.target.value }))}>
                  {Object.entries(PERMISSION_LABELS).map(([val, label]) => (
                    <MenuItem key={val} value={val}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Nova senha (deixe vazio para não alterar)" type="password"
                value={editUser?.password ?? ''}
                onChange={e => setEditUser(p => ({ ...p, password: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
