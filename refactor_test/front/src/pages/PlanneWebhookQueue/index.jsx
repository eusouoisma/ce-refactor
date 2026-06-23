import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, Tooltip, IconButton, Divider,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { apiFetch } from '../../utils/api';
import { isReadOnly } from '../../utils/permissions';
import { useStore } from '../../components/Store';
import DataTable from '../../components/DataTable';

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function fmtMoney(val, currency) {
  if (!val) return '';
  return `${currency || 'BRL'} ${parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

const STATE_LABEL = {
  canceled:            'Cancelado',
  expired:             'Expirado',
  payment_voided:      'Pgto Cancelado',
  payment_chargeback:  'Chargeback',
  payment_complete:    'Pago',
};

const TOUR_COLUMNS = [
  { key: 'planneCode',     label: 'Reserva',     getCellSx: () => ({ fontFamily: 'monospace' }) },
  { key: 'tourDate',       label: 'Data',        render: v => fmtDate(v) },
  { key: 'tourHour',       label: 'Hora' },
  { key: 'activity',       label: 'Atividade' },
  { key: 'clientName',     label: 'Nome Cliente' },
  { key: '_paxTotal',      label: 'Pax',
    render: (_, row) => (parseInt(row.paxAdult)||0)+(parseInt(row.paxHalf)||0)+(parseInt(row.paxFree)||0)+(parseInt(row.paxNet)||0)+(parseInt(row.paxBrazilian)||0) || '' },
  { key: 'totalValue',     label: 'Valor',       render: (v, row) => fmtMoney(v, row.currency) },
  { key: 'planneSaleDate', label: 'Data Venda',  render: v => fmtDate(v) },
  { key: 'receivedAt',     label: 'Recebido em', render: v => fmtDate(v) },
];

const STATE_COLUMNS = [
  { key: 'saleId',     label: 'ID Planne',    getCellSx: () => ({ fontFamily: 'monospace' }) },
  { key: 'stateTo',    label: 'Novo Status',  render: v => STATE_LABEL[v] || v },
  { key: 'receivedAt', label: 'Recebido em',  render: v => fmtDate(v) },
];

function SectionHeader({ label, count, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>{label}</Typography>
      <Chip
        label={count}
        size="small"
        sx={{ bgcolor: color, color: '#fff', fontWeight: 700, fontSize: '0.72rem', height: 20 }}
      />
    </Box>
  );
}

export default function PlanneWebhookQueue() {
  const { userPermissions } = useStore();
  const canApply = !isReadOnly(userPermissions);

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/planne/webhook-queue')
      .then(r => r.json())
      .then(data => { setQueue(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id, action) {
    setRowLoading(p => ({ ...p, [id]: action }));
    setErrors(p => { const n = { ...p }; delete n[id]; return n; });
    try {
      const res = await apiFetch(`/planne/webhook-queue/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setErrors(p => ({ ...p, [id]: data.message }));
      } else {
        setQueue(q => q.filter(item => item.id !== id));
      }
    } catch {
      setErrors(p => ({ ...p, [id]: 'Erro de comunicação' }));
    } finally {
      setRowLoading(p => { const n = { ...p }; delete n[id]; return n; });
    }
  }

  function rowActions(row) {
    const busy = !!rowLoading[row.id];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 160 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {canApply && (
            <Button
              size="small" variant="contained" color="success"
              startIcon={<CheckRoundedIcon sx={{ fontSize: '13px !important' }} />}
              disabled={busy}
              onClick={() => act(row.id, 'apply')}
              sx={{ fontSize: '0.6rem', py: 0.3, px: 0.8, whiteSpace: 'nowrap' }}
            >
              Aplicar
            </Button>
          )}
          <Button
            size="small" variant="outlined" color="error"
            startIcon={<CloseRoundedIcon sx={{ fontSize: '13px !important' }} />}
            disabled={busy}
            onClick={() => act(row.id, 'dismiss')}
            sx={{ fontSize: '0.6rem', py: 0.3, px: 0.8, whiteSpace: 'nowrap' }}
          >
            Descartar
          </Button>
        </Box>
        {errors[row.id] && (
          <Typography sx={{ fontSize: '0.6rem', color: 'error.main' }}>{errors[row.id]}</Typography>
        )}
      </Box>
    );
  }

  const toCreate = queue
    .filter(q => q.action === 'create')
    .map(q => ({ id: q.id, receivedAt: q.receivedAt, ...(q.mappedData || {}) }));

  const toUpdate = queue
    .filter(q => q.action === 'update')
    .map(q => ({ id: q.id, receivedAt: q.receivedAt, ...(q.mappedData || {}) }));

  const toStateChange = queue
    .filter(q => q.action === 'state_change')
    .map(q => ({ id: q.id, saleId: q.saleId, stateTo: q.stateTo, receivedAt: q.receivedAt }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Importar da Planne (Webhook)</Typography>
        <Tooltip title="Recarregar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* A Criar */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader label="A Criar" count={toCreate.length} color="#00c875" />
        <DataTable
          columns={TOUR_COLUMNS}
          rows={toCreate}
          loading={loading}
          altColumns
          actions={rowActions}
          emptyMessage="Nenhum tour pendente de criação."
        />
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* A Atualizar */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader label="A Atualizar" count={toUpdate.length} color="#fdab3d" />
        <DataTable
          columns={TOUR_COLUMNS}
          rows={toUpdate}
          loading={loading}
          altColumns
          actions={rowActions}
          emptyMessage="Nenhum tour pendente de atualização."
        />
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Alterar Status */}
      <Box>
        <SectionHeader label="Alterar Status" count={toStateChange.length} color="#e2445c" />
        <DataTable
          columns={STATE_COLUMNS}
          rows={toStateChange}
          loading={loading}
          altColumns
          actions={rowActions}
          emptyMessage="Nenhuma alteração de status pendente."
        />
      </Box>
    </Box>
  );
}
