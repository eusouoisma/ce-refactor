import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Chip, IconButton, Tooltip, Button, CircularProgress,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { getAllMonths } from '../../utils/functions';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const PAGE_SIZE = 80;
const MONTHS = getAllMonths();

const makeActions = (navigate, uncancel) => (row) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <Tooltip title="Editar" arrow>
      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/editar-tour?id=${row.id}`); }}>
        <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
      </IconButton>
    </Tooltip>
    <Tooltip title="Restaurar tour" arrow>
      <IconButton size="small" onClick={e => { e.stopPropagation(); uncancel(row); }}>
        <RestoreRoundedIcon fontSize="small" color="success" />
      </IconButton>
    </Tooltip>
  </Box>
);

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const COLUMNS = (rowActions) => [
  { key: '_actions',            label: 'Ações',                     render: (_, row) => rowActions(row) },
  { key: 'status',              label: 'Status' },
  { key: 'formatedTourDate',    label: 'Data' },
  { key: '_dia',                label: 'Dia',                       render: (_, row) => row.tourDate ? DAYS[new Date(String(row.tourDate).split('T')[0] + 'T00:00:00').getUTCDay()] : '' },
  { key: 'tourHour',            label: 'Horário' },
  { key: 'activity',            label: 'Atividade' },
  { key: 'paxAdult',            label: 'Adulto' },
  { key: 'paxNet',              label: 'NET' },
  { key: 'paxHalf',             label: 'Meia' },
  { key: 'paxFree',             label: 'Free' },
  { key: '_total',              label: 'Total',                     render: (_, row) => (parseInt(row.paxAdult)||0) + (parseInt(row.paxNet)||0) + (parseInt(row.paxHalf)||0) + (parseInt(row.paxFree)||0) + (parseInt(row.paxBrazilian)||0) },
  { key: 'numberOfGroups',      label: 'Nº Grupos' },
  { key: 'language',            label: 'Idioma' },
  { key: 'client',              label: 'Cliente' },
  { key: 'orderRef',            label: 'Nº Reserva' },
  { key: 'ceGuide',             label: 'Guia CE' },
  { key: 'currency',            label: 'Moeda' },
  { key: 'totalValue',          label: 'Valor' },
  { key: 'paymentMethod',       label: 'Pagamento' },
  { key: 'clientName',          label: 'Nome Cliente' },
  { key: 'clientContact',       label: 'Contato Cliente' },
  { key: 'companionName',       label: 'Nome Guia' },
  { key: 'companionContact',    label: 'Contato Guia' },
  { key: 'local',               label: 'Local' },
  { key: 'platform',            label: 'Plataforma' },
  { key: 'emailSubject',        label: 'Nome Email' },
  { key: 'commissioned',        label: 'Comissão',                  render: val => val == 1 ? 'Sim' : 'Não' },
  { key: 'comments',            label: 'Obs' },
  { key: 'conversationHistory', label: 'Histórico da Conversa' },
  { key: 'country',             label: 'País' },
  { key: 'formatedTourDate',    label: 'Data do Registro',          render: (_, row) => row.dateOfRegistration ? new Date(row.dateOfRegistration).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '' },
  { key: 'cancelReason',        label: 'Motivo de Cancelamento' },
  { key: 'createdBy',           label: 'Criado por' },
  { key: 'lastEditBy',          label: 'Editado por último por' },
];

export default function CanceledList() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const tableRef = useRef(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
  const [tours, setTours] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadMoreRef = useRef(false);
  const fetchGenRef = useRef(0);

  const fetchFirstPage = useCallback(async () => {
    if (!activeMonths.length) { setTours([]); setTotal(0); return; }
    const gen = ++fetchGenRef.current;
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    try {
      const data = await apiFetch(
        `/tours/list-canceled?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=0`
      ).then(r => r.json());
      if (fetchGenRef.current !== gen) return;
      const arr = Array.isArray(data.rows) ? data.rows : [];
      setTours(arr);
      setTotal(data.total || 0);
      offsetRef.current = arr.length;
      hasMoreRef.current = arr.length < (data.total || 0);
    } catch {
      if (fetchGenRef.current !== gen) return;
      setTours([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeMonths, year]);

  const loadMore = useCallback(() => {
    if (loadMoreRef.current || !hasMoreRef.current) return;
    loadMoreRef.current = true;
    setLoadingMore(true);
    const gen = fetchGenRef.current;
    apiFetch(`/tours/list-canceled?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`)
      .then(r => r.json())
      .then(data => {
        if (fetchGenRef.current !== gen) return;
        const arr = Array.isArray(data.rows) ? data.rows : [];
        setTours(prev => [...prev, ...arr]);
        offsetRef.current += arr.length;
        hasMoreRef.current = offsetRef.current < (data.total || 0);
      })
      .catch(() => {})
      .finally(() => { loadMoreRef.current = false; setLoadingMore(false); });
  }, [activeMonths, year]);

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  async function uncancel(tour) {
    await apiFetch(`/tours/uncancel?id=${tour.id}`, {
      method: 'POST',
      body: JSON.stringify({ lastEditBy: userName }),
    });
    navigate('/listar-tours');
  }

  const rowActions = makeActions(navigate, uncancel);
  const columns = COLUMNS(rowActions);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">Tours Cancelados</Typography>
        <DownloadTableExcel filename="tours-cancelados" sheet="cancelados" currentTableRef={tableRef.current}>
          <Button size="small" variant="outlined" sx={{ fontSize: '0.78rem' }}>Exportar Excel</Button>
        </DownloadTableExcel>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <TextField
                size="small" label="Ano" type="number" value={year}
                onChange={e => setYear(parseInt(e.target.value) || year)}
                sx={{ width: 90 }} inputProps={{ min: 2020, max: 2050 }}
              />
            </Grid>
            <Grid item>
              <Box sx={{ width: 1, height: 28, borderLeft: '1px solid rgba(0,0,0,0.12)', mx: 0.5 }} />
            </Grid>
            {MONTHS.map(m => (
              <Grid item key={m.num}>
                <Chip
                  label={m.name} size="small" onClick={() => toggleMonth(m.num)}
                  sx={{
                    fontWeight: activeMonths.includes(m.num) ? 700 : 400,
                    bgcolor: activeMonths.includes(m.num) ? COLORS.primary : 'transparent',
                    color:   activeMonths.includes(m.num) ? '#fff' : 'text.secondary',
                    border:  `1px solid ${activeMonths.includes(m.num) ? COLORS.primary : 'rgba(0,0,0,0.2)'}`,
                    cursor: 'pointer', '&:hover': { opacity: 0.85 },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={tours}
        loading={loading}
        altColumns
        emptyMessage="Nenhum tour cancelado encontrado para o período selecionado."
        tableRef={tableRef}
        onRowClick={row => setSelectedRow(p => p === row.id ? null : row.id)}
        getRowSx={row => row.id === selectedRow ? { bgcolor: '#fff176' } : {}}
        onBottomReached={loadMore}
      />

      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
        </Box>
      )}

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${tours.length} de ${total} tour${total !== 1 ? 's' : ''} cancelado${total !== 1 ? 's' : ''}`}
        </Typography>
      </Box>
    </Box>
  );
}
