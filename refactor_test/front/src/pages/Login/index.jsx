import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { setToken, setPermissions } from '../../utils/storage';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        Swal.fire('Erro', 'Usuário ou senha incorretos', 'error');
      } else {
        // Get user info
        const userRes = await fetch(`${API_URL}/users/getUser?token=${data.token}`);
        const userData = await userRes.json();
        login(data.token, data.permissions, userData.name || form.username);
        navigate('/');
      }
    } catch {
      Swal.fire('Erro', 'Não foi possível conectar ao servidor', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Card sx={{ width: 380, p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
            CE System
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Usuário" margin="normal"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            />
            <TextField
              fullWidth label="Senha" margin="normal"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
