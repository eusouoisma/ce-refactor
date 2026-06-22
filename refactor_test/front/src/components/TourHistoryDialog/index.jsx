import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  Box, Typography, CircularProgress, Chip,
} from '@mui/material';
import { apiFetch } from '../../utils/api';
import { COLORS } from '../../utils/colors';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function HistoryTable({ entries, emptyMsg }) {
  if (!entries.length) {
    return (
      <Typography sx={{ color: COLORS.tableCellText, fontSize: '0.8rem', py: 2, textAlign: 'center' }}>
        {emptyMsg}
      </Typography>
    );
  }
  return (
    <Table size="small" sx={{ tableLayout: 'auto' }}>
      <TableHead>
        <TableRow sx={{ bgcolor: COLORS.tableHeaderBg }}>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.56rem', color: COLORS.tableHeaderText, whiteSpace: 'nowrap', textAlign: 'center', py: 0.5, px: 1.25 }}>Data/Hora</TableCell>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.56rem', color: COLORS.tableHeaderText, whiteSpace: 'nowrap', textAlign: 'center', py: 0.5, px: 1.25 }}>Usuário</TableCell>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.56rem', color: COLORS.tableHeaderText, whiteSpace: 'nowrap', textAlign: 'center', py: 0.5, px: 1.25 }}>Campo</TableCell>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.62rem', color: COLORS.tableHeaderText, py: 0.5, px: 1.25 }}>De</TableCell>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.62rem', color: COLORS.tableHeaderText, py: 0.5, px: 1.25 }}>Para</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((e) => {
          if (e.fieldName === '__created__') return (
            <TableRow key={e.id} sx={{ '&:hover': { bgcolor: COLORS.tableHover } }}>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center', color: COLORS.tableCellText, whiteSpace: 'nowrap' }}>
                {fmtDate(e.editedAt)}
              </TableCell>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center', color: COLORS.tableCellText, whiteSpace: 'nowrap', fontWeight: 600 }}>
                {e.editedBy}
              </TableCell>
              <TableCell colSpan={3} sx={{ py: 0.4, px: 1.25, textAlign: 'center' }}>
                <Chip label="Tour criado" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} />
              </TableCell>
            </TableRow>
          );
          return (
            <TableRow key={e.id} sx={{ '&:hover': { bgcolor: COLORS.tableHover } }}>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center', color: COLORS.tableCellText,  whiteSpace: 'nowrap' }}>
                {fmtDate(e.editedAt)}
              </TableCell>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center',  color: COLORS.tableCellText, whiteSpace: 'nowrap', fontWeight: 600 }}>
                {e.editedBy}
              </TableCell>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center',  color: COLORS.tableCellText, whiteSpace: 'nowrap' }}>
                <Chip label={e.fieldLabel} size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: `${COLORS.primary}18`, color: COLORS.primary, fontWeight: 600 }} />
              </TableCell>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center',  color: COLORS.tableCellText, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.oldValue || <em style={{ color: '#bbb' }}>vazio</em>}
              </TableCell>
              <TableCell sx={{ fontSize: '0.61rem', py: 0.4, px: 1.25, textAlign: 'center',  color: COLORS.tableCellText, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.newValue || <em style={{ color: '#bbb' }}>vazio</em>}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function TourHistoryDialog({ open, tourId, onClose, showFinancial = false }) {
  const [officeHistory,    setOfficeHistory]    = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    if (!open || !tourId) return;
    setLoading(true);
    const fetches = [apiFetch(`/tours/edit-history?tour_id=${tourId}&type=office`).then(r => r.json())];
    if (showFinancial) fetches.push(apiFetch(`/tours/edit-history?tour_id=${tourId}&type=financial`).then(r => r.json()));
    Promise.all(fetches).then(([office, financial]) => {
      setOfficeHistory(Array.isArray(office) ? office : []);
      if (showFinancial) setFinancialHistory(Array.isArray(financial) ? financial : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, tourId, showFinancial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
        Histórico de Edições — Tour #{tourId}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: COLORS.primary }} />
          </Box>
        ) : (
          <Box>
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.primary, mb: 1 }}>
                Escritório
              </Typography>
              <HistoryTable entries={officeHistory} emptyMsg="Nenhuma edição registrada pelo escritório." />
            </Box>

            {showFinancial && (
              <Box sx={{ px: 2, pt: 2, pb: 1.5, borderTop: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00c875', mb: 1 }}>
                  Financeiro
                </Typography>
                <HistoryTable entries={financialHistory} emptyMsg="Nenhuma edição registrada pelo financeiro." />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose} variant="text" sx={{ color: COLORS.tableCellText }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
