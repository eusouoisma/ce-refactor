import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, IconButton, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

const newContact = () => ({ name: '', contact: '', office: '', email: '' });
const defaultForm = { customerType: 'Agencia', customerName: '', contacts: [newContact()] };

export default function CustomerInput() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [form, setForm] = useState({ ...defaultForm, contacts: [newContact()] });

  function setContact(i, f, v) {
    setForm(p => ({ ...p, contacts: p.contacts.map((c, idx) => idx === i ? { ...c, [f]: v } : c) }));
  }

  function addContact() {
    setForm(p => ({ ...p, contacts: [...p.contacts, newContact()] }));
  }

  function removeContact(i) {
    setForm(p => ({ ...p, contacts: p.contacts.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(andNew = false) {
    const payload = { ...form, createdBy: userName, lastEditBy: userName };
    const res = await fetch(`${API_URL}/customers/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro', 'error');
    } else if (andNew) {
      setForm({ ...defaultForm, contacts: [newContact()] });
    } else {
      navigate('/listar-clientes');
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Cadastrar Cliente</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={form.customerType} label="Tipo" onChange={e => setForm(p => ({ ...p, customerType: e.target.value }))}>
                  <MenuItem value="Agencia">Agência</MenuItem>
                  <MenuItem value="Guia">Guia</MenuItem>
                  <MenuItem value="ClienteFinal">Cliente Final</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Nome do Cliente" value={form.customerName}
                onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Contatos</Typography>
          {form.contacts.map((c, i) => (
            <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Nome" value={c.name}
                    onChange={e => setContact(i, 'name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Telefone/Contato" value={c.contact}
                    onChange={e => setContact(i, 'contact', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth size="small" label="Cargo" value={c.office}
                    onChange={e => setContact(i, 'office', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth size="small" label="Email" value={c.email}
                    onChange={e => setContact(i, 'email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton color="error" onClick={() => removeContact(i)} disabled={form.contacts.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addContact}>Adicionar Contato</Button>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit(false)}>Salvar</Button>
            <Button variant="outlined" onClick={() => handleSubmit(true)}>Salvar e Criar Outro</Button>
            <Button variant="text" onClick={() => navigate('/listar-clientes')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
