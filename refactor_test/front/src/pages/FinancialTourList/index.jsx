import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Chip, IconButton, Tooltip, Paper, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { getAllMonths, formatMoney } from '../../utils/functions';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const PAGE_SIZE = 80;
const MONTHS = getAllMonths();

function buildDataColumns(onCommentClick) {
  return [
  {
    key: 'company', label: 'Empresa', filterable: true,
    getCellSx: (val) => (val || '').toLowerCase().includes('cobrar cliente')
      ? { bgcolor: COLORS.cobrarClienteBg, color: '#fff', fontWeight: 700 }
      : {},
    render: (val, row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        {!(val || '').toLowerCase().includes('cobrar cliente') && row.comments ? (
          <Box
            onClick={e => { e.stopPropagation(); onCommentClick(row); }}
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: '6px',
              bgcolor: '#e53935', color: '#fff',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 1px 6px rgba(229,57,53,0.55)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': { transform: 'scale(1.18)', boxShadow: '0 2px 10px rgba(229,57,53,0.7)' },
            }}
          >
            <ChatBubbleRoundedIcon sx={{ fontSize: 13 }} />
          </Box>
        ) : null}
        <span>{val}</span>
      </Box>
    ),
  },
  { key: 'invoiceNumber',              label: 'NF Nº',                 filterable: true  },
  { key: 'status',                     label: 'Status Reserva',        filterable: true  },
  { key: 'paymentStatus',              label: 'Status Pagamento',      filterable: true  },
  { key: 'accountNumber',              label: 'Número de Conta',       filterable: true  },
  { key: 'formatedPaymentDate',        label: 'Pago Em',               filterable: true  },
  { key: 'formatedTourDate',           label: 'Data',                  filterable: true  },
  { key: 'tourHour',                   label: 'Horário',               filterable: true  },
  { key: 'activity',                   label: 'Atividade',             filterable: true  },
  { key: 'client',                     label: 'Cliente',               filterable: true  },
  { key: 'platform',                   label: 'Plataforma',            filterable: true  },
  { key: 'orderRef',                   label: 'Nº Reserva',            filterable: true  },
  { key: 'paymentMethod',              label: 'Pagamento',             filterable: true  },
  { key: 'currency',                   label: 'Moeda',                 filterable: true  },
  { key: 'totalValue',                 label: 'Valor',                 filterable: false, render: val => val ? formatMoney(val) : '' },
  { key: 'netValue',                   label: 'Valor NET',             filterable: false, render: val => val ? formatMoney(val) : '' },
  { key: 'clientName',                 label: 'Nome Cliente',          filterable: false },
  { key: 'clientContact',              label: 'Contato Cliente',       filterable: false },
  { key: 'comments',                   label: 'Obs Escritório',        filterable: false, noTruncate: true },
  { key: 'conversationHistory',        label: 'Histórico da Conversa', filterable: false, noTruncate: true },
  { key: 'financialComments',          label: 'Obs Financeiro',        filterable: false, noTruncate: true },
  { key: 'comissioned',                label: 'Comissão',              filterable: false, render: val => val == 1 ? '✓' : '' },
  { key: 'dateOfRegistrationFormated', label: 'Data do Registro',      filterable: false },
  { key: 'createdBy',                  label: 'Criado por',            filterable: false },
  { key: 'lastEditBy',                 label: 'Editado por',           filterable: false },
];}

const STATIC_COLS = buildDataColumns(() => {});

const FILTERABLE_KEYS = STATIC_COLS.filter(c => c.filterable).map(c => c.key);

function buildFilterQS(filters) {
  return Object.entries(filters)
    .filter(([, v]) => v !== null && v.length > 0)
    .map(([k, v]) => `f_${k}=${encodeURIComponent(v.join('|'))}`)
    .join('&');
}

function filtersToParams(filters) {
  const params = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== null && v.length > 0) params[`f_${k}`] = v.join('|');
  }
  return params;
}

function filtersFromParams(searchParams) {
  const filters = {};
  for (const key of FILTERABLE_KEYS) {
    const raw = searchParams.get(`f_${key}`);
    filters[key] = raw ? raw.split('|') : null;
  }
  return filters;
}

function Indicator({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.2, fontSize: '0.92rem' }}>{value}</Typography>
    </Paper>
  );
}

