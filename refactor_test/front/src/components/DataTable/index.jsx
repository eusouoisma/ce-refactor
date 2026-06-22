import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Checkbox, CircularProgress,
  Typography, Tooltip, Badge,
} from '@mui/material';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import FilterModal from './FilterModal';
import { COLORS } from '../../utils/colors';

const ACCENT_H = COLORS.tableHeaderAltBg;
const ACCENT_B = COLORS.tableCellAltBg;  // light blue alt cell

function getHeaderBg(visIdx, altColumns) {
  if (!altColumns) return COLORS.tableHeaderBg;
  return visIdx % 2 === 0 ? ACCENT_H : COLORS.tableHeaderBg;
}

function getHeaderTextColor(visIdx, altColumns) {
  if (!altColumns) return COLORS.tableHeaderText;
  return visIdx % 2 === 0 ? COLORS.primary : COLORS.tableHeaderText;
}

function getCellBg(visIdx, altColumns, isSelected) {
  if (!altColumns || isSelected) return undefined;
  return visIdx % 2 === 0 ? ACCENT_B : '#ffffff';
}

/**
 * DataTable — Monday.com board style
 *
 * Props:
 *   columns        : Array<{ key, label, filterable?, render? }>
 *   rows           : object[]
 *   filters        : { [key]: string[]|null }
 *   onFilterChange : (key, values: string[]|null) => void
 *   loading        : boolean
 *   selectable     : boolean
 *   selected       : number[]
 *   onSelectChange : (ids) => void
 *   actions        : (row) => ReactNode
 *   onRowClick     : (row) => void
 *   emptyMessage   : string
 *   altColumns     : boolean
 *   getRowSx       : (row) => object
 *   onBottomReached: () => void
 *   bottomThreshold: number
 *
 *   One of the two below (fetchOptions takes priority):
 *   fetchOptions   : (colKey: string, signal: AbortSignal) => Promise<string[]>
 *                    Lazy fetch per column. DataTable caches results and
 *                    invalidates cache when this function reference changes.
 *   filterOptions  : { [key]: string[] }
 *                    Pre-loaded options (static / already fetched by parent).
 */
