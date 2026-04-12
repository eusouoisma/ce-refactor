import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';

export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  function load() {
    fetch(`${API_URL}/customers/list-all`).then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function deleteContact(id) {
    const confirm = await Swal.fire({ title: 'Excluir contato?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/customers/delete?id=${id}`);
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Clientes</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Cliente</TableCell><TableCell>Tipo</TableCell>
              <TableCell>ID Contato</TableCell><TableCell>Nome Contato</TableCell>
              <TableCell>Telefone</TableCell><TableCell>Cargo</TableCell><TableCell>Email</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c, i) => (
              <TableRow key={i}>
                <TableCell>{c.customerId}</TableCell>
                <TableCell>{c.customerName}</TableCell>
                <TableCell>{c.customerType}</TableCell>
                <TableCell>{c.contactId}</TableCell>
                <TableCell>{c.contactName}</TableCell>
                <TableCell>{c.contactContact}</TableCell>
                <TableCell>{c.contactOffice}</TableCell>
                <TableCell>{c.contactEmail}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-cliente?id=${c.customerId}`)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteContact(c.contactId)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
