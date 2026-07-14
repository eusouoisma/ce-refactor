import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Chip, IconButton, Tooltip, Paper, Button, CircularProgress,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import Swal from 'sweetalert2';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import { getAllMonths } from '../../utils/functions';
import { getPersistedMonths, setPersistedMonths, getPersistedYear, setPersistedYear, hasUrlParams } from '../../utils/storage';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const PAGE_SIZE = 80;
const MONTHS = getAllMonths();
const PAGE_KEY = 'comissions';

const makeActions = (navigate, deleteItem, pay, unpay, canEdit) => (row) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <Tooltip title="Editar" arrow>
      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/editar-comissao?id=${row.id}`); }}>
        <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
      </IconButton>
    </Tooltip>
    {canEdit && (
      <>
        <Tooltip title="Excluir" arrow>
          <IconButton size="small" onClick={e => { e.stopPropagation(); deleteItem(row.id); }}>
            <DeleteRoundedIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
        {row.comissionPaid != 1
          ? (
            <Tooltip title="Marcar como pago" arrow>
              <IconButton size="small" onClick={e => { e.stopPropagation(); pay(row.id); }}>
                <PaidRoundedIcon fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Desmarcar pagamento" arrow>
              <IconButton size="small" onClick={e => { e.stopPropagation(); unpay(row.id); }}>
                <MoneyOffRoundedIcon fontSize="small" color="warning" />
              </IconButton>
            </Tooltip>
          )
        }
      </>
    )}
  </Box>
);

const DATA_COLUMNS = [
  { key: 'orderRef',            label: 'Nº Pedido',                filterable: true },
  { key: 'tourDateFormated',    label: 'Data do Tour',             filterable: true },
  { key: 'comissionersName',    label: 'Nome do comissionado',     filterable: true },
  { key: 'comissionersContact', label: 'Contato do comissionado',  filterable: true },
  { key: 'comissionCurrency',   label: 'Moeda',                    filterable: true },
  { key: 'comissionPrice',      label: 'Valor',                    filterable: true },
  {
    key: 'comissionPaid', label: 'Pago?', filterable: true,
    render: val => val == 1
      ? <Chip label="Pago" size="small" color="success" sx={{ fontSize: '0.7rem', height: 20 }} />
      : null,
  },
  { key: 'createdBy',           label: 'Criado por',               filterable: true },
  { key: 'lastEditBy',          label: 'Editado por último por',   filterable: true },
];

const FILTERABLE_KEYS = DATA_COLUMNS.filter(c => c.filterable).map(c => c.key);

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

export default function ComissionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userName, userPermissions, pageFilters, setPageFilters } = useStore();
  const canEdit = !isReadOnly(userPermissions);
  const tableRef = useRef(null);
  const [year, setYear] = useState(() => {
    const y = searchParams.get('year');
    return y ? parseInt(y) : getPersistedYear(PAGE_KEY);
  });
  const [activeMonths, setActiveMonths] = useState(() => {
    const m = searchParams.get('months');
    return m ? m.split(',').map(Number) : getPersistedMonths(PAGE_KEY, [new Date().getMonth() + 1]);
  });
  const [filters, setFilters] = useState(() => (
    hasUrlParams(searchParams, [])
      ? filtersFromParams(searchParams)
      : (pageFilters[PAGE_KEY] || filtersFromParams(searchParams))
  ));
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ totalReal: 0, totalDollar: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRow, setSelectedRow] = useState([]);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadMoreRef = useRef(false);
  const fetchGenRef = useRef(0);

  const fetchFirstPage = useCallback(async () => {
    if (!activeMonths.length) { setItems([]); setTotal(0); return; }
    const gen = ++fetchGenRef.current;
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    const fqs = buildFilterQS(filters);
    const baseUrl = `months=${activeMonths.join(',')}&year=${year}${fqs ? '&' + fqs : ''}`;
    try {
      const data = await apiFetch(
        `/comissions/list-all?${baseUrl}&limit=${PAGE_SIZE}&offset=0`
      ).then(r => r.json());
      if (fetchGenRef.current !== gen) return;
      const arr = Array.isArray(data.rows) ? data.rows : [];
      setItems(arr);
      setTotal(data.total || 0);
      setTotals(data.totals || { totalReal: 0, totalDollar: 0 });
      offsetRef.current = arr.length;
      hasMoreRef.current = arr.length < (data.total || 0);
    } catch {
      if (fetchGenRef.current !== gen) return;
      setItems([]); setTotal(0); setTotals({ totalReal: 0, totalDollar: 0 });
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
    apiFetch(`/comissions/list-all?${baseUrl}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`)
      .then(r => r.json())
      .then(data => {
        if (fetchGenRef.current !== gen) return;
        const arr = Array.isArray(data.rows) ? data.rows : [];
        setItems(prev => [...prev, ...arr]);
        offsetRef.current += arr.length;
        hasMoreRef.current = offsetRef.current < (data.total || 0);
      })
      .catch(() => {})
      .finally(() => { loadMoreRef.current = false; setLoadingMore(false); });
  }, [activeMonths, year, filters]); // eslint-disable-line

  const fetchColumnOptions = useCallback(async (colKey, signal) => {
    const fqs = buildFilterQS(filters);
    const baseUrl = `months=${activeMonths.join(',')}&year=${year}${fqs ? '&' + fqs : ''}`;
    const r = await apiFetch(`/comissions/filter-options?${baseUrl}&column=${colKey}`, { signal });
    const data = await r.json();
    return data[colKey] || [];
  }, [activeMonths, year, filters]); // eslint-disable-line

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  useEffect(() => {
    const params = { year: String(year), months: activeMonths.join(','), ...filtersToParams(filters) };
    setSearchParams(params, { replace: true });
    setPersistedYear(PAGE_KEY, year);
    setPersistedMonths(PAGE_KEY, activeMonths);
    setPageFilters(PAGE_KEY, filters);
  }, [year, activeMonths, filters]); // eslint-disable-line

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  function handleFilterChange(key, values) {
    setFilters(prev => ({ ...prev, [key]: values }));
  }

  function clearAllFilters() {
    const reset = {};
    for (const k of FILTERABLE_KEYS) reset[k] = null;
    setFilters(reset);
  }

  async function deleteItem(id) {
    if (!canEdit) return;
    const result = await Swal.fire({ title: 'Excluir comissão?', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' });
    if (!result.isConfirmed) return;
    await apiFetch(`/comissions/delete?id=${id}`);
    fetchFirstPage();
  }

  async function pay(id) {
    if (!canEdit) return;
    await apiFetch(`/comissions/pay?id=${id}&lastEditBy=${userName}`);
    fetchFirstPage();
  }

  async function unpay(id) {
    if (!canEdit) return;
    await apiFetch(`/comissions/unpay?id=${id}&lastEditBy=${userName}`);
    fetchFirstPage();
  }

  const rowActions = makeActions(navigate, deleteItem, pay, unpay, canEdit);
  const actionsCol = { key: 'id', label: 'Ações', render: (_, row) => rowActions(row) };
  const columns = [actionsCol, ...DATA_COLUMNS];
  const activeFilterCount = Object.values(filters).filter(v => v !== null).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Comissões</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mx: 2 }}>
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
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
          <Indicator label="R$ Total" value={totals.totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          <Indicator label="$ Total" value={totals.totalDollar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          <DownloadTableExcel filename="comissoes" sheet="comissoes" currentTableRef={tableRef.current}>
            <Button size="small" variant="outlined" sx={{ fontSize: '0.78rem' }}>Exportar Excel</Button>
          </DownloadTableExcel>
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
        rows={items}
        filters={filters}
        fetchOptions={fetchColumnOptions}
        onFilterChange={handleFilterChange}
        loading={loading}
        altColumns
        emptyMessage="Nenhuma comissão encontrada para o período selecionado."
        tableRef={tableRef}
        onRowClick={row => setSelectedRow(p => p.includes(row.id) ? p.filter(id => id !== row.id) : [...p, row.id])}
        getRowSx={row => selectedRow.includes(row.id) ? { bgcolor: '#fdab3d' } : {}}
        onBottomReached={loadMore}
      />

      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
        </Box>
      )}

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${items.length} de ${total} comissão${total !== 1 ? 'ões' : ''}`}
        </Typography>
        {activeFilterCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} de coluna ativo{activeFilterCount !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
