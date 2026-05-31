import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, Chip, Tooltip,
} from '@mui/material';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { useReactToPrint } from 'react-to-print';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { apiFetch } from '../../utils/api';
import { COLORS } from '../../utils/colors';

const LINHAS_EXTRAS = 5;

const COLUMNS = [
  { key: 'n',             label: 'N°',             width: '3%',  center: true  },
  { key: 'guideAgency',   label: 'Guia / Agência', width: '10%' },
  { key: 'adulto',        label: 'Adulto',         width: '4%',  center: true },
  { key: 'net',           label: 'NET',            width: '4%',  center: true },
  { key: 'brasileiro',    label: 'Brasileiro',     width: '5%',  center: true },
  { key: 'meia',          label: 'Meia',           width: '4%',  center: true },
  { key: 'free',          label: 'Free',           width: '4%',  center: true },
  { key: 'total',         label: 'Total',          width: '4%',  center: true },
  { key: 'nomePax',       label: 'Nome do Cliente',width: '12%' },
  { key: 'guia',          label: 'Guia',           width: '5%'  },
  { key: 'paymentMethod', label: 'Forma de pgto',  width: '8%'  },
  { key: 'valorTotal',    label: 'Valor Total',    width: '7%'  },
  { key: 'comissao',      label: 'Comissão',       width: '5%',  center: true },
  { key: 'statusPgto',    label: 'Status do pgto', width: '7%'  },
  { key: 'obs',           label: 'OBS',            width: '24%' },
];

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function PrintList() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [hours, setHours] = useState([]);
  const [tours, setTours] = useState([]);

  const [verdeInicio, setVerdeInicio] = useState('');
  const [verdeFim, setVerdeFim] = useState('');
  const [azulInicio, setAzulInicio] = useState('');
  const [azulFim, setAzulFim] = useState('');
  const [cobrador, setCobrador] = useState('');

  const printRef = useRef(null);
  const excelRef = useRef(null);

  useEffect(() => {
    if (!selectedDate) {
      setHours([]);
      setSelectedHour('');
      return;
    }
    apiFetch(`/tours/available-hours?date=${selectedDate}&type=regular&status=Confirmado`)
      .then(r => r.json())
      .then(d => {
        setHours(Array.isArray(d) ? d : []);
        setSelectedHour('');
      })
      .catch(() => setHours([]));
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || !selectedHour) {
      setTours([]);
      return;
    }
    apiFetch(`/tours/regular-list?date=${selectedDate}&hour=${selectedHour}`)
      .then(r => r.json())
      .then(d => setTours(Array.isArray(d) ? d : []))
      .catch(() => setTours([]));
  }, [selectedDate, selectedHour]);

  const linhasExtras = Array.from({ length: LINHAS_EXTRAS }, (_, i) => ({
    n: tours.length + i + 1,
  }));

  const allRows = [...tours, ...linhasExtras];

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `TOUR_REGULAR_${formatDateBR(selectedDate)}_${selectedHour}`,
    removeAfterPrint: true,
    pageStyle: `
      @page {
        size: landscape;
        margin: 18mm 10mm;
      }
      @media print {
        body { background: white !important; font-family: Arial, sans-serif !important; }
        .print-area { padding: 0 !important; box-sizing: border-box; width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
        .print-area .editable-input { border: none !important; outline: none !important; background: transparent !important; }
        table { width: 100% !important; max-width: 100% !important; box-sizing: border-box; table-layout: fixed !important; border-collapse: collapse !important; }
        th, td { word-break: break-word !important; overflow-wrap: break-word !important; white-space: pre-line !important; font-size: 12px !important; padding: 4px !important; border: 1px solid #000 !important; }
        thead th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-weight: bold !important; }
      }
    `,
  });

  const hasData = selectedDate && selectedHour;

  return (
    <Box sx={{ p: 3 }}>

      {/* Page header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
          Imprimir Lista
        </Typography>
        <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.875rem' }}>
          Selecione uma data e horário para gerar a folha de tour regular para impressão.
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventRoundedIcon sx={{ fontSize: 14 }} /> Data
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 14 }} /> Horário
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedHour}
                  onChange={e => setSelectedHour(e.target.value)}
                  displayEmpty
                  disabled={!selectedDate || hours.length === 0}
                >
                  <MenuItem value=""><em>Selecione</em></MenuItem>
                  {hours.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {hasData && (
              <Grid item xs={12} sm md sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: { xs: 1, sm: 2.5 } }}>
                <DownloadTableExcel
                  filename={`TOUR_REGULAR_${formatDateBR(selectedDate)}_${selectedHour}`}
                  sheet="Lista de Tours"
                  currentTableRef={excelRef.current}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadRoundedIcon />}
                    disableElevation
                    sx={{ textTransform: 'none' }}
                  >
                    Exportar Excel
                  </Button>
                </DownloadTableExcel>
                <Button
                  variant="contained"
                  startIcon={<PrintRoundedIcon />}
                  onClick={handlePrint}
                  disableElevation
                  sx={{ textTransform: 'none' }}
                >
                  Imprimir
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {!hasData && (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '50%',
              bgcolor: COLORS.primaryAlpha,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 2,
            }}>
              <PrintRoundedIcon sx={{ fontSize: 28, color: COLORS.primary }} />
            </Box>
            <Typography sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
              Nenhuma lista carregada
            </Typography>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
              Escolha uma data e um horário acima para visualizar a folha de impressão.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Print preview — visible on screen, looks like an A4 sheet */}
      {hasData && (
        <Card sx={{ p: 0, overflow: 'visible' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label="Pré-visualização"
                  size="small"
                  sx={{ bgcolor: COLORS.primaryAlpha, color: COLORS.primary, fontWeight: 700, height: 22 }}
                />
                <Typography sx={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>
                  Os campos abaixo são editáveis e aparecerão na impressão.
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.78rem', color: COLORS.textSecondary }}>
                {tours.length} {tours.length === 1 ? 'registro' : 'registros'} + {LINHAS_EXTRAS} linhas em branco
              </Typography>
            </Box>

            {/* Print area — styled to look like paper */}
            <Box
              ref={printRef}
              className="print-area"
              sx={{
                bgcolor: '#ffffff',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 1.5,
                p: { xs: 2, md: 3 },
                color: '#000',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {/* Title */}
              <Typography sx={{
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '0.5px',
                mb: 1.5,
                color: '#000',
              }}>
                TOUR REGULAR - CARNAVAL EXPERIENCE
              </Typography>

              {/* Info row */}
              <Box className="info-row" sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 1.5,
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: '#000',
              }}>
                <Box>Data: <strong>{formatDateBR(selectedDate)}</strong></Box>
                <Box>Hora: <strong>{selectedHour}</strong></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  <span>VERDE:</span>
                  <input
                    className="editable-input"
                    value={verdeInicio}
                    onChange={e => setVerdeInicio(e.target.value)}
                    style={inputStyle(48)}
                  />
                  <span>à</span>
                  <input
                    className="editable-input"
                    value={verdeFim}
                    onChange={e => setVerdeFim(e.target.value)}
                    style={inputStyle(48)}
                  />
                  <span style={{ margin: '0 4px' }}>|</span>
                  <span>AZUL:</span>
                  <input
                    className="editable-input"
                    value={azulInicio}
                    onChange={e => setAzulInicio(e.target.value)}
                    style={inputStyle(48)}
                  />
                  <span>à</span>
                  <input
                    className="editable-input"
                    value={azulFim}
                    onChange={e => setAzulFim(e.target.value)}
                    style={inputStyle(48)}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>Cobrador:</span>
                  <input
                    className="editable-input"
                    value={cobrador}
                    onChange={e => setCobrador(e.target.value)}
                    style={inputStyle(120)}
                  />
                </Box>
              </Box>

              {/* Print table */}
              <Box sx={{ overflowX: 'auto', mt: 1 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      {COLUMNS.map(col => (
                        <th key={col.key} style={{
                          border: '1px solid #000',
                          padding: '5px 4px',
                          width: col.width,
                          background: '#f0f0f0',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          textAlign: 'center',
                        }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((row, idx) => (
                      <tr key={idx}>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{
                            border: '1px solid #000',
                            padding: '5px 4px',
                            fontSize: '0.78rem',
                            textAlign: col.center ? 'center' : 'left',
                            color: '#000',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-line',
                            verticalAlign: 'top',
                            minHeight: 22,
                          }}>
                            {row[col.key] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>

            {/* Hidden Excel export table */}
            <Box sx={{ display: 'none' }}>
              <table ref={excelRef}>
                <thead>
                  <tr><th colSpan={COLUMNS.length}>TOUR REGULAR - CARNAVAL EXPERIENCE</th></tr>
                  <tr>
                    <th>Data: {formatDateBR(selectedDate)}</th>
                    <th>Hora: {selectedHour}</th>
                    <th>VERDE: {verdeInicio} à {verdeFim}</th>
                    <th>AZUL: {azulInicio} à {azulFim}</th>
                    <th>Cobrador: {cobrador}</th>
                    <th colSpan={COLUMNS.length - 5}></th>
                  </tr>
                  <tr><th colSpan={COLUMNS.length}></th></tr>
                  <tr>
                    {COLUMNS.map(col => <th key={col.key}>{col.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((row, idx) => (
                    <tr key={idx}>
                      {COLUMNS.map(col => <td key={col.key}>{row[col.key] ?? ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function inputStyle(width) {
  return {
    width,
    padding: '2px 6px',
    fontSize: '0.85rem',
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 6,
    background: '#fafafa',
    fontFamily: 'inherit',
    color: '#000',
    outline: 'none',
  };
}
