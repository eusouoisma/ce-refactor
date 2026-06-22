import React, { useState, useEffect, useRef } from 'react';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import Swal from 'sweetalert2';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Chip, Tooltip, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterModal from '../../components/DataTable/FilterModal';
import { apiFetch } from '../../utils/api';
import { formatMoney, getAllMonths } from '../../utils/functions';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';

const MONTHS = getAllMonths();

// mesmo esquema de cores do DataTable (altColumns=true)
const getHeaderBg   = i => i % 2 === 0 ? COLORS.tableHeaderAltBg : COLORS.tableHeaderBg;
const getHeaderColor= i => i % 2 === 0 ? COLORS.primary           : COLORS.tableHeaderText;
const getCellBg     = i => i % 2 === 0 ? COLORS.tableCellAltBg    : '#ffffff';

const HEADER_SX = {
  fontWeight: 600,
  fontSize: '0.52rem',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  textAlign: 'center',
  borderBottom: `2px solid ${COLORS.tableBorder}`,
  borderRight: `1px solid ${COLORS.tableBorder}`,
  py: 0.35,
  px: 1,
  position: 'sticky',
  top: 0,
  zIndex: 2,
};

const COLUMNS = [
  { code: 'formatedDate',        label: 'Data',              filterable: true  },
  { code: 'function',            label: 'Função',            filterable: true  },
  { code: 'employeeName',        label: 'Nome',              filterable: true  },
  { code: 'activity',            label: 'Atividade',         filterable: true  },
  { code: 'workedTime',          label: 'Tempo trabalhado',  filterable: false },
  { code: 'value',               label: 'Valor',             filterable: true  },
  { code: 'paymentComments',     label: 'OBS',               filterable: false },
  { code: 'paymentDateFormated', label: 'Data do Pagamento', filterable: true  },
];

function subHours(h1, h2) {
  if (!h1 || !h2) return '';
  const toMin = h => h.split(':').reduce((acc, v, i) => acc + (i === 0 ? parseInt(v) * 60 : parseInt(v)), 0);
  const diff = toMin(h1) - toMin(h2);
  if (isNaN(diff)) return '';
  return `${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`;
}

function Indicator({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
      <Typography sx={{ fontSize: '0.62rem', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.textSecondary }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.2, fontSize: '0.92rem' }}>{value}</Typography>
    </Paper>
  );
}

