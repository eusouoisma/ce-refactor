import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Paper,
  CircularProgress,
} from '@mui/material';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { apiFetch } from '../../utils/api';
import { getAllMonths, formatAdicional } from '../../utils/functions';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

function Indicator({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.2, fontSize: '0.92rem' }}>{value}</Typography>
    </Paper>
  );
}

// Isolated cell so typing only re-renders this component, not the whole table
const GroupsCell = React.memo(function GroupsCell({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue);
  const prevRef = useRef(initialValue);
  useEffect(() => {
    if (prevRef.current !== initialValue) {
      prevRef.current = initialValue;
      setValue(initialValue);
    }
  }, [initialValue]);
  return (
    <TextField
      size="small"
      type="number"
      sx={{ width: 56, '& .MuiInputBase-input': { py: 0.3, px: 0.75, fontSize: '0.78rem' } }}
      value={value}
      onChange={e => setValue(parseInt(e.target.value) || 0)}
      onBlur={() => onSave(value)}
      onClick={e => e.stopPropagation()}
    />
  );
});

function buildFilterParams(filters) {
  return Object.entries(filters)
    .filter(([, v]) => v && v.length)
    .map(([k, vals]) => `f_${k}=${encodeURIComponent(vals.join('|'))}`)
    .join('&');
}