export default function FinancialTourList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userName, userPermissions } = useStore();
  const perm = parseInt(userPermissions);
  const tableRef = useRef(null);

  const [year, setYear] = useState(() => {
    const y = searchParams.get('year');
    return y ? parseInt(y) : new Date().getFullYear();
  });
  const [activeMonths, setActiveMonths] = useState(() => {
    const m = searchParams.get('months');
    return m ? m.split(',').map(Number) : [new Date().getMonth() + 1];
  });
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ dollarTotal: 0, realTotal: 0, paxTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState([]);
  const [commentDialog, setCommentDialog] = useState({ open: false, row: null });

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadMoreRef = useRef(false);
  const fetchGenRef = useRef(0);

  const fetchFirstPage = useCallback(async () => {
    if (activeMonths.length === 0) {
      setRows([]); setTotal(0); setFilterOptions({}); return;
    }
    const gen = ++fetchGenRef.current;
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    const fqs = buildFilterQS(filters);
    const baseUrl = `months=${activeMonths.join(',')}&year=${year}${fqs ? '&' + fqs : ''}`;
    try {
      const pageData = await apiFetch(`/tours/list-all-financial?${baseUrl}&limit=${PAGE_SIZE}&offset=0`).then(r => r.json());
      if (fetchGenRef.current !== gen) return;
      const arr = Array.isArray(pageData.rows) ? pageData.rows : [];
      setRows(arr);
      setTotal(pageData.total || 0);
      setTotals(pageData.totals || { dollarTotal: 0, realTotal: 0, paxTotal: 0 });
      offsetRef.current = arr.length;
      hasMoreRef.current = arr.length < (pageData.total || 0);
      setSelected([]);
    } catch {
      if (fetchGenRef.current !== gen) return;
      setRows([]); setTotal(0); setTotals({ dollarTotal: 0, realTotal: 0, paxTotal: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeMonths, year, filters]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (loadMoreRef.current || !hasMoreRef.current) return;
    loadMoreRef.current = true;
    setLoadingMore(true);
    const gen = fetchGenRef.current;
    const fqs = buildFilterQS(filters);
    const baseUrl = `months=${activeMonths.join(',')}&year=${year}${fqs ? '&' + fqs : ''}`;
    apiFetch(`/tours/list-all-financial?${baseUrl}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`)
      .then(r => r.json())
      .then(pageData => {
        if (fetchGenRef.current !== gen) return;
        const arr = Array.isArray(pageData.rows) ? pageData.rows : [];
        setRows(prev => [...prev, ...arr]);
        offsetRef.current += arr.length;
        hasMoreRef.current = offsetRef.current < (pageData.total || 0);
      })
      .catch(() => {})
      .finally(() => { loadMoreRef.current = false; setLoadingMore(false); });
  }, [activeMonths, year, filters]); // eslint-disable-line

  const fetchColumnOptions = useCallback(async (colKey, signal) => {
    const fqs = buildFilterQS(filters);
    const baseUrl = `months=${activeMonths.join(',')}&year=${year}${fqs ? '&' + fqs : ''}`;
    const r = await apiFetch(`/tours/financial-filter-options?${baseUrl}&column=${colKey}`, { signal });
    const data = await r.json();
    return data[colKey] || [];
  }, [activeMonths, year, filters]); // eslint-disable-line

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  useEffect(() => {
    const params = { year: String(year), months: activeMonths.join(','), ...filtersToParams(filters) };
    setSearchParams(params, { replace: true });
  }, [year, activeMonths, filters]); // eslint-disable-line

  function toggleMonth(m) {
    setActiveMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function handleFilterChange(key, values) {
    setFilters(prev => ({ ...prev, [key]: values }));
  }

  function clearAllFilters() {
    const reset = {};
    for (const k of FILTERABLE_KEYS) reset[k] = null;
    setFilters(reset);
  }

  async function cancelTour(tour) {
    if (perm === 5) return;
    const { value: cancelReason, isConfirmed } = await Swal.fire({
      title: `Cancelar tour Nº ${tour.orderRef}?`, input: 'text',
      inputLabel: 'Motivo do cancelamento', inputPlaceholder: 'Motivo do cancelamento',
      showCancelButton: true, confirmButtonText: 'Cancelar tour',
      cancelButtonText: 'Voltar', confirmButtonColor: '#e53935',
    });
    if (!isConfirmed) return;
    await apiFetch(`/tours/cancel?id=${tour.id}`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason, lastEditBy: userName }),
    });
    fetchFirstPage();
  }

  async function cancelSelected() {
    if (perm === 5) return;
    const orderRefs = rows.filter(t => selected.includes(t.id)).map(t => t.orderRef).join(', ');
    const { value: cancelReason, isConfirmed } = await Swal.fire({
      title: `Cancelar tours: ${orderRefs}?`, input: 'text',
      inputLabel: 'Motivo do cancelamento', inputPlaceholder: 'Motivo do cancelamento',
      showCancelButton: true, confirmButtonText: 'Confirmar',
      cancelButtonText: 'Voltar', confirmButtonColor: '#e53935',
    });
    if (!isConfirmed) return;
    await apiFetch(`/tours/cancel-multiple?ids=${selected.join(',')}`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason, createdBy: userName, lastEditBy: userName }),
    });
    fetchFirstPage();
  }

  function checkInsertedLate(tour) {
    if (tour.lateCheck == 1) return false;
    if (!tour.dateOfRegistration || !tour.tourDate) return false;
    return new Date(tour.dateOfRegistration) > new Date(tour.tourDate);
  }

  async function removeLateCheck(tour) {
    const { isConfirmed } = await Swal.fire({
      title: `Remover marcação de atraso do tour Nº ${tour.orderRef}?`,
      showCancelButton: true, confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Voltar', confirmButtonColor: COLORS.primary,
    });
    if (!isConfirmed) return;
    await apiFetch(`/tours/mark-as-late-check?id=${tour.id}`, {
      method: 'POST',
      body: JSON.stringify({ lastEditBy: userName }),
    });
    fetchFirstPage();
  }

  async function markCobrarCliente(tour) {
    const { isConfirmed } = await Swal.fire({
      title: 'Cobrar cliente?',
      text: `O tour Nº ${tour.orderRef} será marcado como "Cobrar Cliente".`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: COLORS.cobrarClienteBg,
    });
    if (!isConfirmed) return;
    await apiFetch(`/tours/set-cobrar-cliente?id=${tour.id}`, {
      method: 'POST',
      body: JSON.stringify({ lastEditBy: userName }),
    });
    fetchFirstPage();
  }

  const rowActions = perm !== 5 ? (row) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Editar" arrow>
        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/editar-tour-financeiro?id=${row.id}`); }}>
          <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancelar tour" arrow>
        <IconButton size="small" onClick={e => { e.stopPropagation(); cancelTour(row); }}>
          <CancelRoundedIcon fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
      {checkInsertedLate(row) && (
        <Tooltip title="Tour inserido depois da data — remover marcação de atraso" arrow>
          <IconButton size="small" onClick={e => { e.stopPropagation(); removeLateCheck(row); }}>
            <ScheduleRoundedIcon fontSize="small" sx={{ color: '#fdab3d' }} />
          </IconButton>
        </Tooltip>
      )}
      {!(row.company || '').toLowerCase().includes('cobrar cliente') && (
        <Tooltip title="Marcar como cobrar cliente" arrow>
          <IconButton size="small" onClick={e => { e.stopPropagation(); markCobrarCliente(row); }}>
            <RequestQuoteRoundedIcon fontSize="small" sx={{ color: COLORS.cobrarClienteBg }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  ) : null;

  const dataColumns = useMemo(
    () => buildDataColumns(row => setCommentDialog({ open: true, row })),
    [],
  );
  const actionsCol = rowActions ? { key: '_actions', label: 'Ações', render: (_, row) => rowActions(row) } : null;
  const columns = actionsCol ? [actionsCol, ...dataColumns] : dataColumns;

  const activeFilterCount = Object.values(filters).filter(v => v !== null).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Tours Financeiros</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <DownloadTableExcel filename="lista-de-tours-financeiro" sheet="tours-financeiro" currentTableRef={tableRef.current}>
            <Button size="small" variant="outlined" sx={{ fontSize: '0.78rem' }}>Exportar Excel</Button>
          </DownloadTableExcel>
          {activeFilterCount > 0 && (
            <Tooltip title="Limpar todos os filtros de coluna">
              <Button
                size="small" startIcon={<FilterAltOffRoundedIcon />}
                variant="outlined" color="warning" onClick={clearAllFilters}
                sx={{ fontSize: '0.78rem' }}
              >
                Limpar filtros ({activeFilterCount})
              </Button>
            </Tooltip>
          )}
          {selected.length > 1 && perm !== 5 && (
            <Button
              variant="contained" color="error" size="small"
              startIcon={<CancelRoundedIcon />} onClick={cancelSelected}
              sx={{ fontSize: '0.78rem' }}
            >
              Cancelar selecionados ({selected.length})
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
          <Indicator label="$ Total" value={totals.dollarTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          <Indicator label="R$ Total" value={totals.realTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          <Indicator label="Pax Total" value={totals.paxTotal} />
        </Box>
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
        rows={rows}
        filters={filters}
        fetchOptions={fetchColumnOptions}
        onFilterChange={handleFilterChange}
        loading={loading}
        selectable={perm !== 5}
        selected={selected}
        onSelectChange={setSelected}
        emptyMessage="Nenhum tour encontrado para o período selecionado."
        tableRef={tableRef}
        onBottomReached={loadMore}
      />

      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
        </Box>
      )}

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${rows.length} de ${total} tour${total !== 1 ? 's' : ''}`}
        </Typography>
        {activeFilterCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} de coluna ativo{activeFilterCount !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      <Dialog
        open={commentDialog.open}
        onClose={() => setCommentDialog({ open: false, row: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, pb: 1 }}>
          {commentDialog.row && (() => {
            const r = commentDialog.row;
            const parts = ['Observações do tour'];
            if (r.activity) parts.push(r.activity);
            if (r.formatedTourDate) parts.push(`dia ${r.formatedTourDate}`);
            if (r.tourHour) parts.push(`hora ${r.tourHour}`);
            if (r.orderRef) parts.push(`reserva ${r.orderRef}`);
            return parts.join(' ');
          })()}
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
            {commentDialog.row?.comments}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, row: null })}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
