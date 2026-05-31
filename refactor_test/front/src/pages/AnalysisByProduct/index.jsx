import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Select,
  FormControl, InputLabel, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, CircularProgress, Divider,
} from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';
import Swal from 'sweetalert2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const PRESETS = [
  { v: 'custom',      l: 'Intervalo personalizado' },
  { v: '30',          l: 'Últimos 30 dias' },
  { v: '90',          l: 'Últimos 90 dias' },
  { v: '365',         l: 'Últimos 365 dias' },
  { v: 'last_month',  l: 'Mês passado' },
  { v: 'last_year',   l: 'Ano passado' },
  { v: 'this_year',   l: 'Este ano' },
  { v: 'all',         l: 'Toda a história' },
];

function resolvePreset(key) {
  const f = 'YYYY-MM-DD';
  let s, e = dayjs().format(f);
  switch (key) {
    case '30':         s = dayjs().subtract(30, 'day').format(f); break;
    case '90':         s = dayjs().subtract(90, 'day').format(f); break;
    case '365':        s = dayjs().subtract(365, 'day').format(f); break;
    case 'last_month': s = dayjs().subtract(1,'month').startOf('month').format(f); e = dayjs().subtract(1,'month').endOf('month').format(f); break;
    case 'last_year':  s = dayjs().subtract(1,'year').startOf('year').format(f); e = dayjs().subtract(1,'year').endOf('year').format(f); break;
    case 'this_year':  s = dayjs().startOf('year').format(f); e = dayjs().endOf('year').format(f); break;
    case 'all':        s = '2020-01-01'; break;
    default: return null;
  }
  return { s, e };
}

function fmtCurrency(v, currency = 'BRL') {
  const c = ['BRL','USD','EUR'].includes(currency) ? currency : 'BRL';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: c });
}

function dash(v) { return (v && v !== 0) ? v : '-'; }
function dashPct(v) { const n = parseFloat(v); return (n && n !== 0) ? `${n.toFixed(2)}%` : '-'; }
function dashCur(v) { return (v && v !== 0) ? fmtCurrency(v) : '-'; }

