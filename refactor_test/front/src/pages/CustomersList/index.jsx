import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, IconButton, Tooltip, TextField, Button, InputAdornment, Paper,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const PAGE_SIZE = 80;

const DATA_COLUMNS = [
  { key: 'customerName',    label: 'Cliente',      filterable: true  },
  { key: 'customerType',    label: 'Tipo',         filterable: true  },
  { key: 'contactName',     label: 'Nome Contato', filterable: true  },
  { key: 'contactContact',  label: 'Telefone',     filterable: true  },
  { key: 'contactOffice',   label: 'Cargo',        filterable: true  },
  { key: 'contactEmail',    label: 'Email',        filterable: true  },
];

const FILTERABLE_KEYS = DATA_COLUMNS.filter(c => c.filterable).map(c => c.key);

function filtersFromParams(searchParams) {
  const f = {};
  for (const k of FILTERABLE_KEYS) {
    const raw = searchParams.get(`f_${k}`);
    f[k] = raw ? raw.split('|') : null;
  }
  return f;
}

function filtersToQueryString(filters, search) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v && v.length > 0) params.set(`f_${k}`, v.join('|'));
  }
  if (search) params.set('q', search);
  return params.toString();
}

function filtersToUrlParams(filters, search) {
  const out = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v && v.length > 0) out[`f_${k}`] = v.join('|');
  }
  if (search) out.q = search;
  return out;
}

function withGroupFlags(rows, prevLastName) {
  let prev = prevLastName;
  return rows.map(row => {
    const isFirst = row.customerName !== prev;
    prev = row.customerName;
    return { ...row, id: row.contactId, _firstOfGroup: isFirst };
  });
}

function Indicator({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.2, fontSize: '0.92rem' }}>{value}</Typography>
    </Paper>
  );
}