const PAGE_SIZE = 80;
const MONTHS = getAllMonths();
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function SummaryTourList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableRef = useRef(null);

  const [year, setYear] = useState(() => parseInt(searchParams.get('year')) || new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState(() => {
    const m = searchParams.get('months');
    return m ? m.split(',').map(Number).filter(Boolean) : [new Date().getMonth() + 1];
  });
  const [filters, setFilters] = useState(() => {
    const f = {};
    for (const [k, v] of searchParams.entries()) {
      if (k.startsWith('f_')) f[k.slice(2)] = v.split('|');
    }
    return f;
  });

  const [tours, setTours] = useState([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ paxTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Keep URL in sync with current state
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('year', year);
    if (activeMonths.length) params.set('months', activeMonths.join(','));
    for (const [k, vals] of Object.entries(filters)) {
      if (vals && vals.length) params.set(`f_${k}`, vals.join('|'));
    }
    setSearchParams(params, { replace: true });
  }, [year, activeMonths, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const [clientModal, setClientModal] = useState({ open: false, clients: [], activity: '', date: '', hour: '' });

  const offsetRef  = useRef(0);
  const hasMoreRef = useRef(true);
  const loadMoreRef = useRef(false);
  const fetchGenRef = useRef(0);

  const fetchFirstPage = useCallback(async () => {
    if (!activeMonths.length) { setTours([]); setTotal(0); return; }
    const gen = ++fetchGenRef.current;
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    const fp = buildFilterParams(filters);
    try {
      const data = await apiFetch(
        `/tours/list-all-summary?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=0${fp ? '&' + fp : ''}`
      ).then(r => r.json());
      if (fetchGenRef.current !== gen) return;
      const arr = Array.isArray(data.rows) ? data.rows : [];
      setTours(arr);
      setTotal(data.total || 0);
      setTotals(data.totals || { paxTotal: 0 });
      offsetRef.current = arr.length;
      hasMoreRef.current = arr.length < (data.total || 0);
    } catch {
      if (fetchGenRef.current !== gen) return;
      setTours([]); setTotal(0); setTotals({ paxTotal: 0 });
    } finally {
      if (fetchGenRef.current === gen) setLoading(false);
    }
  }, [activeMonths, year, filters]);

  const loadMore = useCallback(() => {
    if (loadMoreRef.current || !hasMoreRef.current) return;
    loadMoreRef.current = true;
    setLoadingMore(true);
    const gen = fetchGenRef.current;
    const fp = buildFilterParams(filters);
    apiFetch(`/tours/list-all-summary?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=${offsetRef.current}${fp ? '&' + fp : ''}`)
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
  }, [activeMonths, year, filters]);

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  const fetchOptions = useCallback(async (colKey, signal) => {
    const fp = buildFilterParams(filters);
    const url = `/tours/summary-filter-options?year=${year}&months=${activeMonths.join(',')}&column=${colKey}${fp ? '&' + fp : ''}`;
    const res = await apiFetch(url, { signal });
    const data = await res.json();
    return data[colKey] || [];
  }, [activeMonths, year, filters]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  }

  function toggleRow(row) {
    setSelectedRow(p => p === row.id ? null : row.id);
  }

  const showClients = useCallback(async (tour) => {
    const dateOnly = String(tour.tourDate).split('T')[0];
    const res = await apiFetch(`/tours/list-clients-by-date-and-hour?date=${dateOnly}&hour=${tour.tourHour}`);
    const data = await res.json();
    setClientModal({ open: true, clients: data.clients || [], activity: tour.activity, date: tour.formatedTourDate || dateOnly, hour: tour.tourHour });
  }, []);

  const saveGroups = useCallback(async (tour, groups) => {
    await apiFetch('/numberOfGroups/create', {
      method: 'POST',
      body: JSON.stringify({ id: tour.id, type: tour.type, date: tour.tourDate, hour: tour.tourHour, activity: tour.activity, groups }),
    });
    fetchFirstPage();
  }, [fetchFirstPage]);

  const columns = useMemo(() => [
    { key: 'formatedTourDate', label: 'Data',      filterable: true },
    { key: '_dia',             label: 'Dia',        render: (_, row) => row.tourDate ? DAYS[new Date(String(row.tourDate).split('T')[0] + 'T00:00:00').getUTCDay()] : '' },
    { key: 'tourHour',         label: 'Horário',    filterable: true },
    { key: 'activity',         label: 'Atividade',  filterable: true },
    { key: 'adicional', label: 'Adicional', filterable: true, render: val => formatAdicional(val) },
    {
      key: 'paxTotal',
      label: 'Total Pax',
      render: (val, row) => {
        if (row.status === 'Cancelado') return row.type === 'privativo' ? row.paxTotalInitial : '-';
        return val;
      },
    },
    {
      key: 'groups',
      label: 'Nº Grupos',
      render: (val, row) => (
        <GroupsCell
          initialValue={val ?? Math.ceil((parseInt(row.paxTotal) || 0) / 30)}
          onSave={groups => saveGroups(row, groups)}
        />
      ),
    },
    { key: 'language', label: 'Idioma',   filterable: true },
    {
      key: 'client',
      label: 'Cliente',
      filterable: true,
      render: (val, row) => row.type === 'regular'
        ? (
          <Box
            component="span"
            onClick={e => { e.stopPropagation(); showClients(row); }}
            sx={{ cursor: 'pointer' }}
          >
            Ver
          </Box>
        )
        : val,
    },
    { key: 'guides', label: 'Guia CE', filterable: true },
  ], [saveGroups, showClients]);

  const getRowSx = useCallback(row => {
    if (row.id === selectedRow) return { bgcolor: '#fff176' };
    if (row.status === 'Confirmado' || row.status === 'No Show') return { bgcolor: '#00ef00' };
    if (row.status === 'Cancelado') return { bgcolor: '#ff4444' };
    if (row.status === 'Fulfilled') return { bgcolor: '#bcf1bf' };
    return {};
  }, [selectedRow]);

  function handleFilterChange(key, values) {
    setFilters(prev => ({ ...prev, [key]: values }));
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">Lista Resumida</Typography>
        <DownloadTableExcel filename="lista-resumida" sheet="resumo" currentTableRef={tableRef.current}>
          <Button size="small" variant="outlined" sx={{ fontSize: '0.78rem' }}>Exportar Excel</Button>
        </DownloadTableExcel>
        <Indicator label="Pax Total" value={totals.paxTotal} />
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
                  label={m.name}
                  size="small"
                  onClick={() => toggleMonth(m.num)}
                  sx={{
                    fontWeight: activeMonths.includes(m.num) ? 700 : 400,
                    bgcolor: activeMonths.includes(m.num) ? COLORS.primary : 'transparent',
                    color:   activeMonths.includes(m.num) ? '#fff' : 'text.secondary',
                    border:  `1px solid ${activeMonths.includes(m.num) ? COLORS.primary : 'rgba(0,0,0,0.2)'}`,
                    cursor:  'pointer',
                    '&:hover': { opacity: 0.85 },
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
        filters={filters}
        onFilterChange={handleFilterChange}
        fetchOptions={fetchOptions}
        loading={loading}
        altColumns
        onRowClick={toggleRow}
        emptyMessage="Nenhum tour encontrado para o período selecionado."
        tableRef={tableRef}
        getRowSx={getRowSx}
        onBottomReached={loadMore}
      />

      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
        </Box>
      )}

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${tours.length} de ${total}`}
        </Typography>
      </Box>

      <Dialog
        open={clientModal.open}
        onClose={() => setClientModal({ open: false, clients: [], activity: '', date: '', hour: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clientes do tour {clientModal.activity} dia {clientModal.date} hora {clientModal.hour}</DialogTitle>
        <DialogContent>
          {clientModal.clients.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Nenhum cliente encontrado.
            </Typography>
          ) : (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {clientModal.clients.map((c, i) => (
                <Typography component="li" key={i} variant="body2" sx={{ py: 0.4 }}>
                  Cliente: {c.client}, Guia: {c.companionName || '—'}, Contato do Guia: {c.companionContact || ''}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModal({ open: false, clients: [], activity: '', date: '', hour: '' })}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
