import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, IconButton, InputAdornment, CircularProgress,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';
import logo from '../../assets/logo-ce.png';

export default function Login() {
  const navigate   = useNavigate();
  const { login }  = useStore();
  const [form,     setForm]     = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await apiFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        Swal.fire({ title: 'Acesso negado', text: 'Usuário ou senha incorretos.', icon: 'error', confirmButtonColor: COLORS.primary });
      } else {
        const userRes  = await fetch(`${API_URL}/users/getUser?token=${data.token}`);
        const userData = await userRes.json();
        login(data.token, data.permissions, userData.name || form.username);
        navigate('/');
      }
    } catch {
      Swal.fire({ title: 'Erro de conexão', text: 'Não foi possível conectar ao servidor.', icon: 'error', confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: '#f6f7fb',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 420,
        bgcolor: '#ffffff',
        borderRadius: 3,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        border: `1px solid ${COLORS.border}`,
      }}>
        {/* Top color bar */}
        <Box sx={{
          height: 5,
          background: 'linear-gradient(90deg, #00c875 0%, #a25ddc 50%, #fdab3d 100%)',
        }} />

        <Box sx={{ p: 4.5 }}>
          {/* Logo area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <img src={logo} alt="Carnaval Experience" style={{ height: 72, objectFit: 'contain' }} />
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.textPrimary, mb: 0.6 }}>
                Usuário
              </Typography>
              <TextField
                fullWidth
                placeholder="Digite seu usuário"
                autoFocus
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.textPrimary, mb: 0.6 }}>
                Senha
              </Typography>
              <TextField
                fullWidth
                placeholder="Digite sua senha"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(p => !p)} tabIndex={-1} edge="end">
                        {showPass
                          ? <VisibilityOffRoundedIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                          : <VisibilityRoundedIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                        }
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={loading}
              disableElevation
              sx={{
                py: 1.3,
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: COLORS.primary,
                '&:hover': { bgcolor: COLORS.primaryDark },
                letterSpacing: '0.02em',
              }}
            >
              {loading
                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                : 'Entrar no sistema'
              }
            </Button>
          </form>

        </Box>
      </Box>
    </Box>
  );
}
