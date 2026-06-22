import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List, ListItemButton, ListItemText,
  Box, Collapse, Tooltip, IconButton,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useStore } from '../Store';
import { COLORS } from '../../utils/colors';
import { menuItems } from '../../utils/menuItems';

const DRAWER_WIDTH = 220;
const COLLAPSED_WIDTH = 56;

const isListingPath = (path) =>
  path.includes('listar') || path === '/usuarios' || path === '/tours-cancelados' || path === '/importar-planne';

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { userPermissions } = useStore();
  const perm      = parseInt(userPermissions);
  const [open, setOpen] = useState({});
  const [collapsed, setCollapsed] = useState(() => isListingPath(location.pathname));

  useEffect(() => {
    setCollapsed(isListingPath(location.pathname));
  }, [location.pathname]);

  const goBack    = () => navigate(-1);
  const toggle    = (label) => setOpen(prev => ({ ...prev, [label]: !prev[label] }));
  const hasAccess = (item) => !item.permissions || item.permissions.includes(perm);
  const isActive  = (path) => location.pathname === path;

  return (
    <Box
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        bgcolor: COLORS.sidebar,
        borderRadius: 2.5,
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Botões de controle */}
      <Box sx={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'space-between',
        alignItems: 'center',
        px: 0.75,
        pt: 0.75,
        pb: 0,
        flexShrink: 0,
        gap: 0.5,
      }}>
        {/* Voltar — oculto quando recolhido */}
        {!collapsed && (
          <Tooltip title="Voltar" placement="right">
            <IconButton
              onClick={goBack}
              sx={{
                color: 'rgba(255,255,255,0.6)',
                borderRadius: 1.5,
                width: 28,
                height: 28,
                '&:hover': { color: '#fff', bgcolor: COLORS.sidebarHover },
              }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Recolher/Expandir */}
        <Tooltip title={collapsed ? 'Expandir menu' : 'Recolher menu'} placement="right">
          <IconButton
            onClick={() => setCollapsed(v => !v)}
            sx={{
              color: '#fff',
              bgcolor: COLORS.primary,
              borderRadius: 1.5,
              width: 32,
              height: 32,
              boxShadow: `0 2px 8px ${COLORS.primaryGlow || 'rgba(0,0,0,0.3)'}`,
              '&:hover': { bgcolor: COLORS.primaryDark, boxShadow: `0 4px 12px ${COLORS.primaryGlow || 'rgba(0,0,0,0.4)'}` },
            }}
          >
            {collapsed
              ? <MenuRoundedIcon sx={{ fontSize: 16 }} />
              : <MenuOpenRoundedIcon sx={{ fontSize: 16 }} />
            }
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1,
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
              const isExpanded = !collapsed && !!open[item.label];
              const anyActive  = visibleChildren.some(c => isActive(c.path));

              return (
                <React.Fragment key={item.label}>
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={collapsed
                        ? () => { setCollapsed(false); setOpen(prev => ({ ...prev, [item.label]: true })); }
                        : () => toggle(item.label)
                      }
                      sx={{
                        px: collapsed ? 0 : 1.5,
                        py: 0.75,
                        mx: 0.75,
                        mb: 0.25,
                        borderRadius: 1,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: anyActive ? '#fff' : COLORS.sidebarText,
                        bgcolor: anyActive && !isExpanded ? COLORS.sidebarActive : 'transparent',
                        '&:hover': { bgcolor: COLORS.sidebarHover, color: '#fff' },
                        transition: 'all 0.12s',
                        minWidth: 0,
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
                        mr: collapsed ? 0 : 1.25,
                        flexShrink: 0,
                      }}>
                        <Icon sx={{ fontSize: 14, color: iconColor }} />
                      </Box>
                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.81rem', fontWeight: anyActive ? 600 : 500, noWrap: true }}
                            sx={{ my: 0 }}
                          />
                          {isExpanded
                            ? <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', ml: 0.5 }} />
                            : <ChevronRightRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', ml: 0.5 }} />
                          }
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>

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
                            primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: isActive(child.path) ? 600 : 400, noWrap: true }}
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
              <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    px: collapsed ? 0 : 1.5,
                    py: 0.75,
                    mx: 0.75,
                    mb: 0.25,
                    borderRadius: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: isActive(item.path) ? '#fff' : COLORS.sidebarText,
                    bgcolor: isActive(item.path) ? COLORS.sidebarActive : 'transparent',
                    '&:hover': { bgcolor: COLORS.sidebarHover, color: '#fff' },
                    transition: 'all 0.12s',
                    minWidth: 0,
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
                    mr: collapsed ? 0 : 1.25,
                    flexShrink: 0,
                  }}>
                    <Icon sx={{ fontSize: 14, color: isActive(item.path) ? COLORS.primaryLight : COLORS.sidebarIcon }} />
                  </Box>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.81rem', fontWeight: isActive(item.path) ? 600 : 500, noWrap: true }}
                      sx={{ my: 0 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
