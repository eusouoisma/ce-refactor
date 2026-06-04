import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Chip, Tooltip, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { apiFetch } from '../../utils/api';
import { COLORS } from '../../utils/colors';

const STATE_CHIP = {
  Pago:      { color: 'success' },
  Pendente:  { color: 'warning' },
  Criado:    { color: 'default' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmtMoney(val, currency) {
  if (!val) return '';
  return `${currency || 'BRL'} ${parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function PlanneTourImport() {
  const navigate = useNavigate();
  const [tours,   setTours]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function load() {
    setLoading(true);
    setError('');
    apiFetch('/planne/available-tours')
      .then(r => r.json())
      .then(data => {
        setTours(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao buscar tours da Planne. Tente novamente.');
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, []);

  function handleImport(tour) {
    navigate('/cadastrar-tour', {
      state: {
        planneId:   tour.planneId,
        planneData: {
          orderRef:      tour.orderRef,
          platform:      'Planne',
          tourDate:      tour.tourDate,
          tourHour:      tour.tourHour,
          activity:      tour.activity,
          language:      tour.language,
          client:        tour.client,
          clientName:    tour.clientName,
          clientContact: tour.clientContact,
          country:       tour.country,
          totalValue:    tour.totalValue,
          currency:      tour.currency,
          paymentStatus: tour.paymentStatus,
          comments:      tour.comments || '',
        },
      },
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Importar Tours da Planne</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: COLORS.textSecondary, mt: 0.25 }}>
            Tours com pagamento recebido ou pendente ainda não importados
          </Typography>
        </Box>
        <Tooltip title="Recarregar">
          <IconButton onClick={load} disabled={loading}>
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2, fontSize: '0.85rem' }}>{error}</Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      ) : tours.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: COLORS.textSecondary }}>
          <Typography sx={{ fontSize: '0.9rem' }}>Nenhum tour pendente de importação.</Typography>
        </Box>
      ) : (
        <>
          <Typography sx={{ fontSize: '0.75rem', color: COLORS.textSecondary, mb: 1 }}>
            {tours.length} tour{tours.length !== 1 ? 's' : ''} disponíve{tours.length !== 1 ? 'is' : 'l'}
          </Typography>
          <TableContainer component={Paper} sx={{
            borderRadius: 2, border: `1px solid ${COLORS.border}`,
            boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
            maxHeight: 'calc(100vh - 240px)', overflow: 'auto',
            '&::-webkit-scrollbar': { width: 6, height: 6 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.14)', borderRadius: 4 },
          }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Data', 'Hora', 'Atividade', 'Cliente', 'País', 'Idioma', 'Valor', 'Status', 'Reserva', ''].map(h => (
                    <TableCell key={h} sx={{
                      fontWeight: 600, fontSize: '0.58rem', textTransform: 'uppercase',
                      letterSpacing: '0.04em', bgcolor: COLORS.tableHeaderBg,
                      color: COLORS.tableHeaderText, py: 0.35, px: 1,
                      borderBottom: `2px solid ${COLORS.border}`,
                      position: 'sticky', top: 0, zIndex: 2,
                    }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((t, i) => (
                  <TableRow key={t.planneId} sx={{
                    bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                    '&:hover': { bgcolor: COLORS.tableHover },
                  }}>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1, whiteSpace: 'nowrap' }}>{fmtDate(t.tourDate)}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1, whiteSpace: 'nowrap' }}>{t.tourHour}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1, fontWeight: 600 }}>{t.activity || <em style={{ color: '#bbb' }}>—</em>}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1 }}>{t.client}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1 }}>{t.country?.[0] || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1 }}>{t.language}</TableCell>
                    <TableCell sx={{ fontSize: '0.66rem', py: 0.3, px: 1, whiteSpace: 'nowrap' }}>{fmtMoney(t.totalValue, t.currency)}</TableCell>
                    <TableCell sx={{ py: 0.3, px: 1 }}>
                      <Chip
                        label={t.paymentStatus}
                        size="small"
                        color={STATE_CHIP[t.paymentStatus]?.color || 'default'}
                        sx={{ fontSize: '0.58rem', height: 18 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.64rem', py: 0.3, px: 1, color: COLORS.textSecondary, fontFamily: 'monospace' }}>{t.planneCode}</TableCell>
                    <TableCell sx={{ py: 0.3, px: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<FileDownloadRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleImport(t)}
                        sx={{ fontSize: '0.64rem', py: 0.3, px: 1.25, whiteSpace: 'nowrap' }}
                      >
                        Importar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
