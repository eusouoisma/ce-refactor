import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Select,
  FormControl, InputLabel, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, CircularProgress,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';
import Swal from 'sweetalert2';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PRESETS = [
  { v: 'custom',         l: 'Intervalo personalizado' },
  { v: '30',             l: 'Últimos 30 dias' },
  { v: '90',             l: 'Últimos 90 dias' },
  { v: '365',            l: 'Últimos 365 dias' },
  { v: 'last_month',     l: 'Mês passado' },
  { v: 'last_12_months', l: 'Últimos 12 meses' },
  { v: 'last_year',      l: 'Ano passado' },
  { v: 'this_year',      l: 'Este ano' },
  { v: 'all',            l: 'Toda a história' },
];

function resolvePreset(key) {
  const f = 'YYYY-MM-DD';
  let s, e = dayjs().format(f);
  switch (key) {
    case '30':             s = dayjs().subtract(30, 'day').format(f); break;
    case '90':             s = dayjs().subtract(90, 'day').format(f); break;
    case '365':            s = dayjs().subtract(365, 'day').format(f); break;
    case 'last_month':     s = dayjs().subtract(1,'month').startOf('month').format(f); e = dayjs().subtract(1,'month').endOf('month').format(f); break;
    case 'last_12_months': s = dayjs().subtract(12,'month').startOf('month').format(f); break;
    case 'last_year':      s = dayjs().subtract(1,'year').startOf('year').format(f); e = dayjs().subtract(1,'year').endOf('year').format(f); break;
    case 'this_year':      s = dayjs().startOf('year').format(f); e = dayjs().endOf('year').format(f); break;
    case 'all':            s = '2020-01-01'; break;
    default: return null;
  }
  return { s, e };
}

function fmtCurrency(v, currency) {
  const c = ['BRL','USD','EUR'].includes(currency) ? currency : 'BRL';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: c });
}

const thSx = {
  bgcolor: COLORS.tableHeaderBg,
  color: COLORS.tableHeaderText,
  fontWeight: 600,
  fontSize: '0.58rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: `2px solid ${COLORS.border}`,
  borderRight: `1px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
  py: 0.3,
  px: 1,
};

const cellSx = (i) => ({
  fontSize: '0.66rem',
  py: 0.25,
  px: 1,
  bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
  borderRight: `1px solid ${COLORS.border}`,
  borderBottom: `1px solid ${COLORS.border}`,
});

export default function AnalysisByCountry() {
  const { userPermissions } = useStore();
  const isOnlyReportsUser = parseInt(userPermissions) === 6;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState('365');
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [orderBy, setOrderBy] = useState('pax');
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(10);

  useEffect(() => {
    setLoading(true);
    apiFetch('/reports/analysis-by-country', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, orderBy, from, to }),
    })
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate, orderBy, from, to]);

  function handlePreset(key) {
    setPreset(key);
    const res = resolvePreset(key);
    if (res) { setStartDate(res.s); setEndDate(res.e); }
  }

  const pieOpts = {
    plugins: {
      datalabels: {
        color: '#fff',
        formatter: (_, ctx) => ctx.chart.data.labels[ctx.dataIndex],
        font: { weight: 'bold', size: 12 },
      },
      legend: { position: 'bottom' },
    },
  };

  const bgColors = data.map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`);
  const piePax = {
    labels: data.map(d => d.country || 'N/A'),
    datasets: [{ data: data.map(d => d.totalPax), backgroundColor: bgColors, borderWidth: 1 }],
  };
  const pieValor = {
    labels: data.map(d => d.country || 'N/A'),
    datasets: [{ data: data.map(d => parseFloat(d.valorTotal)), backgroundColor: data.map((_, i) => `hsl(${(i * 67) % 360}, 70%, 60%)`), borderWidth: 1 }],
  };

  const cols = isOnlyReportsUser ? 4 : 6;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary">Relatórios</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>Análise por País</Typography>

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
                  <TableCell sx={thSx}>País</TableCell>
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
                ) : data.map((row, i) => (
                  <TableRow key={i} sx={{ '&:hover td': { bgcolor: COLORS.tableHover } }}>
                    <TableCell sx={cellSx(i)}>{row.index}</TableCell>
                    <TableCell sx={cellSx(i)}>{row.country || 'N/A'}</TableCell>
                    <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{row.totalPax}</TableCell>
                    <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{parseFloat(row.paxPercent || 0).toFixed(2)}%</TableCell>
                    {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{fmtCurrency(row.valorTotal, row.currency)}</TableCell>}
                    {!isOnlyReportsUser && <TableCell sx={{ ...cellSx(i), textAlign: 'right' }}>{parseFloat(row.valorPercent || 0).toFixed(2)}%</TableCell>}
                  </TableRow>
                ))}
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
    </Box>
  );
}
