import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Chip, IconButton, Tooltip, Paper, Button, CircularProgress,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import Swal from 'sweetalert2';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import { getAllMonths } from '../../utils/functions';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const PAGE_SIZE = 80;
const MONTHS = getAllMonths();

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

const COLUMNS = (rowActions) => [
  { key: 'id',                  label: 'Ações',                    render: (_, row) => rowActions(row) },
  { key: 'orderRef',            label: 'Nº Pedido' },
  { key: 'tourDateFormated',    label: 'Data do Tour' },
  { key: 'comissionersName',    label: 'Nome do comissionado' },
  { key: 'comissionersContact', label: 'Contato do comissionado' },
  { key: 'comissionCurrency',   label: 'Moeda' },
  { key: 'comissionPrice',      label: 'Valor' },
  {
    key: 'comissionPaid', label: 'Pago?',
    render: val => val == 1
      ? <Chip label="Pago" size="small" color="success" sx={{ fontSize: '0.7rem', height: 20 }} />
      : null,
  },
  { key: 'createdBy',           label: 'Criado por' },
  { key: 'lastEditBy',          label: 'Editado por último por' },
];

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
  const { userName, userPermissions } = useStore();
  const canEdit = !isReadOnly(userPermissions);
  const tableRef = useRef(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeMonths, setActiveMonths] = useState([new Date().getMonth() + 1]);
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
    try {
      const data = await apiFetch(
        `/comissions/list-all?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=0`
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
  }, [activeMonths, year]);

  const loadMore = useCallback(() => {
    if (loadMoreRef.current || !hasMoreRef.current) return;
    loadMoreRef.current = true;
    setLoadingMore(true);
    const gen = fetchGenRef.current;
    apiFetch(`/comissions/list-all?months=${activeMonths.join(',')}&year=${year}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`)
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
  }, [activeMonths, year]);

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  function toggleMonth(m) {
    setActiveMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
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
  const columns = COLUMNS(rowActions);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">Comissões</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${items.length} de ${total} comissão${total !== 1 ? 'ões' : ''}`}
        </Typography>
      </Box>
    </Box>
  );
}