export default function DataTable({
  columns = [],
  rows = [],
  filterOptions = {},
  filters = {},
  onFilterChange,
  loading = false,
  selectable = false,
  selected = [],
  onSelectChange,
  actions,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado.',
  altColumns = false,
  getRowSx,
  tableRef,
  onBottomReached,
  bottomThreshold = 400,
  fetchOptions,
}) {
  const [modalCol, setModalCol] = useState(null);
  const scrollRef = useRef(null);

  // ── Lazy options cache ──────────────────────────────────────────────────────
  const [cachedOptions, setCachedOptions] = useState({});
  const [loadingColKey, setLoadingColKey] = useState(null);
  const optionsFetchRef = useRef(null);
  const prevFetchOptionsRef = useRef(fetchOptions);

  // Invalidate cache whenever fetchOptions reference changes (parent context changed)
  useEffect(() => {
    if (prevFetchOptionsRef.current !== fetchOptions) {
      prevFetchOptionsRef.current = fetchOptions;
      setCachedOptions({});
      setLoadingColKey(null);
      optionsFetchRef.current?.abort();
    }
  }, [fetchOptions]);

  // ── Scroll pagination ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onBottomReached) return;
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    function check() {
      ticking = false;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - (scrollTop + clientHeight) <= bottomThreshold) {
        onBottomReached();
      }
    }
    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(check); ticking = true; }
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => el.removeEventListener('scroll', onScroll);
  }, [onBottomReached, bottomThreshold, rows.length]);

  // ── Column filter open ───────────────────────────────────────────────────────
  function openFilter(col) {
    if (!col.filterable) return;
    setModalCol(col);

    if (!fetchOptions) return; // using pre-loaded filterOptions

    const key = col.key;

    // Always re-fetch on open so cascading filters reflect current active filters.
    // Show stale cache (if any) while loading so the modal isn't blank.
    optionsFetchRef.current?.abort();
    const ctrl = new AbortController();
    optionsFetchRef.current = ctrl;
    setLoadingColKey(key);

    fetchOptions(key, ctrl.signal)
      .then(opts => {
        if (ctrl.signal.aborted) return;
        setCachedOptions(prev => ({ ...prev, [key]: opts }));
        setLoadingColKey(null);
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        setCachedOptions(prev => ({ ...prev, [key]: [] }));
        setLoadingColKey(null);
      });
  }

  const allSelected = rows.length > 0 && rows.every(r => selected.includes(r.id));

  function toggleAll() {
    if (allSelected) onSelectChange([]);
    else onSelectChange(rows.map(r => r.id));
  }

  const totalCols = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  const commonHeaderCellSx = {
    fontWeight: 600,
    fontSize: '0.52rem',
    whiteSpace: 'nowrap',
    borderBottom: `2px solid ${COLORS.tableBorder}`,
    borderRight: `1px solid ${COLORS.tableBorder}`,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    py: 0.35,
    px: 1,
  };

  // Resolve which options to show in the modal
  const modalOptions = modalCol
    ? (fetchOptions
        ? (cachedOptions[modalCol.key] ?? [])
        : (filterOptions[modalCol.key] ?? []))
    : [];
  const modalLoading = !!fetchOptions && loadingColKey === modalCol?.key;

  return (
    <>
      <TableContainer
        component={Paper}
        ref={scrollRef}
        sx={{
          borderRadius: 2,
          border: `1px solid ${COLORS.tableBorder}`,
          boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
          maxHeight: 'calc(100vh - 260px)',
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
              {selectable && (
                <TableCell padding="checkbox" sx={{
                  bgcolor: COLORS.tableHeaderBg,
                  borderBottom: `2px solid ${COLORS.tableBorder}`,
                  borderRight: `1px solid ${COLORS.tableBorder}`,
                  position: 'sticky', top: 0, zIndex: 3,
                }}>
                  <Checkbox
                    size="small" checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={toggleAll}
                    sx={{ '&.Mui-checked,&.MuiCheckbox-indeterminate': { color: COLORS.primary } }}
                  />
                </TableCell>
              )}

              {columns.map((col, ci) => {
                const hasFilter = !!filters[col.key] && filters[col.key] !== null;
                return (
                  <TableCell key={col.key} sx={{
                    ...commonHeaderCellSx,
                    bgcolor: getHeaderBg(ci, altColumns),
                    color: getHeaderTextColor(ci, altColumns),
                    userSelect: 'none',
                    cursor: col.filterable ? 'pointer' : 'default',
                    '&:hover': col.filterable ? { bgcolor: '#ecedf2', color: COLORS.textPrimary } : {},
                    transition: 'all 0.12s',
                  }} onClick={() => openFilter(col)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6 }}>
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

              {actions && (
                <TableCell sx={{
                  ...commonHeaderCellSx,
                  bgcolor: getHeaderBg(columns.length, altColumns),
                  color: getHeaderTextColor(columns.length, altColumns),
                }}>
                  Ações
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalCols} sx={{ textAlign: 'center', py: 6, border: 'none' }}>
                  <CircularProgress size={26} sx={{ color: COLORS.primary }} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} sx={{ textAlign: 'center', py: 6, color: 'text.secondary', fontSize: '0.63rem', border: 'none' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : rows.map((row, rowIdx) => {
              const isSelected = selected.includes(row.id);
              const extraRowSx = getRowSx ? getRowSx(row) : {};
              const rowBgOverride = extraRowSx.bgcolor;
              return (
                <TableRow
                  key={row.id ?? rowIdx}
                  onClick={() => {
                    if (selectable) {
                      onSelectChange(isSelected ? selected.filter(id => id !== row.id) : [...selected, row.id]);
                    }
                    onRowClick?.(row);
                  }}
                  sx={{
                    cursor: (selectable || onRowClick) ? 'pointer' : 'default',
                    transition: 'background-color 0.1s',
                    bgcolor: isSelected ? '#fdab3d' : (!altColumns ? COLORS.tableWhite : 'transparent'),
                    '&:hover': (!altColumns || isSelected) ? { bgcolor: isSelected ? '#f09c28' : COLORS.tableHover } : {},
                    '&:hover td': (altColumns && !isSelected) ? { bgcolor: rowBgOverride ?? COLORS.tableHover } : {},
                    ...(isSelected && { '& > td:first-of-type': { borderLeft: `3px solid ${COLORS.primary}` } }),
                    ...extraRowSx,
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${COLORS.tableBorder}`, borderRight: `1px solid ${COLORS.tableBorder}` }}>
                      <Checkbox
                        size="small" checked={isSelected}
                        onChange={() => {
                          onSelectChange(isSelected ? selected.filter(id => id !== row.id) : [...selected, row.id]);
                        }}
                        onClick={e => e.stopPropagation()}
                        sx={{ '&.Mui-checked': { color: COLORS.primary } }}
                      />
                    </TableCell>
                  )}

                  {columns.map((col, ci) => (
                    <TableCell key={col.key} sx={{
                      fontSize: '0.58rem',
                      whiteSpace: 'nowrap',
                      borderBottom: `1px solid ${COLORS.tableBorder}`,
                      borderRight: `1px solid ${COLORS.tableBorder}`,
                      py: 0.25,
                      px: 1,
                      textAlign: 'center',
                      color: COLORS.tableCellText,
                      bgcolor: rowBgOverride ?? getCellBg(ci, altColumns, isSelected),
                      ...(col.getCellSx ? col.getCellSx(row[col.key], row) : {}),
                    }}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell sx={{
                      bgcolor: rowBgOverride ?? getCellBg(columns.length, altColumns, isSelected),
                      borderBottom: `1px solid ${COLORS.tableBorder}`,
                      borderRight: `1px solid ${COLORS.tableBorder}`,
                      whiteSpace: 'nowrap',
                      py: 0.15,
                      px: 0.75,
                    }} onClick={e => e.stopPropagation()}>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <FilterModal
        open={!!modalCol}
        column={modalCol}
        allValues={modalOptions}
        activeValues={modalCol ? (filters[modalCol.key] ?? null) : null}
        onApply={(values) => onFilterChange?.(modalCol.key, values)}
        onClose={() => setModalCol(null)}
        loading={modalLoading}
      />
    </>
  );
}
