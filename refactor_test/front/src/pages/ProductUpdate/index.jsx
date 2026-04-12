import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function ProductUpdate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const [form, setForm] = useState({ productId: id, type: 'regular', category: 'atividade', productName: '', duration: '', variants: [] });

  useEffect(() => {
    fetch(`${API_URL}/products/list-by-id?product_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        const first = data[0];
        setForm({
          productId: first.id,
          type: first.type || 'regular',
          category: first.category || 'atividade',
          productName: first.name || '',
          duration: first.duration || '',
          variants: data.map(d => ({
            pricingType: d.pricingType || 'person', priceAdult: d.priceAdult || '',
            priceHalf: d.priceHalf || '', priceNet: d.priceNet || '',
            priceBrazilian: d.priceBrazilian || '', priceFree: d.priceFree || '',
            priceGroup: d.priceGroup || '', paxLimit: d.paxLimit || '',
            priceAdultHighSeason: d.priceAdultHighSeason || '',
            priceHalfHighSeason: d.priceHalfHighSeason || '',
            priceNetHighSeason: d.priceNetHighSeason || '',
            priceFreeHighSeason: d.priceFreeHighSeason || '',
            priceBrazilianHighSeason: d.priceBrazilianHighSeason || '',
            priceGroupHighSeason: d.priceGroupHighSeason || '',
          })),
        });
      });
  }, [id]);

  function setVariant(i, f, v) {
    setForm(p => ({ ...p, variants: p.variants.map((vr, idx) => idx === i ? { ...vr, [f]: v } : vr) }));
  }

  async function handleSubmit() {
    const res = await fetch(`${API_URL}/products/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); }
    else navigate('/listar-produtos');
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Editar Produto</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <FormControl fullWidth size="small"><InputLabel>Tipo</InputLabel>
                <Select value={form.type} label="Tipo" onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="privativo">Privativo</MenuItem>
                  <MenuItem value="show/evento">Show/Evento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth size="small"><InputLabel>Categoria</InputLabel>
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
          {form.variants.map((v, i) => (
            <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <FormControl fullWidth size="small"><InputLabel>Preço Por</InputLabel>
                    <Select value={v.pricingType} label="Preço Por" onChange={e => setVariant(i, 'pricingType', e.target.value)}>
                      <MenuItem value="person">Pessoa</MenuItem>
                      <MenuItem value="group">Grupo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}><TextField fullWidth size="small" label="Pax Lim." type="number" value={v.paxLimit} onChange={e => setVariant(i, 'paxLimit', e.target.value)} /></Grid>
                {v.pricingType === 'person' ? (
                  <>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Adulto" type="number" value={v.priceAdult} onChange={e => setVariant(i, 'priceAdult', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Meia" type="number" value={v.priceHalf} onChange={e => setVariant(i, 'priceHalf', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="NET" type="number" value={v.priceNet} onChange={e => setVariant(i, 'priceNet', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" label="Cortesia" type="number" value={v.priceFree} onChange={e => setVariant(i, 'priceFree', e.target.value)} /></Grid>
                  </>
                ) : (
                  <Grid item xs={2}><TextField fullWidth size="small" label="Grupo" type="number" value={v.priceGroup} onChange={e => setVariant(i, 'priceGroup', e.target.value)} /></Grid>
                )}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton color="error" onClick={() => setForm(p => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setForm(p => ({ ...p, variants: [...p.variants, newVariant()] }))}>Adicionar Variante</Button>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
            <Button variant="text" onClick={() => navigate('/listar-produtos')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
