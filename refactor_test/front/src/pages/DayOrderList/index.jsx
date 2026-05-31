import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { apiFetch } from '../../utils/api';
import DayOrderCalendar from '../DayOrderCalendar';

export default function DayOrderList() {
  const navigate = useNavigate();
  const [dayOrders, setDayOrders] = useState([]);

  useEffect(() => {
    apiFetch('/day-order/list-active', { method: 'POST' })
      .then(r => r.json())
      .then(d => setDayOrders(Array.isArray(d) ? d : []));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Ordem do Dia</Typography>
      <DayOrderCalendar
        dayOrders={dayOrders}
        editDayOrder={id => navigate(`/editar-ordem-do-dia?id=${id}`)}
      />
    </Box>
  );
}
