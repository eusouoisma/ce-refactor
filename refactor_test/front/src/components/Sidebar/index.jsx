import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  Toolbar, Divider, Typography, Box, IconButton, Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useStore } from '../Store';

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: 'Início', path: '/', permissions: [1,2,3,4,5,6] },
  { label: 'Busca Rápida', path: '/quick-search', permissions: [1,2,4,5] },
  { label: 'Tours', children: [
    { label: 'Cadastrar Tour', path: '/cadastrar-tour', permissions: [1,2,4,5] },
    { label: 'Listar Tours', path: '/listar-tours', permissions: [1,2,4,5] },
    { label: 'Resumo', path: '/listar-tours-resumido', permissions: [1,2,3,4,5] },
    { label: 'Cancelados', path: '/tours-cancelados', permissions: [1,2,3,4,5] },
    { label: 'Imprimir Lista', path: '/imprimir-lista', permissions: [1,2,4,5] },
  ]},
  { label: 'Financeiro', children: [
    { label: 'Novo Tour Financeiro', path: '/cadastrar-tour-financeiro', permissions: [2,4,5] },
    { label: 'Listar Financeiro', path: '/listar-tours-financeiro', permissions: [2,4,5] },
    { label: 'Comissões', path: '/listar-comissoes', permissions: [1,2,3,4,5] },
  ]},
  { label: 'Clientes', children: [
    { label: 'Novo Cliente', path: '/cadastrar-cliente', permissions: [1,2,3,4,5] },
    { label: 'Listar Clientes', path: '/listar-clientes', permissions: [1,2,3,4,5] },
  ]},
  { label: 'Produtos', children: [
    { label: 'Novo Produto', path: '/cadastrar-produto', permissions: [1,2,3,4,5] },
    { label: 'Listar Produtos', path: '/listar-produtos', permissions: [1,2,3,4,5] },
  ]},
  { label: 'Ordem do Dia', children: [
    { label: 'Lista', path: '/ordem-do-dia', permissions: [1,2,3,4,5] },
    { label: 'Pagamentos', path: '/pagamentos-ordem-do-dia', permissions: [2,4,5] },
    { label: 'Opções', path: '/opcoes-ordem-do-dia', permissions: [1,2,3,4,5] },
  ]},
  { label: 'Análises', children: [
    { label: 'Por Cliente', path: '/analises-por-cliente', permissions: [2,4,5,6] },
    { label: 'Por País', path: '/analises-por-pais', permissions: [2,4,5,6] },
    { label: 'Por Hora', path: '/analises-por-hora', permissions: [2,4,5,6] },
    { label: 'Por Produto', path: '/analises-por-produto', permissions: [2,4,5,6] },
  ]},
  { label: 'Admin', children: [
    { label: 'Configurações', path: '/configuracoes', permissions: [1,2,4,5] },
    { label: 'Usuários', path: '/usuarios', permissions: [4,5] },
    { label: 'Meu Usuário', path: '/meu-usuario', permissions: [1,2,3,4,5,6] },
  ]},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userPermissions } = useStore();
  const perm = parseInt(userPermissions);
  const [open, setOpen] = useState({});

  const toggle = (label) => setOpen(prev => ({ ...prev, [label]: !prev[label] }));
  const hasAccess = (item) => !item.permissions || item.permissions.includes(perm);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: '#1a237e' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>CE System</Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      <Box sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 1, fontSize: '0.8rem' }}>
        {userName}
      </Box>
      <List dense>
        {menuItems.map(item => {
          if (!hasAccess(item)) return null;
          if (item.children) {
            const visibleChildren = item.children.filter(hasAccess);
            if (visibleChildren.length === 0) return null;
            return (
              <React.Fragment key={item.label}>
                <ListItemButton onClick={() => toggle(item.label)} sx={{ color: 'white' }}>
                  <ListItemText primary={item.label} />
                  {open[item.label] ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                </ListItemButton>
                <Collapse in={open[item.label]} timeout="auto" unmountOnExit>
                  <List dense component="div" disablePadding>
                    {visibleChildren.map(child => (
                      <ListItemButton
                        key={child.path}
                        sx={{ pl: 4, color: location.pathname === child.path ? '#90caf9' : 'rgba(255,255,255,0.7)' }}
                        onClick={() => navigate(child.path)}
                      >
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          return (
            <ListItemButton
              key={item.path}
              sx={{ color: location.pathname === item.path ? '#90caf9' : 'white' }}
              onClick={() => navigate(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
