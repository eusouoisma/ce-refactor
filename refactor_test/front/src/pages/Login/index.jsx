import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, IconButton, InputAdornment, CircularProgress,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';
import logo from '../../assets/logo-ce.png';

// 6 separate digit boxes for the 2FA code
function CodeInput({ onComplete }) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const refs = Array.from({ length: 6 }, () => useRef(null));

  function handleChange(i, val) {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs[i + 1].current?.focus();
    if (next.every(x => x !== '')) onComplete(next.join(''));
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      refs[5].current?.focus();
      onComplete(pasted);
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <TextField
          key={i}
          inputRef={refs[i]}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '10px 0' } }}
          sx={{ width: 48 }}
          autoFocus={i === 0}
        />
      ))}
    </Box>
  );
}

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useStore();
  const [step,     setStep]     = useState('credentials'); // 'credentials' | 'code'
  const [form,     setForm]     = useState({ username: '', password: '' });
  const [userId,   setUserId]   = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleCredentials(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await apiFetch('/users/login', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (data.error) {
        Swal.fire({ title: 'Acesso negado', text: data.error === true ? 'Usuário ou senha incorretos.' : data.error, icon: 'error', confirmButtonColor: COLORS.primary });
      } else if (data.requiresCode) {
        setUserId(data.userId);
        setStep('code');
      } else {
        await finishLogin(data);
      }
    } catch {
      Swal.fire({ title: 'Erro de conexão', text: 'Não foi possível conectar ao servidor.', icon: 'error', confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(code) {
    setLoading(true);
    try {
      const res  = await apiFetch('/users/verify-2fa', { method: 'POST', body: JSON.stringify({ userId, code }) });
      const data = await res.json();
      if (data.error) {
        Swal.fire({ title: 'Código inválido', text: data.error, icon: 'error', confirmButtonColor: COLORS.primary });
      } else {
        await finishLogin(data);
      }
    } catch {
      Swal.fire({ title: 'Erro de conexão', text: 'Não foi possível conectar ao servidor.', icon: 'error', confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }

  async function finishLogin(data) {
    const userRes  = await fetch(`${API_URL}/users/getUser?token=${data.token}`);
    const userData = await userRes.json();
    login(data.token, data.permissions, userData.name || form.username);
    navigate('/');
  }

  const card = (
    <Box sx={{
      width: '100%', maxWidth: 420,
      bgcolor: '#ffffff', borderRadius: 3,
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      overflow: 'hidden', border: `1px solid ${COLORS.border}`,
    }}>
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #00c875 0%, #a25ddc 50%, #fdab3d 100%)' }} />
      <Box sx={{ p: 4.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <img src={logo} alt="Carnaval Experience" style={{ height: 72, objectFit: 'contain' }} />
        </Box>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.textPrimary, mb: 0.6 }}>Usuário</Typography>
              <TextField fullWidth placeholder="Digite seu usuário" autoFocus autoComplete="username"
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.textPrimary, mb: 0.6 }}>Senha</Typography>
              <TextField fullWidth placeholder="Digite sua senha"
                type={showPass ? 'text' : 'password'} autoComplete="current-password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(p => !p)} tabIndex={-1} edge="end">
                      {showPass
                        ? <VisibilityOffRoundedIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                        : <VisibilityRoundedIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />}
                    </IconButton>
                  </InputAdornment>
                )}}
              />
            </Box>
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading} disableElevation
              sx={{ py: 1.3, fontSize: '0.9rem', fontWeight: 700, borderRadius: 2, bgcolor: COLORS.primary, '&:hover': { bgcolor: COLORS.primaryDark }, letterSpacing: '0.02em' }}>
              {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Entrar no sistema'}
            </Button>
          </form>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <IconButton size="small" onClick={() => { setStep('credentials'); setUserId(null); }}>
                <ArrowBackRoundedIcon fontSize="small" />
              </IconButton>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: COLORS.textPrimary }}>Verificação em duas etapas</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>Enviamos um código para o seu email. Válido por 10 minutos.</Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <CodeInput onComplete={handleCode} />
            </Box>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={22} sx={{ color: COLORS.primary }} />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f6f7fb', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      {card}
    </Box>
  );
}
