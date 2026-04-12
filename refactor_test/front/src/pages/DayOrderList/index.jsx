import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { API_URL } from '../../utils/env';
import { getWeekDayName } from '../../utils/functions';

export default function DayOrderList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/day-order/list-active`, { method: 'POST' })
      .then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Ordem do Dia</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell><TableCell>Dia</TableCell><TableCell>Nome</TableCell>
              <TableCell>Comentários</TableCell><TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.formatedDate}</TableCell>
                <TableCell>{getWeekDayName(parseInt(d.weekDay))}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.comments}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-ordem-do-dia?id=${d.id}`)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