function ObsDialog({ open, employeeName, initialValue, onClose, onSave }) {
  const [value, setValue] = useState(initialValue ?? '');
  useEffect(() => { if (open) setValue(initialValue ?? ''); }, [open, initialValue]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
        Observação{employeeName ? ` — ${employeeName}` : ''}
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth multiline rows={3} size="small" autoFocus
          value={value} onChange={e => setValue(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSave(value)}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DayOrderPayments() {
  const { userPermissions } = useStore();
  const canEdit = ![5].includes(parseInt(userPermissions));

  const [year,             setYear]             = useState(new Date().getFullYear());
  const [activeMonths,     setActiveMonths]     = useState([new Date().getMonth() + 1]);
  const [payments,         setPayments]         = useState([]);
  const [filters,          setFilters]          = useState({});   // { colCode: string[]|null }
  const [modalCol,         setModalCol]         = useState(null);
  const [editingPayment,   setEditingPayment]   = useState(null);
  const [localValues,      setLocalValues]      = useState({});
  const [obsDialog,        setObsDialog]        = useState(null); // { id, value, employeeName }
  const [selected,         setSelected]         = useState([]);

  const tableRef = useRef();

  function load(yr, mths) {
    if (!mths.length) return;
    apiFetch(`/day-order/list-all-payments?months=${mths.join(',')}&year=${yr}`)
      .then(r => r.json())
      .then(data => {
        setPayments(Array.isArray(data) ? data : []);
        setFilters({});
      });
  }

  useEffect(() => { load(year, activeMonths); }, [year, activeMonths]);

  // apply filters: null = no restriction, string[] = allowed values
  const filteredPayments = payments.filter(p =>
    COLUMNS.every(col => {
      const vals = filters[col.code];
      if (!vals) return true;
      return vals.includes(String(p[col.code]));
    })
  );

  const total = filteredPayments.reduce((acc, p) => acc + parseFloat(p.value || 0), 0);
  const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== undefined).length;

  function toggleMonth(m) {
    setActiveMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function getColumnValues(colCode) {
    // filter using all active filters EXCEPT the one for this column (cascading)
    const base = payments.filter(p =>
      COLUMNS.every(col => {
        if (col.code === colCode) return true;
        const vals = filters[col.code];
        if (!vals) return true;
        return vals.includes(String(p[col.code]));
      })
    );
    return [...new Set(base.map(p => String(p[colCode])))].sort((a, b) => {
      if (colCode === 'value') return parseFloat(a) - parseFloat(b);
      return a.localeCompare(b);
    });
  }

  function openFilter(col) {
    if (!col.filterable) return;
    setModalCol(col);
  }

  function handleFilterApply(colCode, values) {
    setFilters(prev => ({ ...prev, [colCode]: values }));
  }

  function clearAllFilters() {
    setFilters({});
  }

  async function saveValue(paymentId, value) {
    if (!canEdit) return;
    const res  = await apiFetch('/day-order/change-individual-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentId, paymentNewValue: value }),
    });
    const data = await res.json();
    if (data.error) Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' });
    else { Swal.fire('Valor atualizado!', '', 'success'); setEditingPayment(null); load(year, activeMonths); }
  }

  async function saveComments(value) {
    if (!canEdit || !obsDialog) return;
    const res  = await apiFetch('/day-order/change-individual-comments', {
      method: 'POST',
      body: JSON.stringify({ paymentId: obsDialog.id, commentsNewValue: value }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' }); return; }
    setObsDialog(null);
    load(year, activeMonths);
  }

  return (
    <Box sx={{ p: 3 }}>

      {/* ── HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Pagamentos — Ordem do Dia</Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mx: 2 }}>
          <DownloadTableExcel filename="Lista-de-Pagamentos" sheet="pagamentos" currentTableRef={tableRef.current}>
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} sx={{ fontSize: '0.78rem' }}>
              Exportar Excel
            </Button>
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
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
          <Indicator label="Total" value={`R$ ${formatMoney(total)}`} />
          <Indicator label="Registros" value={filteredPayments.length} />
        </Box>
      </Box>

      {/* ── FILTROS DE MÊS/ANO ── */}
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
                    bgcolor:    activeMonths.includes(m.num) ? COLORS.primary : 'transparent',
                    color:      activeMonths.includes(m.num) ? '#fff' : 'text.secondary',
                    border:     `1px solid ${activeMonths.includes(m.num) ? COLORS.primary : 'rgba(0,0,0,0.2)'}`,
                    cursor: 'pointer', '&:hover': { opacity: 0.85 },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ── TABELA ── */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: `1px solid ${COLORS.tableBorder}`,
          boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-track': { background: '#f0f0f0', borderRadius: 4 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.35)', borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.55)' },
        }}
      >
        <Table size="small" stickyHeader ref={tableRef}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col, ci) => {
                const hasFilter = !!filters[col.code];
                return (
                  <TableCell
                    key={col.code}
                    onClick={() => openFilter(col)}
                    sx={{
                      ...HEADER_SX,
                      bgcolor: getHeaderBg(ci),
                      color:   getHeaderColor(ci),
                      cursor: col.filterable ? 'pointer' : 'default',
                      '&:hover': col.filterable ? { bgcolor: '#ecedf2', color: COLORS.textPrimary } : {},
                      transition: 'all 0.12s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      {col.label}
                      {col.filterable && (
                        <Tooltip title={hasFilter ? 'Filtro ativo — clique para editar' : 'Filtrar coluna'} arrow>
                          <Badge variant="dot" color="warning" invisible={!hasFilter}>
                            {hasFilter
                              ? <FilterAltRoundedIcon sx={{ fontSize: 13, color: COLORS.primary }} />
                              : <FilterListRoundedIcon sx={{ fontSize: 13, color: '#c0c3d0' }} />
                            }
                          </Badge>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredPayments.map(p => {
              const isSelected = selected.includes(p.id);
              return (
              <TableRow
                key={p.id}
                onClick={() => setSelected(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                sx={{ cursor: 'pointer', bgcolor: isSelected ? '#fdab3d' : undefined, '&:hover td': { bgcolor: isSelected ? '#f09c28' : COLORS.tableHover } }}
              >
                {COLUMNS.map((col, ci) => {
                  const cellBg = isSelected ? undefined : getCellBg(ci);

                  if (col.code === 'value') return (
                    <TableCell
                      key={col.code}
                      onClick={e => { e.stopPropagation(); canEdit && setEditingPayment(p.id); }}
                      sx={{ bgcolor: cellBg, borderBottom: `1px solid ${COLORS.tableBorder}`, borderRight: `1px solid ${COLORS.tableBorder}`, py: 0.25, whiteSpace: 'nowrap', cursor: canEdit ? 'pointer' : 'default' }}
                    >
                      {editingPayment === p.id ? (
                        <TextField
                          size="small" type="number" defaultValue={p.value} sx={{ width: 90 }} autoFocus
                          onChange={e => setLocalValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveValue(p.id, localValues[p.id] ?? p.value);
                            if (e.key === 'Escape') setEditingPayment(null);
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: COLORS.primary }}>
                          R$ {formatMoney(p.value)}
                        </Typography>
                      )}
                    </TableCell>
                  );

                  if (col.code === 'paymentComments') return (
                    <TableCell
                      key={col.code}
                      onClick={e => { e.stopPropagation(); canEdit && setObsDialog({ id: p.id, value: p.paymentComments || '', employeeName: p.employeeName }); }}
                      sx={{ bgcolor: cellBg, borderBottom: `1px solid ${COLORS.tableBorder}`, borderRight: `1px solid ${COLORS.tableBorder}`, py: 0.25, cursor: canEdit ? 'pointer' : 'default', maxWidth: 200 }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: COLORS.tableCellText, fontStyle: p.paymentComments ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.paymentComments || '—'}
                      </Typography>
                    </TableCell>
                  );

                  if (col.code === 'workedTime') return (
                    <TableCell key={col.code} sx={{ bgcolor: cellBg, borderBottom: `1px solid ${COLORS.tableBorder}`, borderRight: `1px solid ${COLORS.tableBorder}`, py: 0.25, fontSize: '0.58rem', textAlign: 'center', color: COLORS.tableCellText, whiteSpace: 'nowrap' }}>
                      {subHours(p.departure, p.arrival)}
                    </TableCell>
                  );

                  return (
                    <TableCell key={col.code} sx={{ bgcolor: cellBg, borderBottom: `1px solid ${COLORS.tableBorder}`, borderRight: `1px solid ${COLORS.tableBorder}`, py: 0.25, fontSize: '0.58rem', textAlign: 'center', color: COLORS.tableCellText, whiteSpace: 'nowrap' }}>
                      {p[col.code] ?? ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            );})}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} sx={{ textAlign: 'center', py: 6, color: 'text.secondary', fontSize: '0.88rem', border: 'none' }}>
                  Nenhum pagamento encontrado para o período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── RODAPÉ ── */}
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {filteredPayments.length} de {payments.length} registro{payments.length !== 1 ? 's' : ''}
        </Typography>
        {activeFilterCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} de coluna ativo{activeFilterCount !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* ── Dialog: Editar OBS ── */}
      <ObsDialog
        open={!!obsDialog}
        employeeName={obsDialog?.employeeName}
        initialValue={obsDialog?.value}
        onClose={() => setObsDialog(null)}
        onSave={saveComments}
      />

      {/* ── FILTER MODAL (reutiliza o componente do DataTable) ── */}
      <FilterModal
        open={!!modalCol}
        column={modalCol ? { label: modalCol.label } : null}
        allValues={modalCol ? getColumnValues(modalCol.code) : []}
        activeValues={modalCol ? (filters[modalCol.code] ?? null) : null}
        onApply={values => handleFilterApply(modalCol.code, values)}
        onClose={() => setModalCol(null)}
      />
    </Box>
  );
}
