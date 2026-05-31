import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List, ListItemButton, ListItemText,
  Typography, Box, Collapse,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useStore } from '../Store';
import { COLORS } from '../../utils/colors';

const DRAWER_WIDTH = 220;

const sectionColors = {
  Tours:          '#ff642e',
  Financeiro:     '#00c875',
  Clientes:       '#a25ddc',
  Produtos:       '#0086c0',
  'Ordem do Dia': '#fdab3d',
  Análises:       '#e2445c',
  Admin:          '#676879',
};

const menuItems = [
  { label: 'Início',        path: '/',              icon: HomeRoundedIcon,                 permissions: [1,2,3,4,5,6] },
  { label: 'Busca Rápida',  path: '/quick-search',  icon: SearchRoundedIcon,               permissions: [1,2,4,5] },
  { label: 'Tours', icon: ConfirmationNumberRoundedIcon, color: sectionColors['Tours'], children: [
    { label: 'Cadastrar Tour',       path: '/cadastrar-tour',            permissions: [1,2,4,5] },
    { label: 'Listar Tours',         path: '/listar-tours',              permissions: [1,2,4,5] },
    { label: 'Lista Resumida',        path: '/listar-tours-resumido',     permissions: [1,2,3,4,5] },
    { label: 'Cancelados',           path: '/tours-cancelados',          permissions: [1,2,3,4,5] },
    { label: 'Imprimir Lista',       path: '/imprimir-lista',            permissions: [1,2,4,5] },
    { label: 'Comissões',            path: '/listar-comissoes',          permissions: [1,2,3,4,5] },
  ]},
  { label: 'Financeiro', icon: AccountBalanceWalletRoundedIcon, color: sectionColors['Financeiro'], children: [
    { label: 'Novo Tour Financeiro', path: '/cadastrar-tour-financeiro', permissions: [2,4,5] },
    { label: 'Listar Financeiro',    path: '/listar-tours-financeiro',   permissions: [2,4,5] },
  ]},
  { label: 'Clientes', icon: GroupsRoundedIcon, color: sectionColors['Clientes'], children: [
    { label: 'Novo Cliente',    path: '/cadastrar-cliente',  permissions: [1,2,3,4,5] },
    { label: 'Listar Clientes', path: '/listar-clientes',    permissions: [1,2,3,4,5] },
  ]},
  { label: 'Produtos', icon: CategoryRoundedIcon, color: sectionColors['Produtos'], children: [
    { label: 'Novo Produto',      path: '/cadastrar-produto',   permissions: [1,2,3,4,5] },
    { label: 'Listar Produtos',   path: '/listar-produtos',     permissions: [1,2,3,4,5] },
    { label: 'Novo Adicional',    path: '/cadastrar-adicional', permissions: [1,2,3,4,5] },
    { label: 'Listar Adicionais', path: '/listar-adicionais',   permissions: [1,2,3,4,5] },
  ]},
  { label: 'Ordem do Dia', icon: EventNoteRoundedIcon, color: sectionColors['Ordem do Dia'], children: [
    { label: 'Calendário',     path: '/ordem-do-dia',            permissions: [1,2,3,4,5] },
    { label: 'Configurações',  path: '/opcoes-ordem-do-dia',     permissions: [1,2,3,4,5] },
    { label: 'Pagamentos',     path: '/pagamentos-ordem-do-dia', permissions: [2,4,5] },
  ]},
  { label: 'Análises', icon: InsightsRoundedIcon, color: sectionColors['Análises'], children: [
    { label: 'Por Cliente', path: '/analises-por-cliente',   permissions: [2,4,5,6] },
    { label: 'Por País',    path: '/analises-por-pais',      permissions: [2,4,5,6] },
    { label: 'Por Hora',    path: '/analises-por-hora',      permissions: [2,4,5,6] },
    { label: 'Por Produto', path: '/analises-por-produto',   permissions: [2,4,5,6] },
  ]},
  { label: 'Admin', icon: ManageAccountsRoundedIcon, color: sectionColors['Admin'], children: [
    { label: 'Configurações', path: '/configuracoes',        permissions: [1,2,4,5] },
    { label: 'Usuários',      path: '/usuarios',             permissions: [4,5] },
    { label: 'Meu Usuário',   path: '/meu-usuario',          permissions: [1,2,3,4,5,6] },
  ]},
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { userPermissions } = useStore();
  const perm      = parseInt(userPermissions);
  const [open, setOpen] = useState({});

  const toggle    = (label) => setOpen(prev => ({ ...prev, [label]: !prev[label] }));
  const hasAccess = (item) => !item.permissions || item.permissions.includes(perm);
  const isActive  = (path) => location.pathname === path;

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        bgcolor: COLORS.sidebar,
        borderRadius: 2.5,
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1.5,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: 4 },
      }}>
        <List dense disablePadding>
          {menuItems.map((item) => {
            if (!hasAccess(item)) return null;
            const Icon = item.icon;
            const iconColor = item.color || COLORS.primary;

            if (item.children) {
              const visibleChildren = item.children.filter(hasAccess);
              if (visibleChildren.length === 0) return null;
              const isExpanded = !!open[item.label];
              const anyActive  = visibleChildren.some(c => isActive(c.path));

              return (
                <React.Fragment key={item.label}>
                  <ListItemButton
                    onClick={() => toggle(item.label)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      mx: 0.75,
                      mb: 0.25,
                      borderRadius: 1,
                      color: anyActive ? '#fff' : COLORS.sidebarText,
                      bgcolor: anyActive && !isExpanded ? COLORS.sidebarActive : 'transparent',
                      '&:hover': { bgcolor: COLORS.sidebarHover, color: '#fff' },
                      transition: 'all 0.12s',
                    }}
                  >
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: `${iconColor}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.25,
                      flexShrink: 0,
                    }}>
                      <Icon sx={{ fontSize: 14, color: iconColor }} />
                    </Box>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.81rem', fontWeight: anyActive ? 600 : 500 }}
                      sx={{ my: 0 }}
                    />
                    {isExpanded
                      ? <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', ml: 0.5 }} />
                      : <ChevronRightRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', ml: 0.5 }} />
                    }
                  </ListItemButton>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List dense disablePadding>
                      {visibleChildren.map(child => (
                        <ListItemButton
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          sx={{
                            pl: 4.75,
                            pr: 1.5,
                            py: 0.6,
                            mx: 0.75,
                            mb: 0.15,
                            borderRadius: 1,
                            position: 'relative',
                            color: isActive(child.path) ? '#fff' : 'rgba(255,255,255,0.58)',
                            bgcolor: isActive(child.path) ? COLORS.sidebarActive : 'transparent',
                            '&:hover': { bgcolor: COLORS.sidebarHover, color: '#fff' },
                            transition: 'all 0.12s',
                            ...(isActive(child.path) && {
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: '60%',
                                bgcolor: COLORS.primary,
                                borderRadius: 4,
                              },
                            }),
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: isActive(child.path) ? 600 : 400 }}
                            sx={{ my: 0 }}
                          />
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
                onClick={() => navigate(item.path)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  mx: 0.75,
                  mb: 0.25,
                  borderRadius: 1,
                  color: isActive(item.path) ? '#fff' : COLORS.sidebarText,
                  bgcolor: isActive(item.path) ? COLORS.sidebarActive : 'transparent',
                  '&:hover': { bgcolor: COLORS.sidebarHover, color: '#fff' },
                  transition: 'all 0.12s',
                }}
              >
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: isActive(item.path) ? `${COLORS.primary}33` : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.25,
                  flexShrink: 0,
                }}>
                  <Icon sx={{ fontSize: 14, color: isActive(item.path) ? COLORS.primaryLight : COLORS.sidebarIcon }} />
                </Box>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.81rem', fontWeight: isActive(item.path) ? 600 : 500 }}
                  sx={{ my: 0 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
