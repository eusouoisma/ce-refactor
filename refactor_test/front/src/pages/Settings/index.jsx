import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Chip, Stack, Divider, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import { COLORS } from '../../utils/colors';

const GROUPS = [
  { type: 'platform',      label: 'Plataforma',             placeholder: 'Nova plataforma',        color: '#fdab3d' },
  { type: 'language',      label: 'Idioma',                 placeholder: 'Novo idioma',             color: '#0086c0' },
  { type: 'status',        label: 'Status',                 placeholder: 'Novo status',             color: '#00c875' },
  { type: 'paymentStatus', label: 'Status de Pagamento',    placeholder: 'Novo status de pagamento',color: '#a25ddc' },
  { type: 'paymentMethod', label: 'Forma de Pagamento',     placeholder: 'Nova forma de pagamento', color: '#ff642e' },
  { type: 'local',         label: 'Local',                  placeholder: 'Novo local',              color: '#16a2d7' },
  { type: 'guide',         label: 'Guia',                   placeholder: 'Novo guia',               color: '#ea4335' },
  { type: 'company',       label: 'Empresa',                placeholder: 'Nova empresa',            color: '#34a853' },
  { type: 'accountNumber', label: 'Número de Conta',        placeholder: 'Novo número de conta',    color: '#676879' },
  { type: 'country',       label: 'País',                   placeholder: 'Novo país',               color: '#4285f4' },
  { type: 'customerType', label: 'Tipo de Cliente',         placeholder: 'Novo tipo de cliente',    color: '#0086c0' },
];

const EXCLUDED_TYPES = new Set(['orderRefCount', 'CurrentYear', 'currentYear']);

function SettingSection({ group, items, onAdd, onDelete, readOnly }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (readOnly) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setSaving(true);
    await onAdd(group.type, trimmed);
    setValue('');
    setSaving(false);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 3, height: 14, bgcolor: group.color, borderRadius: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {group.label}
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
          Nenhum item cadastrado
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
          {items.map(item => (
            <Chip
              key={item.id}
              label={item.value}
              size="small"
              onDelete={readOnly ? undefined : () => onDelete(item.id, item.value)}
              deleteIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                bgcolor: '#f5f6f8',
                border: `1px solid ${COLORS.border}`,
                fontWeight: 500,
                '& .MuiChip-deleteIcon': { color: '#aaa', '&:hover': { color: '#e2445c' } },
              }}
            />
          ))}
        </Stack>
      )}

      {!readOnly && (
        <Stack direction="row" gap={1} alignItems="center">
          <TextField
            size="small"
            placeholder={group.placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            sx={{ flexGrow: 1, maxWidth: 360 }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
            onClick={handleAdd}
            disabled={saving || !value.trim()}
          >
            Adicionar
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { userPermissions } = useStore();
  const readOnly = isReadOnly(userPermissions);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/settings/list-all')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setSettings(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(async (type, value) => {
    if (readOnly) return;
    const res = await apiFetch('/settings/create', {
      method: 'POST',
      body: JSON.stringify({ type, value }),
    }).then(r => r.json()).catch(() => ({ error: true }));

    if (res.error) {
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível adicionar.' });
      return;
    }
    // Reload to get the new id
    const fresh = await apiFetch('/settings/list-all').then(r => r.json()).catch(() => null);
    if (fresh) setSettings(fresh);
  }, [readOnly]);

  const handleDelete = useCallback(async (id, label) => {
    if (readOnly) return;
    const { isConfirmed } = await Swal.fire({
      title: `Excluir "${label}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e2445c',
    });
    if (!isConfirmed) return;

    setSettings(prev => prev.filter(s => s.id !== id));
    await apiFetch(`/settings/delete?id=${id}`).catch(() => {});
  }, [readOnly]);

  async function handleLogoutAll() {
    if (readOnly) return;
    const { isConfirmed } = await Swal.fire({
      title: 'Deslogar todos os usuários?',
      text: 'Todos os usuários ativos serão desconectados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, deslogar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e2445c',
    });
    if (!isConfirmed) return;
    await apiFetch('/users/logout-all').catch(() => {});
    navigate('/login');
  }

  const itemsByType = settings.reduce((acc, s) => {
    if (EXCLUDED_TYPES.has(s.type)) return acc;
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Typography variant="subtitle2" color="text.secondary">Sistema</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Configurações</Typography>

      <Box sx={{ mb: 3 }}>
        {!readOnly && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutAll}
          >
            Deslogar todos os usuários
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {GROUPS.map(group => (
            <SettingSection
              key={group.type}
              group={group}
              items={itemsByType[group.type] || []}
              onAdd={handleAdd}
              onDelete={handleDelete}
              readOnly={readOnly}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
