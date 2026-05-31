import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, IconButton, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';

const newContact = () => ({ name: '', contact: '', office: '', email: '' });

export default function CustomerUpdate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { userName } = useStore();
  const [form, setForm] = useState({ customerId: id, customerType: '', customerName: '', contacts: [] });

  useEffect(() => {
    apiFetch(`/customers/list-by-id?customer_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        const first = data[0];
        setForm({
          customerId: first.customerId,
          customerType: first.customerType || '',
          customerName: first.customerName || '',
          contacts: data.map(d => ({ name: d.contactName||'', contact: d.contactContact||'', office: d.contactOffice||'', email: d.contactEmail||'' })),
        });
      });
  }, [id]);

  function setContact(i, f, v) {
    setForm(p => ({ ...p, contacts: p.contacts.map((c, idx) => idx === i ? { ...c, [f]: v } : c) }));
  }

  async function handleSubmit() {
    const payload = { ...form, createdBy: userName, lastEditBy: userName };
    const res = await apiFetch('/customers/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro', 'error');
    } else {
      navigate('/listar-clientes');
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Editar Cliente</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={form.customerType} label="Tipo" onChange={e => setForm(p => ({ ...p, customerType: e.target.value }))}>
                  <MenuItem value=""><em>—</em></MenuItem>
                  <MenuItem value="Agencia">Agência</MenuItem>
                  <MenuItem value="Guia">Guia</MenuItem>
                  <MenuItem value="ClienteFinal">Cliente Final</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Nome" value={form.customerName}
                onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          {form.contacts.map((c, i) => (
            <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth size="small" label="Nome" value={c.name} onChange={e => setContact(i, 'name', e.target.value)} /></Grid>
                <Grid item xs={6}><TextField fullWidth size="small" label="Telefone" value={c.contact} onChange={e => setContact(i, 'contact', e.target.value)} /></Grid>
                <Grid item xs={5}><TextField fullWidth size="small" label="Cargo" value={c.office} onChange={e => setContact(i, 'office', e.target.value)} /></Grid>
                <Grid item xs={5}><TextField fullWidth size="small" label="Email" value={c.email} onChange={e => setContact(i, 'email', e.target.value)} /></Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton color="error" onClick={() => setForm(p => ({ ...p, contacts: p.contacts.filter((_, idx) => idx !== i) }))}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setForm(p => ({ ...p, contacts: [...p.contacts, newContact()] }))}>Adicionar Contato</Button>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
            <Button variant="text" onClick={() => navigate('/listar-clientes')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
