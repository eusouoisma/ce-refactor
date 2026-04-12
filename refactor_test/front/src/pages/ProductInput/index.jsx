import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, IconButton, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';

const newVariant = () => ({
  pricingType: 'person', priceAdult: '', priceHalf: '', priceNet: '', priceBrazilian: '',
  priceFree: '', priceGroup: '', paxLimit: '', priceAdultHighSeason: '', priceHalfHighSeason: '',
  priceNetHighSeason: '', priceFreeHighSeason: '', priceBrazilianHighSeason: '', priceGroupHighSeason: '',
});

export default function ProductInput() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'regular', category: 'atividade', productName: '', duration: '', variants: [newVariant()] });

  function setVariant(i, f, v) {
    setForm(p => ({ ...p, variants: p.variants.map((vr, idx) => idx === i ? { ...vr, [f]: v } : vr) }));
  }

  async function handleSubmit(andNew = false) {
    const res = await fetch(`${API_URL}/products/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); }
    else if (andNew) { setForm({ ...form, productName: '', variants: [newVariant()] }); }
    else { navigate('/listar-produtos'); }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Cadastrar Produto</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={form.type} label="Tipo" onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="privativo">Privativo</MenuItem>
                  <MenuItem value="show/evento">Show/Evento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select value={form.category} label="Categoria" onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <MenuItem value="atividade">Atividade</MenuItem>
                  <MenuItem value="adicional">Adicional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Nome" value={form.productName} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))} /></Grid>
            <Grid item xs={2}><TextField fullWidth size="small" label="Duração" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} /></Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1">Variantes</Typography>
          {form.variants.map((v, i) => (
            <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small"><InputLabel>Preço Por</InputLabel>
                    <Select value={v.pricingType} label="Preço Por" onChange={e => setVariant(i, 'pricingType', e.target.value)}>
                      <MenuItem value="person">Pessoa</MenuItem>
                      <MenuItem value="group">Grupo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}><TextField fullWidth size="small" label="Pax Limite" type="number" value={v.paxLimit} onChange={e => setVariant(i, 'paxLimit', e.target.value)} /></Grid>
                {v.pricingType === 'person' ? (
                  <>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Adulto" type="number" value={v.priceAdult} onChange={e => setVariant(i, 'priceAdult', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Meia" type="number" value={v.priceHalf} onChange={e => setVariant(i, 'priceHalf', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="NET" type="number" value={v.priceNet} onChange={e => setVariant(i, 'priceNet', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Brasileiro" type="number" value={v.priceBrazilian} onChange={e => setVariant(i, 'priceBrazilian', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Cortesia" type="number" value={v.priceFree} onChange={e => setVariant(i, 'priceFree', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Adulto Alta" type="number" value={v.priceAdultHighSeason} onChange={e => setVariant(i, 'priceAdultHighSeason', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Meia Alta" type="number" value={v.priceHalfHighSeason} onChange={e => setVariant(i, 'priceHalfHighSeason', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="NET Alta" type="number" value={v.priceNetHighSeason} onChange={e => setVariant(i, 'priceNetHighSeason', e.target.value)} /></Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Preço Grupo" type="number" value={v.priceGroup} onChange={e => setVariant(i, 'priceGroup', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Grupo Alta" type="number" value={v.priceGroupHighSeason} onChange={e => setVariant(i, 'priceGroupHighSeason', e.target.value)} /></Grid>
                  </>
                )}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton color="error" onClick={() => setForm(p => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))} disabled={form.variants.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setForm(p => ({ ...p, variants: [...p.variants, newVariant()] }))}>Adicionar Variante</Button>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit(false)}>Salvar</Button>
            <Button variant="outlined" onClick={() => handleSubmit(true)}>Salvar e Criar Outro</Button>
            <Button variant="text" onClick={() => navigate('/listar-produtos')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
