import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Tooltip, IconButton,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const STATE_CHIP = {
  Pago:     { color: 'success' },
  Pendente: { color: 'warning' },
  Criado:   { color: 'default' },
};

const STATUS_STYLE = {
  importing: { bgcolor: '#fdab3d', label: 'Importando...',    spinner: true  },
  done:      { bgcolor: '#00c875', label: '✓ Importado',       spinner: false },
  error:     { bgcolor: '#e2445c', label: '✗ Erro ao importar', spinner: false },
};

function fmtDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}/${iso.split('-')[0]}`;
}

function fmtMoney(val, currency) {
  if (!val) return '';
  return `${currency || 'BRL'} ${parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function emptyDash(value) {
  return value ? value : <em style={{ color: '#bbb' }}>—</em>;
}

const COLUMNS = [
  { key: 'tourDate', label: 'Data', render: (v) => fmtDate(v) },
  { key: 'tourHour', label: 'Hora' },
  { key: 'duration', label: 'Duração', render: (v) => emptyDash(v) },
  {
    key: 'type',
    label: 'Tipo',
    render: (v) => (
      <Chip
        label={v === 'regular' ? 'Regular' : 'Privativo'}
        size="small"
        sx={{
          fontSize: '0.58rem', height: 18,
          bgcolor: v === 'regular' ? '#ff642e22' : '#a25ddc22',
          color: v === 'regular' ? '#ff642e' : '#a25ddc',
          fontWeight: 600,
        }}
      />
    ),
  },
  { key: 'activity', label: 'Atividade', render: (v) => <Box component="span" sx={{ fontWeight: 600 }}>{emptyDash(v)}</Box> },
  { key: 'language', label: 'Idioma' },
  { key: 'client', label: 'Cliente' },
  { key: 'clientName', label: 'Nome do cliente' },
  { key: 'clientContact', label: 'Contato' },
  { key: 'country', label: 'País', render: (v) => v?.[0] || '' },
  ...['paxAdult', 'paxHalf', 'paxFree', 'paxNet', 'paxBrazilian'].map((key) => ({
    key,
    label: key === 'paxAdult' ? 'Ad' : key === 'paxHalf' ? 'Meia' : key === 'paxFree' ? 'Free' : key === 'paxNet' ? 'NET' : 'Bras.',
    render: (v) => (v > 0 ? v : <span style={{ color: '#ccc' }}>—</span>),
  })),
  { key: 'totalValue', label: 'Valor', render: (v, row) => fmtMoney(v, row.currency) },
  {
    key: 'paymentStatus',
    label: 'Status',
    render: (v) => (
      <Chip
        label={v}
        size="small"
        color={STATE_CHIP[v]?.color || 'default'}
        sx={{ fontSize: '0.58rem', height: 18 }}
      />
    ),
  },
  {
    key: 'planneCode',
    label: 'Reserva',
    getCellSx: () => ({ fontFamily: 'monospace' }),
  },
];

export default function PlanneTourImport() {
  const navigate = useNavigate();
  const { userName, userPermissions } = useStore();
  const canImport = !isReadOnly(userPermissions);

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [rowStatus, setRowStatus] = useState({});
  const [batchImporting, setBatchImporting] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    setSelected([]);
    setRowStatus({});
    apiFetch('/planne/available-tours')
      .then(r => r.json())
      .then(data => { setTours(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Erro ao buscar tours da Planne. Tente novamente.'); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const tableRows = useMemo(
    () => tours
      .filter(t => !rowStatus[t.planneId])
      .map(t => ({ ...t, id: t.planneId })),
    [tours, rowStatus],
  );

  const statusRows = useMemo(
    () => tours.filter(t => rowStatus[t.planneId]),
    [tours, rowStatus],
  );

  function handleImport(tour) {
    const { planneId, planneCode, planneState, createdAt, ...tourFields } = tour;
    navigate('/cadastrar-tour', { state: { planneId, planneData: tourFields } });
  }

  async function importSelected() {
    if (!canImport) return;
    const toImport = tours.filter(t => selected.includes(t.planneId));
    if (!toImport.length) return;
    setBatchImporting(true);

    for (const tour of toImport) {
      const { planneId, planneCode, planneState, createdAt, ...tourFields } = tour;
      setRowStatus(prev => ({ ...prev, [planneId]: 'importing' }));

      try {
        const payload = {
          ...tourFields,
          country: Array.isArray(tourFields.country) ? tourFields.country.join(', ') : (tourFields.country || ''),
          ceGuide: [],
          commissioned: false,
          isHighSeason: false,
          numberOfGroups: 0,
          dateOfRegistration: new Date().toISOString().split('T')[0],
          createdBy: userName,
          lastEditBy: userName,
          planneId,
        };
        const res = await apiFetch('/tours/create', { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        setRowStatus(prev => ({ ...prev, [planneId]: data.error ? 'error' : 'done' }));
      } catch {
        setRowStatus(prev => ({ ...prev, [planneId]: 'error' }));
      }
    }

    setBatchImporting(false);
    setSelected([]);
    setTimeout(() => load(), 2000);
  }

  const rowActions = (row) => (
    <Button
      size="small"
      variant="outlined"
      startIcon={<FileDownloadRoundedIcon sx={{ fontSize: '14px !important' }} />}
      onClick={() => handleImport(row)}
      disabled={batchImporting}
      sx={{ fontSize: '0.6rem', py: 0.3, px: 1, whiteSpace: 'nowrap' }}
    >
      Revisar
    </Button>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
        <Typography variant="h5">Importar Tours da Planne</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {selected.length > 0 && !batchImporting && canImport && (
            <Button
              variant="contained"
              startIcon={<FileDownloadRoundedIcon />}
              onClick={importSelected}
              sx={{ fontSize: '0.78rem' }}
            >
              Importar selecionados ({selected.length})
            </Button>
          )}
          <Tooltip title="Recarregar">
            <span>
              <IconButton onClick={load} disabled={loading || batchImporting}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2, fontSize: '0.85rem' }}>{error}</Typography>
      )}

      {statusRows.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
          {statusRows.map(t => {
            const status = rowStatus[t.planneId];
            const { bgcolor, label } = STATUS_STYLE[status];
            return (
              <Box
                key={t.planneId}
                sx={{
                  px: 2, py: 0.75, borderRadius: 1.5,
                  bgcolor, color: '#fff', fontWeight: 700, fontSize: '0.7rem',
                }}
              >
                {t.planneCode} — {label}
              </Box>
            );
          })}
        </Box>
      )}

      <DataTable
        columns={COLUMNS}
        rows={tableRows}
        loading={loading}
        altColumns
        selectable
        selected={selected}
        onSelectChange={setSelected}
        actions={rowActions}
        emptyMessage="Nenhum tour pendente de importação."
      />

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading
            ? 'Carregando...'
            : `${tours.length} tour${tours.length !== 1 ? 's' : ''} disponíve${tours.length !== 1 ? 'is' : 'l'}${selected.length > 0 ? ` · ${selected.length} selecionado${selected.length !== 1 ? 's' : ''}` : ''}`}
        </Typography>
      </Box>
    </Box>
  );
}
