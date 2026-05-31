import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItemButton, ListItemIcon, ListItemText,
  Checkbox, Typography, Box, InputAdornment, Divider, Chip, CircularProgress,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { COLORS } from '../../utils/colors';

const RENDER_CAP = 200;

export default function FilterModal({ open, column, allValues, activeValues, onApply, onClose, loading = false }) {
  const [search,  setSearch]  = useState('');
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setChecked(activeValues === null ? new Set(allValues) : new Set(activeValues));
  }, [open, allValues, activeValues]);

  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return allValues.filter(v =>
      v === '__VAZIO__'
        ? '(em branco)'.includes(q)
        : v.toLowerCase().includes(q)
    );
  }, [allValues, search]);

  const capped    = displayed.length > RENDER_CAP;
  const visible   = capped ? displayed.slice(0, RENDER_CAP) : displayed;

  const allChecked  = checked.size === allValues.length;
  const noneChecked = checked.size === 0;

  function toggle(val) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  function selectAll()  { setChecked(new Set(allValues)); }
  function clearAll()   { setChecked(new Set()); }

  function handleApply() {
    onApply(checked.size === allValues.length ? null : [...checked]);
    onClose();
  }

  const activeCount = activeValues ? activeValues.length : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '80vh', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: 1,
          bgcolor: COLORS.primaryAlpha,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TuneRoundedIcon sx={{ fontSize: 16, color: COLORS.primary }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3, color: COLORS.textPrimary }}>
            Filtrar: {column?.label}
          </Typography>
        </Box>
        {activeCount !== null && (
          <Chip
            size="small"
            label={`${activeCount} ativos`}
            sx={{ bgcolor: COLORS.primaryAlpha, color: COLORS.primary, fontWeight: 700, fontSize: '0.7rem', height: 22, borderRadius: '4px' }}
          />
        )}
      </DialogTitle>

      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <TextField
          fullWidth size="small" placeholder="Buscar..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.25 }}
        />
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Button size="small" variant={allChecked ? 'contained' : 'outlined'} onClick={selectAll}
            disableElevation sx={{ fontSize: '0.72rem', py: 0.4, px: 1.5, flex: 1 }}>
            Todos
          </Button>
          <Button size="small" variant={noneChecked ? 'contained' : 'outlined'} color="error" onClick={clearAll}
            disableElevation sx={{ fontSize: '0.72rem', py: 0.4, px: 1.5, flex: 1 }}>
            Limpar
          </Button>
        </Box>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: COLORS.primary }} />
          </Box>
        ) : displayed.length === 0 ? (
          <Typography sx={{ p: 3, color: COLORS.textSecondary, textAlign: 'center', fontSize: '0.85rem' }}>
            {allValues.length === 0 ? 'Sem opções disponíveis' : `Nenhum resultado para "${search}"`}
          </Typography>
        ) : (
          <>
            <List dense disablePadding>
              {visible.map(val => (
                <ListItemButton
                  key={val} dense onClick={() => toggle(val)}
                  sx={{ py: 0.55, px: 2.5, '&:hover': { bgcolor: COLORS.tableHover } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      edge="start" checked={checked.has(val)} size="small"
                      sx={{ py: 0, color: '#c4c4c4', '&.Mui-checked': { color: COLORS.primary } }}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={val === '__VAZIO__' ? <em style={{ color: '#aaa' }}>(Em branco)</em> : val}
                    primaryTypographyProps={{ fontSize: '0.82rem', color: COLORS.textPrimary }}
                  />
                </ListItemButton>
              ))}
            </List>
            {capped && (
              <Typography sx={{ px: 2.5, py: 1, fontSize: '0.75rem', color: COLORS.textSecondary, borderTop: `1px solid ${COLORS.border}` }}>
                Mostrando {RENDER_CAP} de {displayed.length} — use a busca para filtrar
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.75, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ flex: 1 }} disableElevation>
          Cancelar
        </Button>
        <Button
          onClick={handleApply} variant="contained" size="small"
          sx={{ flex: 1 }} disabled={noneChecked} disableElevation
        >
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
