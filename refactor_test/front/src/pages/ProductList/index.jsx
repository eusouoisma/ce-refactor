import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  function load() {
    fetch(`${API_URL}/products/list-all`).then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function deleteProduct(id) {
    const confirm = await Swal.fire({ title: 'Excluir produto?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/products/delete?id=${id}`);
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Produtos</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell><TableCell>Tipo</TableCell><TableCell>Categoria</TableCell>
              <TableCell>Duração</TableCell><TableCell>Preço Tipo</TableCell>
              <TableCell>Adulto</TableCell><TableCell>Meia</TableCell><TableCell>NET</TableCell>
              <TableCell>Bras.</TableCell><TableCell>Cortesia</TableCell><TableCell>Grupo</TableCell>
              <TableCell>Pax Lim.</TableCell><TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p, i) => (
              <TableRow key={i}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.type}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.duration}</TableCell>
                <TableCell>{p.pricingType}</TableCell>
                <TableCell>{p.priceAdult}</TableCell>
                <TableCell>{p.priceHalf}</TableCell>
                <TableCell>{p.priceNet}</TableCell>
                <TableCell>{p.priceBrazilian}</TableCell>
                <TableCell>{p.priceFree}</TableCell>
                <TableCell>{p.priceGroup}</TableCell>
                <TableCell>{p.paxLimit}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/editar-produto?id=${p.id}`)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteProduct(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
