import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';

const quickLinks = [
  {
    label: 'Tours',
    desc: 'Gerencie todos os tours do sistema',
    path: '/listar-tours',
    icon: ConfirmationNumberRoundedIcon,
    color: '#ff642e',
    permissions: [1,2,4,5],
  },
  {
    label: 'Busca Rápida',
    desc: 'Encontre qualquer registro rapidamente',
    path: '/quick-search',
    icon: SearchRoundedIcon,
    color: '#0073ea',
    permissions: [1,2,4,5],
  },
  {
    label: 'Financeiro',
    desc: 'Acompanhe o financeiro dos tours',
    path: '/listar-tours-financeiro',
    icon: AccountBalanceWalletRoundedIcon,
    color: '#00c875',
    permissions: [2,4,5],
  },
  {
    label: 'Clientes',
    desc: 'Cadastro e consulta de clientes',
    path: '/listar-clientes',
    icon: GroupsRoundedIcon,
    color: '#a25ddc',
    permissions: [1,2,3,4,5],
  },
  {
    label: 'Ordem do Dia',
    desc: 'Lista e pagamentos do dia',
    path: '/ordem-do-dia',
    icon: EventNoteRoundedIcon,
    color: '#fdab3d',
    permissions: [1,2,3,4,5],
  },
  {
    label: 'Análises',
    desc: 'Relatórios e análises detalhadas',
    path: '/analises-por-cliente',
    icon: InsightsRoundedIcon,
    color: '#e2445c',
    permissions: [2,4,5,6],
  },
  {
    label: 'Produtos',
    desc: 'Gerenciar produtos e serviços',
    path: '/listar-produtos',
    icon: CategoryRoundedIcon,
    color: '#0086c0',
    permissions: [1,2,3,4,5],
  },
];

export default function Default() {
  const navigate = useNavigate();
  const { userName, userPermissions } = useStore();
  const perm = parseInt(userPermissions);
  const firstName = (userName || '').split(' ')[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const visibleLinks = quickLinks.filter(l => l.permissions.includes(perm));

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

      {/* Hero */}
      <Box sx={{ mb: 5, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute', top: -30, right: 0,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,100,46,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', top: 20, right: 140,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(162,93,220,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: COLORS.textPrimary, lineHeight: 1.2, mb: 0.75 }}>
          {greeting},{' '}
          <Box component="span" sx={{
            background: 'linear-gradient(90deg, #00c875 0%, #a25ddc 50%, #fdab3d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {firstName}
          </Box>
        </Typography>

        <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.95rem', fontWeight: 400 }}>
          O que vamos fazer hoje?
        </Typography>
      </Box>

      {/* Quick access grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
        gap: 2,
      }}>
        {visibleLinks.map(link => {
          const Icon = link.icon;
          return (
            <Box
              key={link.path}
              onClick={() => navigate(link.path)}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: `1px solid ${COLORS.border}`,
                bgcolor: '#fff',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 3,
                  bgcolor: link.color,
                  opacity: 0,
                  transition: 'opacity 0.18s ease',
                },
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 10px 28px rgba(0,0,0,0.08)`,
                  borderColor: link.color + '44',
                  '&::before': { opacity: 1 },
                },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.75,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 1.5,
                  bgcolor: link.color + '16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon sx={{ fontSize: 21, color: link.color }} />
                </Box>
                <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'rgba(0,0,0,0.18)', mt: 0.3 }} />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.textPrimary, mb: 0.4 }}>
                  {link.label}
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: COLORS.textSecondary, lineHeight: 1.45 }}>
                  {link.desc}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
