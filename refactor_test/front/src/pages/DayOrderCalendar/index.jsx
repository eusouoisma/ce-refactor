import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { apiFetch } from '../../utils/api';

const COLORS = ['#55cbcd', '#cbaacb', '#c6dbda', '#fcb9aa'];
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function DayOrderCalendar({ dayOrders: dayOrdersProp, editDayOrder: editDayOrderProp }) {
  const navigate = useNavigate();
  const [ownDayOrders, setOwnDayOrders] = useState([]);

  // When used standalone (no props), fetch own data
  useEffect(() => {
    if (!dayOrdersProp) {
      apiFetch('/day-order/list-active', { method: 'POST' })
        .then(r => r.json())
        .then(d => setOwnDayOrders(Array.isArray(d) ? d : []));
    }
  }, [dayOrdersProp]);

  const dayOrders = dayOrdersProp ?? ownDayOrders;
  const editDayOrder = editDayOrderProp ?? (id => navigate(`/editar-ordem-do-dia?id=${id}`));

  const [viewDate, setViewDate] = useState(() => {
    const stored = localStorage.getItem('selectedDateInDayOrderCalendar');
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d)) return d;
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const changeMonth = useCallback((dir) => {
    const d = new Date(year, month + dir, 1);
    setViewDate(d);
    localStorage.setItem('selectedDateInDayOrderCalendar', `${d.getMonth() + 1}/1/${d.getFullYear()}`);
  }, [year, month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <IconButton size="small" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></IconButton>
        <Typography variant="subtitle1" fontWeight={700}>{MONTH_NAMES[month]} {year}</Typography>
        <IconButton size="small" onClick={() => changeMonth(1)}><ChevronRightIcon /></IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEK_DAYS.map(d => (
          <Box key={d} sx={{
            p: 0.75, textAlign: 'center', fontWeight: 700, fontSize: 12,
            bgcolor: '#f0f0f0', borderBottom: '1px solid #ccc',
            borderRight: '1px solid #ccc', '&:last-child': { borderRight: 'none' },
          }}>
            {d}
          </Box>
        ))}

        {cells.map((day, i) => {
          const isLastInRow = (i + 1) % 7 === 0;
          if (!day) {
            return (
              <Box key={`e${i}`} sx={{
                minHeight: 90, bgcolor: '#f9f9f9',
                borderBottom: '1px solid #ddd',
                borderRight: isLastInRow ? 'none' : '1px solid #ddd',
              }} />
            );
          }

          const dateStr = formatDate(year, month, day);
          const cellDate = new Date(year, month, day);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          // Normalize date: backend may return full ISO string, we need just YYYY-MM-DD
          const orders = dayOrders
            .filter(o => (o.date ? String(o.date).slice(0, 10) : '') === dateStr)
            .sort((a, b) => a.name === 'Tour Principal' ? -1 : 1);

          return (
            <Box key={dateStr} sx={{
              minHeight: 90, p: 0.5,
              bgcolor: isToday ? '#ffe2ac' : '#fff',
              opacity: isPast ? 0.45 : 1,
              borderBottom: '1px solid #ddd',
              borderRight: isLastInRow ? 'none' : '1px solid #ddd',
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#555', mb: 0.5 }}>{day}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {orders.map((o, idx) => (
                  <Box
                    key={o.id}
                    onClick={() => editDayOrder(o.id)}
                    sx={{
                      bgcolor: COLORS[idx % 4],
                      color: '#000',
                      fontSize: 10,
                      fontWeight: 700,
                      px: 0.5,
                      py: '2px',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      userSelect: 'none',
                      '&:hover': { opacity: 0.8, textDecoration: 'underline' },
                    }}
                  >
                    {o.name}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
