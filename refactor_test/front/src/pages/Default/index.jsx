import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Swal from 'sweetalert2';
import { useStore } from '../../components/Store';
import ShortcutEditor from '../../components/ShortcutEditor';
import { apiFetch } from '../../utils/api';
import { COLORS } from '../../utils/colors';
import {
  getDefaultShortcutPaths,
  resolveShortcutPaths,
} from '../../utils/menuItems';

export default function Default() {
  const navigate = useNavigate();
  const { userName, userPermissions } = useStore();
  const perm = parseInt(userPermissions, 10);
  const firstName = (userName || '').split(' ')[0];

  const [savedPaths, setSavedPaths] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadShortcuts = useCallback(() => {
    setLoading(true);
    return apiFetch('/users/shortcuts')
      .then(r => r.json())
      .then(data => {
        setSavedPaths(Array.isArray(data.shortcuts) ? data.shortcuts : null);
      })
      .catch(() => setSavedPaths(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadShortcuts(); }, [loadShortcuts]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const shortcutItems = useMemo(() => {
    const paths = savedPaths === null ? getDefaultShortcutPaths(perm) : savedPaths;
    return resolveShortcutPaths(paths, perm);
  }, [savedPaths, perm]);

  const editorPaths = useMemo(() => {
    if (savedPaths === null) return getDefaultShortcutPaths(perm);
    return savedPaths.filter(p => resolveShortcutPaths([p], perm).length > 0);
  }, [savedPaths, perm]);

  async function handleSaveShortcuts(paths) {
    setSaving(true);
    try {
      const res = await apiFetch('/users/shortcuts', {
        method: 'POST',
        body: JSON.stringify({ shortcuts: paths }),
      });
      const data = await res.json();
      if (data.error) {
        Swal.fire('Erro', 'Não foi possível salvar os atalhos.', 'error');
        return;
      }
      setSavedPaths(data.shortcuts || paths);
      setEditorOpen(false);
      Swal.fire({ icon: 'success', title: 'Atalhos salvos!', timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire('Erro', 'Não foi possível conectar ao servidor.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

      <Box sx={{ mb: 4, position: 'relative', overflow: 'hidden' }}>
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

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
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

          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneRoundedIcon />}
            onClick={() => setEditorOpen(true)}
            sx={{ flexShrink: 0, mt: 0.5 }}
          >
            Personalizar Atalhos
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
          gap: 2,
        }}>
          {shortcutItems.map(link => {
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
                    boxShadow: '0 10px 28px rgba(0,0,0,0.08)',
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
                    {link.section || 'Acesso rápido'}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <ShortcutEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        paths={editorPaths}
        perm={perm}
        onSave={handleSaveShortcuts}
        saving={saving}
      />
    </Box>
  );
}