export default function CustomersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userPermissions, userName } = useStore();
  const perm = parseInt(userPermissions);
  const canEdit = perm !== 5;
  const tableRef = useRef(null);

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const listAbortRef = useRef(null);
  const moreAbortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSearchParams(filtersToUrlParams(filters, search), { replace: true });
  }, [filters, search]); // eslint-disable-line

  const fetchFirstPage = useCallback(() => {
    listAbortRef.current?.abort();
    const ctrl = new AbortController();
    listAbortRef.current = ctrl;

    setLoading(true);
    const qs = filtersToQueryString(filters, search);
    apiFetch(`/customers/list-paginated?limit=${PAGE_SIZE}&offset=0${qs ? '&' + qs : ''}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return;
        const enriched = withGroupFlags(data.rows || [], null);
        setRows(enriched);
        setTotal(data.total || 0);
        setUniqueCustomers(data.uniqueCustomers || 0);
      })
      .catch(err => { if (err.name !== 'AbortError') { setRows([]); setTotal(0); setUniqueCustomers(0); } })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
  }, [filters, search]);

  const fetchColumnOptions = useCallback(async (colKey, signal) => {
    const qs = filtersToQueryString(filters, search);
    const url = `/customers/filter-options?column=${colKey}${qs ? '&' + qs : ''}`;
    const r = await apiFetch(url, { signal });
    const data = await r.json();
    return data[colKey] || [];
  }, [filters, search]);

  useEffect(() => {
    fetchFirstPage();
    return () => {
      listAbortRef.current?.abort();
      moreAbortRef.current?.abort();
    };
  }, [fetchFirstPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (rows.length >= total) return;

    moreAbortRef.current?.abort();
    const ctrl = new AbortController();
    moreAbortRef.current = ctrl;

    setLoadingMore(true);
    const qs = filtersToQueryString(filters, search);
    apiFetch(`/customers/list-paginated?limit=${PAGE_SIZE}&offset=${rows.length}${qs ? '&' + qs : ''}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return;
        setRows(prev => {
          const lastName = prev.length > 0 ? prev[prev.length - 1].customerName : null;
          return [...prev, ...withGroupFlags(data.rows || [], lastName)];
        });
      })
      .catch(err => { /* abort: ignore */ })
      .finally(() => { if (!ctrl.signal.aborted) setLoadingMore(false); });
  }, [filters, search, rows.length, total, loading, loadingMore]);

  const handleFilterChange = useCallback((key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const reset = {};
    for (const k of FILTERABLE_KEYS) reset[k] = null;
    setFilters(reset);
    setSearch('');
    setSearchInput('');
  }, []);

  const editCustomer = useCallback((customerId) => {
    navigate(`/editar-cliente?id=${customerId}`);
  }, [navigate]);

  const deleteContact = useCallback(async (row) => {
    if (!canEdit) return;
    const { isConfirmed } = await Swal.fire({
      title: `Excluir o contato "${row.contactName || ''}" de ${row.customerName}?`,
      text: 'Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e2445c',
    });
    if (!isConfirmed) return;
    try {
      const res = await apiFetch(`/customers/delete?id=${row.contactId}&lastEditBy=${encodeURIComponent(userName || '')}`);
      const json = await res.json().catch(() => ({}));
      if (json?.error) throw new Error('falha');
      Swal.fire({ icon: 'success', title: 'Contato excluído', timer: 1200, showConfirmButton: false });
      fetchFirstPage();
    } catch {
      Swal.fire({ icon: 'error', title: 'Erro ao excluir contato' });
    }
  }, [canEdit, userName, fetchFirstPage]);

  const rowActions = canEdit ? (row) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Editar cliente" arrow>
        <IconButton size="small" onClick={e => { e.stopPropagation(); editCustomer(row.customerId); }}>
          <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Excluir contato" arrow>
        <IconButton size="small" onClick={e => { e.stopPropagation(); deleteContact(row); }}>
          <DeleteRoundedIcon fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
    </Box>
  ) : null;

  const activeFilterCount = Object.values(filters).filter(v => v !== null && v.length > 0).length;

  const getRowSx = useCallback((row) => (
    row._firstOfGroup ? { '& > td': { borderTop: `2px solid ${COLORS.sidebar}` } } : {}
  ), []);


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Listar Clientes</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate('/inserir-cliente')}
              sx={{ fontSize: '0.78rem' }}
            >
              Novo cliente
            </Button>
          )}
          <DownloadTableExcel filename="clientes" sheet="clientes" currentTableRef={tableRef.current}>
            <Tooltip title="Exporta apenas as linhas já carregadas pelo scroll" arrow>
              <Button size="small" variant="outlined" sx={{ fontSize: '0.78rem' }}>
                Exportar Excel
              </Button>
            </Tooltip>
          </DownloadTableExcel>
          {(activeFilterCount > 0 || search) && (
            <Tooltip title="Limpar todos os filtros e busca">
              <Button
                size="small"
                startIcon={<FilterAltOffRoundedIcon />}
                variant="outlined"
                color="warning"
                onClick={clearAllFilters}
                sx={{ fontSize: '0.78rem' }}
              >
                Limpar ({activeFilterCount + (search ? 1 : 0)})
              </Button>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
          <Indicator label="Clientes" value={uniqueCustomers} />
          <Indicator label="Contatos" value={total} />
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por cliente, contato, telefone, e-mail..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 420 }}
        />
      </Box>

      <DataTable
        columns={DATA_COLUMNS}
        rows={rows}
        filters={filters}
        fetchOptions={fetchColumnOptions}
        onFilterChange={handleFilterChange}
        loading={loading}
        actions={rowActions}
        altColumns
        getRowSx={getRowSx}
        emptyMessage="Nenhum cliente encontrado."
        tableRef={tableRef}
        onBottomReached={loadMore}
      />

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {loading
            ? 'Carregando...'
            : `Mostrando ${rows.length} de ${total} contato${total !== 1 ? 's' : ''} (${uniqueCustomers} cliente${uniqueCustomers !== 1 ? 's' : ''})`}
        </Typography>
        {loadingMore && (
          <Typography variant="caption" color="primary">
            Carregando mais...
          </Typography>
        )}
        {activeFilterCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} ativo{activeFilterCount !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
