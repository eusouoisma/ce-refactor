import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useStore } from '../Store';
import { COLORS } from '../../utils/colors';

export default function Topbar() {
  const navigate = useNavigate();
  const { userName, logout } = useStore();

  function handleLogout() { logout(); navigate('/login'); }

  const initials = (userName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors = ['#ff642e', '#a25ddc', '#0073ea', '#00c875', '#e2445c', '#fdab3d'];
  const avatarBg = avatarColors[(initials.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <Box sx={{
      px: 1.5,
      py: 1.25,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          background: 'linear-gradient(135deg, #ff642e 0%, #e2445c 40%, #a25ddc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.7rem',
          fontWeight: 800,
          color: '#fff',
        }}>
          CE
        </Box>
        <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.2px' }}>
          Carnaval Experience
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: avatarBg, fontSize: '0.68rem', fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Typography sx={{ fontSize: '0.82rem', color: COLORS.textPrimary, fontWeight: 500 }}>
          {userName}
        </Typography>
        <Tooltip title="Sair" placement="bottom">
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 1,
              color: COLORS.textSecondary,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(226,68,92,0.1)', color: '#e2445c' },
              transition: 'all 0.12s',
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
