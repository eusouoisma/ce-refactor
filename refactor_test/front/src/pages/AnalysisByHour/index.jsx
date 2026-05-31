import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Select,
  FormControl, InputLabel, Chip, CircularProgress, Button, Stack,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { apiFetch } from '../../utils/api';
import { COLORS } from '../../utils/colors';
import Swal from 'sweetalert2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

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

const WEEKDAYS = [
  { v: 'ALL', l: 'TODOS' },
  { v: 'SEG', l: 'SEG' },
  { v: 'TER', l: 'TER' },
  { v: 'QUA', l: 'QUA' },
  { v: 'QUI', l: 'QUI' },
  { v: 'SEX', l: 'SEX' },
  { v: 'SAB', l: 'SAB' },
  { v: 'DOM', l: 'DOM' },
];

const WEEKDAY_LABELS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const WEEKDAY_CODES  = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];
const WEEKDAY_COLORS = ['#FF6384','#36A2EB','#4BC0C0','#FFCE56','#9966FF','#FF9F40','#C9CBCF'];

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

const todayCode = WEEKDAY_CODES[dayjs().day()];

export default function AnalysisByHour() {
  const [preset, setPreset] = useState('30');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [day, setDay] = useState(todayCode);

  const [activityOptions, setActivityOptions] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const [hourData, setHourData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/reports/available-activities')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setActivityOptions(d);
          setSelectedActivities(d);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedActivities.length === 0) { setHourData([]); return; }
    setLoading(true);
    Promise.all([
      apiFetch('/reports/analysis-by-hour', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, day, activities: selectedActivities }),
      }),
      apiFetch('/reports/analysis-by-weekday', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, day: null, applyDayFilter: false, activities: selectedActivities }),
      }),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([d1, d2]) => {
        setHourData(Array.isArray(d1?.data ?? d1) ? (d1?.data ?? d1) : []);
        setWeekData(Array.isArray(d2?.data ?? d2) ? (d2?.data ?? d2) : []);
      })
      .catch(() => { setHourData([]); setWeekData([]); })
      .finally(() => setLoading(false));
  }, [startDate, endDate, day, selectedActivities]);

  function handlePreset(key) {
    setPreset(key);
    const res = resolvePreset(key);
    if (res) { setStartDate(res.s); setEndDate(res.e); }
  }

  function toggleActivity(a) {
    setSelectedActivities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: { color: '#fff', font: { weight: 'bold', size: 13 } },
      tooltip: { callbacks: { label: ctx => `${ctx.raw} vendas` } },
    },
    scales: {
      x: { title: { display: true, text: 'Hora do Dia' }, grid: { display: false } },
      y: { beginAtZero: true, title: { display: true, text: 'Vendas' }, ticks: { stepSize: 1 } },
    },
  };

  const weekChartOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: { color: '#fff', font: { weight: 'bold', size: 13 } },
      tooltip: { callbacks: { label: ctx => `${ctx.raw} ingressos` } },
    },
    scales: {
      x: { title: { display: true, text: 'Dia da Semana' }, grid: { display: false } },
      y: { beginAtZero: true, title: { display: true, text: 'Total de Ingressos' }, ticks: { stepSize: 1 } },
    },
  };

  const hourChartData = {
    labels: hourData.map(d => d.hora),
    datasets: [{
      label: 'Total de Vendas',
      data: hourData.map(d => d.total),
      backgroundColor: '#4285F4',
      borderRadius: 6,
      barThickness: 28,
      datalabels: { color: '#fff', font: { weight: 'bold', size: 13 } },
    }],
  };

  const weekdayValues = WEEKDAY_CODES.map(code => weekData.find(d => d.dia === code)?.total || 0);
  const weekChartData = {
    labels: WEEKDAY_LABELS,
    datasets: [{
      label: 'Total de Ingressos',
      data: weekdayValues,
      backgroundColor: WEEKDAY_COLORS,
      borderRadius: 6,
      barThickness: 40,
      datalabels: { color: '#fff', font: { weight: 'bold', size: 13 } },
    }],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary">Relatórios</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>Análise por Hora</Typography>

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
        </Grid>

        {activityOptions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              ATIVIDADES
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
              {activityOptions.map(a => {
                const active = selectedActivities.includes(a);
                return (
                  <Chip
                    key={a}
                    label={a}
                    size="small"
                    onClick={() => toggleActivity(a)}
                    sx={{
                      fontWeight: active ? 600 : 400,
                      bgcolor: active ? COLORS.primary : 'transparent',
                      color: active ? '#fff' : 'text.secondary',
                      border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
                      '&:hover': { bgcolor: active ? '#005ecb' : '#f0f0f0' },
                    }}
                  />
                );
              })}
              <Button size="small" onClick={() => setSelectedActivities([...activityOptions])}>Todas</Button>
              <Button size="small" onClick={() => setSelectedActivities([])}>Limpar</Button>
            </Stack>
          </Box>
        )}
      </Paper>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2.5 }}>
        {WEEKDAYS.map(d => {
          const active = day === d.v;
          return (
            <Chip
              key={d.v}
              label={d.l}
              onClick={() => setDay(d.v)}
              sx={{
                fontWeight: active ? 700 : 400,
                bgcolor: active ? COLORS.primary : '#f0f0f0',
                color: active ? '#fff' : '#333',
                border: 'none',
                borderRadius: '20px',
                px: 0.5,
                '&:hover': { bgcolor: active ? '#005ecb' : '#e0e0e0' },
              }}
            />
          );
        })}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>Vendas por Hora do Dia</Typography>
            <Box sx={{ maxWidth: 900 }}>
              <Bar data={hourChartData} options={chartOpts} />
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>Total de Ingressos por Dia da Semana</Typography>
            <Box sx={{ maxWidth: 700 }}>
              <Bar data={weekChartData} options={weekChartOpts} />
            </Box>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
