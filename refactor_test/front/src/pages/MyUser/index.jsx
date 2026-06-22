import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  InputAdornment, IconButton, Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';

function isStrongPassword(pwd) {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
}

export default function MyUser() {
  const { userName, userUsername, updateName } = useStore();

  const [name, setName] = useState(userName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordTouched = password.length > 0;
  const passwordWeak = passwordTouched && !isStrongPassword(password);
  const passwordMismatch = passwordTouched && confirmPassword.length > 0 && password !== confirmPassword;
  const hasError = passwordWeak || passwordMismatch;

  async function handleSubmit() {
    if (!name.trim()) {
      Swal.fire('Atenção', 'O nome de exibição não pode estar vazio.', 'warning');
      return;
    }
    if (passwordTouched && (!isStrongPassword(password) || password !== confirmPassword)) return;

    setSaving(true);
    try {
      const body = { name: name.trim() };
      if (passwordTouched) body.password = password;

      const res = await apiFetch('/users/update', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        Swal.fire('Erro', typeof data.error === 'string' ? data.error : 'Erro ao salvar.', 'error');
      } else {
        updateName(name.trim());
        setPassword('');
        setConfirmPassword('');
        Swal.fire({ icon: 'success', title: 'Salvo!', showConfirmButton: false, timer: 1500 });
      }
    } catch {
      Swal.fire('Erro', 'Não foi possível conectar ao servidor.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Meu Usuário</Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Grid container spacing={2}>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small"
                label="Login"
                value={userUsername}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small"
                label="Nome de exibição"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Grid>

          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Alterar senha (opcional)
          </Typography>

          <Grid container spacing={2}>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small"
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={passwordWeak}
                helperText={
                  passwordWeak
                    ? 'Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo'
                    : passwordTouched
                      ? '✓ Senha forte'
                      : 'Deixe em branco para não alterar'
                }
                FormHelperTextProps={{
                  sx: { color: passwordTouched && !passwordWeak ? 'success.main' : undefined },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(p => !p)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small"
                label="Confirmar nova senha"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={!passwordTouched}
                error={passwordMismatch}
                helperText={passwordMismatch ? 'As senhas não coincidem' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm(p => !p)} edge="end" disabled={!passwordTouched}>
                        {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || hasError}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