const thSx = {
  bgcolor: COLORS.tableHeaderBg,
  color: COLORS.tableHeaderText,
  fontWeight: 600,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: `2px solid ${COLORS.border}`,
  borderRight: `1px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
  py: 1,
  px: 1.5,
};

const cellSx = (i, bold) => ({
  fontSize: '0.82rem',
  py: 0.75,
  px: 1.5,
  bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
  borderRight: `1px solid ${COLORS.border}`,
  borderBottom: `1px solid ${COLORS.border}`,
  fontWeight: bold ? 700 : 400,
});

const totalRowSx = {
  fontSize: '0.82rem',
  py: 0.75,
  px: 1.5,
  bgcolor: '#f0f0f0',
  borderRight: `1px solid ${COLORS.border}`,
  borderBottom: `1px solid ${COLORS.border}`,
  fontWeight: 700,
};

export default function AnalysisByProduct() {
  const { userPermissions } = useStore();
  const isOnlyReportsUser = parseInt(userPermissions) === 6;

  const [data, setData] = useState([]);
  const [totalData, setTotalData] = useState({ totalPax: 0, totalValor: 0, currency: 'BRL' });
  const [regularData, setRegularData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [preset, setPreset] = useState('365');
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [orderBy, setOrderBy] = useState('pax');
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(10);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/reports/analysis-by-product', { method: 'POST', body: JSON.stringify({ startDate, endDate, orderBy, from, to }) }),
      apiFetch('/reports/analysis-by-product', { method: 'POST', body: JSON.stringify({ startDate, endDate, orderBy, from: 1, to: 999999 }) }),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([d1, d2]) => {
        setData(Array.isArray(d1) ? d1 : []);
        const all = Array.isArray(d2) ? d2 : [];
        const totalPax   = all.reduce((s, r) => s + parseInt(r.totalPax || 0), 0);
        const totalValor = all.reduce((s, r) => s + parseFloat(r.valorTotal || 0), 0);
        const currency   = all.length > 0 ? (['BRL','USD','EUR'].includes(all[0].currency) ? all[0].currency : 'BRL') : 'BRL';
        setTotalData({ totalPax, totalValor, currency });
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate, orderBy, from, to]);

  useEffect(() => {
    setLoadingReg(true);
    apiFetch('/reports/analysis-regular-tour', { method: 'POST', body: JSON.stringify({ startDate, endDate }) })
      .then(r => r.json())
      .then(d => setRegularData(d || null))
      .catch(() => setRegularData(null))
      .finally(() => setLoadingReg(false));
  }, [startDate, endDate]);

  function handlePreset(key) {
    setPreset(key);
    const res = resolvePreset(key);
    if (res) { setStartDate(res.s); setEndDate(res.e); }
  }

  const pieOpts = {
    plugins: {
      datalabels: { color: '#fff', formatter: (_, ctx) => ctx.chart.data.labels[ctx.dataIndex], font: { weight: 'bold', size: 12 } },
      legend: { position: 'bottom' },
    },
  };

  const barOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: { color: '#444', anchor: 'end', align: 'top', formatter: v => v, font: { weight: 'bold' } },
    },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const barValueOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#444', anchor: 'end', align: 'top', font: { weight: 'bold' },
        formatter: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
      },
    },
  };

  const pieBg = data.map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`);
  const piePax = {
    labels: data.map(d => d.activity || 'N/A'),
    datasets: [{ data: data.map(d => d.totalPax), backgroundColor: pieBg, borderWidth: 1 }],
  };
  const pieValor = {
    labels: data.map(d => d.activity || 'N/A'),
    datasets: [{ data: data.map(d => Number(d.valorTotal)), backgroundColor: data.map((_, i) => `hsl(${(i * 67) % 360}, 70%, 60%)`), borderWidth: 1 }],
  };

  const barPaxData = regularData ? {
    labels: ['Adulto','Meia','Cortesia','Net'],
    datasets: [{
      data: [regularData.paxAdult||0, regularData.paxHalf||0, regularData.paxFree||0, regularData.paxNet||0],
      backgroundColor: ['rgba(54,162,235,0.7)','rgba(75,192,192,0.7)','rgba(255,206,86,0.7)','rgba(153,102,255,0.7)'],
      borderColor:     ['rgba(54,162,235,1)','rgba(75,192,192,1)','rgba(255,206,86,1)','rgba(153,102,255,1)'],
      borderWidth: 1,
      borderRadius: 6,
    }],
  } : null;

  const barValorData = regularData ? {
    labels: ['Adulto','Meia','Cortesia','Net'],
    datasets: [{
      data: [regularData.valorAdult||0, regularData.valorHalf||0, regularData.valorFree||0, regularData.valorNet||0],
      backgroundColor: ['rgba(255,99,132,0.7)','rgba(255,159,64,0.7)','rgba(201,203,207,0.7)','rgba(153,102,255,0.7)'],
      borderColor:     ['rgba(255,99,132,1)','rgba(255,159,64,1)','rgba(201,203,207,1)','rgba(153,102,255,1)'],
      borderWidth: 1,
      borderRadius: 6,
    }],
  } : null;

  const cols = isOnlyReportsUser ? 4 : 6;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary">Relatórios</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>Análise por Produto</Typography>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Intervalo</InputLabel>
              <Select value={preset} label="Intervalo" onChange={e => handlePreset(e.target.value)}>
                {PRESETS.map(p => <MenuItem key={p.v} value={p.v}>{p.l}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField fullWidth size="small" type="date" label="Data Inicial" value={startDate}
              InputLabelProps={{ shrink: true }}
              onChange={e => {
                const v = e.target.value;
                if (v > endDate) { Swal.fire({ icon: 'warning', title: 'Data inválida', text: 'A data inicial não pode ser maior que a final.' }); return; }
                setStartDate(v); setPreset('custom');
              }} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField fullWidth size="small" type="date" label="Data Final" value={endDate}
              InputLabelProps={{ shrink: true }}
              onChange={e => {
                const v = e.target.value;
                if (v < startDate) { Swal.fire({ icon: 'warning', title: 'Data inválida', text: 'A data final não pode ser menor que a inicial.' }); return; }
                setEndDate(v); setPreset('custom');
              }} />
          </Grid>
          <Grid item xs={4} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar</InputLabel>
              <Select value={orderBy} label="Ordenar" onChange={e => setOrderBy(e.target.value)}>
                <MenuItem value="pax">Pax</MenuItem>
                <MenuItem value="valor">Valor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} sm={1}>
            <TextField fullWidth size="small" label="De" type="number" value={from} inputProps={{ min: 1 }}
              onChange={e => {
                const v = parseInt(e.target.value) || 1;
                if (v > to) { Swal.fire({ icon: 'warning', title: 'Faixa inválida', text: 'O número inicial não pode ser maior que o final.' }); return; }
                setFrom(v);
              }} />
          </Grid>
          <Grid item xs={4} sm={1}>
            <TextField fullWidth size="small" label="Até" type="number" value={to} inputProps={{ min: from }}
              onChange={e => {
                const v = parseInt(e.target.value) || 10;
                if (v < from) { Swal.fire({ icon: 'warning', title: 'Faixa inválida', text: 'O número final não pode ser menor que o inicial.' }); return; }
                setTo(v);
              }} />
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={thSx}>#</TableCell>
                  <TableCell sx={thSx}>Produto</TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'right' }}>Total Pax</TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'right' }}>% Pax</TableCell>
                  {!isOnlyReportsUser && <TableCell sx={{ ...thSx, textAlign: 'right' }}>Valor Total</TableCell>}
                  {!isOnlyReportsUser && <TableCell sx={{ ...thSx, textAlign: 'right' }}>% Valor</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cols} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover td': { bgcolor: COLORS.tableHover } }}>
                        <TableCell sx={cellSx(i)}>{row.index}</TableCell>
                        <TableCell sx={cellSx(i)}>{row.activity || 'N/A'}</TableCell>
                        <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{row.totalPax}</TableCell>
                        <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{parseFloat(row.paxPercent || 0).toFixed(2)}%</TableCell>
                        {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{fmtCurrency(row.valorTotal, row.currency)}</TableCell>}
                        {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{parseFloat(row.valorPercent || 0).toFixed(2)}%</TableCell>}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={totalRowSx}>TOTAL GERAL DO PERÍODO</TableCell>
                      <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>{totalData.totalPax}</TableCell>
                      <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>100%</TableCell>
                      {!isOnlyReportsUser && <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>{fmtCurrency(totalData.totalValor, totalData.currency)}</TableCell>}
                      {!isOnlyReportsUser && <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>100%</TableCell>}
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {data.length > 0 && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={isOnlyReportsUser ? 8 : 6}>
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Typography fontWeight={600} sx={{ mb: 2 }}>Distribuição por Pax</Typography>
                  <Box sx={{ maxWidth: 420, mx: 'auto' }}>
                    <Pie data={piePax} options={pieOpts} />
                  </Box>
                </Paper>
              </Grid>
              {!isOnlyReportsUser && (
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography fontWeight={600} sx={{ mb: 2 }}>Distribuição por Valor</Typography>
                    <Box sx={{ maxWidth: 420, mx: 'auto' }}>
                      <Pie data={pieValor} options={pieOpts} />
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Análise de Tours Regulares</Typography>

      {loadingReg ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
      ) : regularData ? (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={thSx}>Tipo</TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'right' }}>Total Pax</TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'right' }}>% Pax</TableCell>
                  {!isOnlyReportsUser && <TableCell sx={{ ...thSx, textAlign: 'right' }}>Valor Total</TableCell>}
                  {!isOnlyReportsUser && <TableCell sx={{ ...thSx, textAlign: 'right' }}>% Valor</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: 'Adulto',   pax: regularData.paxAdult,   pct: regularData.percentAdult,      val: regularData.valorAdult,  vPct: regularData.percentValorAdult },
                  { label: 'Meia',     pax: regularData.paxHalf,    pct: regularData.percentHalf,       val: regularData.valorHalf,   vPct: regularData.percentValorHalf },
                  { label: 'Cortesia', pax: regularData.paxFree,    pct: regularData.percentFree,       val: regularData.valorFree,   vPct: regularData.percentValorFree },
                  { label: 'Net',      pax: regularData.paxNet,     pct: regularData.percentNet,        val: regularData.valorNet,    vPct: regularData.percentValorNet },
                ].map((r, i) => (
                  <TableRow key={r.label} sx={{ '&:hover td': { bgcolor: COLORS.tableHover } }}>
                    <TableCell sx={cellSx(i)}>{r.label}</TableCell>
                    <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{dash(r.pax)}</TableCell>
                    <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{dashPct(r.pct)}</TableCell>
                    {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{dashCur(r.val)}</TableCell>}
                    {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{dashPct(r.vPct)}</TableCell>}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={totalRowSx}>Total</TableCell>
                  <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>{regularData.totalPax || '-'}</TableCell>
                  <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>100%</TableCell>
                  {!isOnlyReportsUser && <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>{regularData.totalValor ? fmtCurrency(regularData.totalValor) : '-'}</TableCell>}
                  {!isOnlyReportsUser && <TableCell sx={{ ...totalRowSx, textAlign: 'right' }}>100%</TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={3}>
            <Grid item xs={12} md={isOnlyReportsUser ? 8 : 6}>
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography fontWeight={600} sx={{ mb: 2 }}>Distribuição por Tipo de Pax — Tour Regular</Typography>
                <Bar data={barPaxData} options={barOpts} />
              </Paper>
            </Grid>
            {!isOnlyReportsUser && (
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Typography fontWeight={600} sx={{ mb: 2 }}>Distribuição por Valor — Tour Regular</Typography>
                  <Bar data={barValorData} options={barValueOpts} />
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      ) : (
        <Typography color="text.secondary">Nenhum dado de tour regular encontrado para o período.</Typography>
      )}
    </Box>
  );
}
