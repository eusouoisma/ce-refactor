import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Tooltip,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import DataTable from '../../components/DataTable';
import { COLORS } from '../../utils/colors';

const makeActions = (navigate, deleteProduct) => (row) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <Tooltip title="Editar" arrow>
      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/editar-produto?id=${row.id}`); }}>
        <EditRoundedIcon fontSize="small" sx={{ color: COLORS.primary }} />
      </IconButton>
    </Tooltip>
    <Tooltip title="Excluir" arrow>
      <IconButton size="small" onClick={e => { e.stopPropagation(); deleteProduct(row.id); }}>
        <DeleteRoundedIcon fontSize="small" color="error" />
      </IconButton>
    </Tooltip>
  </Box>
);

const COLUMNS_PRODUTOS = (rowActions) => [
  { key: 'id',   label: 'Ações', render: (_, row) => rowActions(row) },
  { key: 'type', label: 'Tipo' },
  { key: 'name', label: 'Nome' },
];

const COLUMNS_ADICIONAIS = (rowActions) => [
  { key: 'id',   label: 'Ações', render: (_, row) => rowActions(row) },
  { key: 'name', label: 'Nome' },
];

export default function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdicionais = location.pathname === '/listar-adicionais';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/products/list-all')
      .then(r => r.json())
      .then(d => {
        const seen = new Set();
        const unique = (Array.isArray(d) ? d : []).filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id); return true;
        });
        setProducts(isAdicionais
          ? unique.filter(p => p.category === 'adicional')
          : unique.filter(p => p.category !== 'adicional')
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isAdicionais]);

  useEffect(() => { load(); }, [load]);

  async function deleteProduct(id) {
    const result = await Swal.fire({ title: `Excluir ${isAdicionais ? 'adicional' : 'produto'}?`, showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' });
    if (!result.isConfirmed) return;
    await apiFetch(`/products/delete?id=${id}`);
    load();
  }

  const rowActions = makeActions(navigate, deleteProduct);
  const columns = isAdicionais ? COLUMNS_ADICIONAIS(rowActions) : COLUMNS_PRODUTOS(rowActions);
  const title = isAdicionais ? 'Adicionais' : 'Produtos';
  const emptyMsg = isAdicionais ? 'Nenhum adicional encontrado.' : 'Nenhum produto encontrado.';
  const countLabel = isAdicionais ? 'adicional' : 'produto';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5">{title}</Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={products}
        loading={loading}
        altColumns
        actions={rowActions}
        emptyMessage={emptyMsg}
      />

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {loading ? 'Carregando...' : `${products.length} ${countLabel}${products.length !== 1 ? 's' : ''}`}
        </Typography>
      </Box>
    </Box>
  );
}
