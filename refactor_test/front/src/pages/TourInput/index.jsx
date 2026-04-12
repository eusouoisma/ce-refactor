import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Checkbox, FormControlLabel, Button, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';
import { getToken } from '../../utils/storage';
import { calcVariantValue, selectVariant, totalPax } from '../../utils/functions';

const PAX_TYPES = [
  { key: 'paxAdult', label: 'Adulto' },
  { key: 'paxHalf', label: 'Meia' },
  { key: 'paxFree', label: 'Cortesia' },
  { key: 'paxNet', label: 'NET' },
  { key: 'paxBrazilian', label: 'Brasileiro' },
];

const defaultForm = {
  type: 'regular', orderRef: '', platform: '', activity: '', adicional: '', duration: '',
  tourDate: '', tourHour: '', local: '', status: '', language: '', client: '', newCustomerType: '',
  paxAdult: 0, paxHalf: 0, paxFree: 0, paxNet: 0, paxBrazilian: 0,
  currency: '', paymentMethod: '', paymentStatus: '', totalValue: '', numberOfGroups: 0,
  ceGuide: [], clientName: '', clientContact: '', country: [], emailSubject: '',
  companionName: '', companionContact: '', isHighSeason: false, commissioned: false,
  comissionersName: '', comissionersContact: '', comissionCurrency: '', comissionPrice: '',
  comissionPaid: false, comissionByPercentage: false, comissionPercentage: '',
  comments: '', conversationHistory: '', dateOfRegistration: new Date().toISOString().split('T')[0],
};

export default function TourInput() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [form, setForm] = useState({ ...defaultForm });
  const [platforms, setPlatforms] = useState([]);
  const [products, setProducts] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [locals, setLocals] = useState([]);
  const [guides, setGuides] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [commissionModal, setCommissionModal] = useState(false);
  const [blockUpdateTotalValue, setBlockUpdateTotalValue] = useState(false);
  const [blockUpdateNumberOfGroups, setBlockUpdateNumberOfGroups] = useState(false);

  useEffect(() => {
    const urls = [
      `${API_URL}/settings/platforms`,
      `${API_URL}/products/list-all`,
      `${API_URL}/settings/languages`,
      `${API_URL}/settings/status`,
      `${API_URL}/settings/currencies`,
      `${API_URL}/settings/payment-methods`,
      `${API_URL}/settings/payment-status`,
      `${API_URL}/settings/locals`,
      `${API_URL}/settings/guides`,
      `${API_URL}/customers/list-grouped`,
      `${API_URL}/settings/countries`,
    ];
    Promise.all(urls.map(u => fetch(u).then(r => r.json())))
      .then(([pl, pr, la, st, cu, pm, ps, lo, gu, cust, co]) => {
        setPlatforms(pl.map ? pl.map(x => x.value) : []);
        setProducts(pr.map ? pr : []);
        setLanguages(la.map ? la.map(x => x.value) : []);
        setStatuses(st.map ? st.map(x => x.value) : []);
        setCurrencies(cu.map ? cu.map(x => x.value) : []);
        setPaymentMethods(pm.map ? pm.map(x => x.value) : []);
        setPaymentStatuses(ps.map ? ps.map(x => x.value) : []);
        setLocals(lo.map ? lo.map(x => x.value) : []);
        setGuides(gu.map ? gu.map(x => x.value) : []);
        setCustomers(cust.map ? cust : []);
        setCountries(co.map ? co.map(x => x.value) : []);
      });
  }, []);

  // Auto-calculate numberOfGroups for privativo
  useEffect(() => {
    if (form.type === 'privativo' && !blockUpdateNumberOfGroups) {
      const groups = Math.ceil((parseInt(form.paxAdult)||0) / 30) || 1;
      setForm(p => ({ ...p, numberOfGroups: groups }));
    }
  }, [form.paxAdult, form.type, blockUpdateNumberOfGroups]);

  // Auto-calculate totalValue
  useEffect(() => {
    if (blockUpdateTotalValue) return;
    const activities = products.filter(p => p.category !== 'adicional' && p.name === form.activity);
    if (activities.length === 0) return;
    const paxTotal = (parseInt(form.paxAdult)||0) + (parseInt(form.paxHalf)||0) +
      (parseInt(form.paxFree)||0) + (parseInt(form.paxNet)||0) + (parseInt(form.paxBrazilian)||0);
    // Get all variants for this product
    const productVariants = products.filter(p => p.name === form.activity && p.variantId);
    const variant = selectVariant(productVariants, paxTotal);
    let value = calcVariantValue(variant, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason);

    // Add additional product
    if (form.adicional) {
      const addVariants = products.filter(p => p.name === form.adicional && p.variantId);
      const addVariant = selectVariant(addVariants, paxTotal);
      value += calcVariantValue(addVariant, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason);
    }

    setForm(p => ({ ...p, totalValue: String(value) }));
  }, [form.activity, form.adicional, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason, products, blockUpdateTotalValue]);

  // Commission percentage calc
  useEffect(() => {
    if (form.comissionByPercentage && form.comissionPercentage && form.totalValue) {
      const price = (parseFloat(form.comissionPercentage) / 100) * parseFloat(form.totalValue);
      setForm(p => ({ ...p, comissionPrice: String(isNaN(price) ? '' : price) }));
    }
  }, [form.comissionByPercentage, form.comissionPercentage, form.totalValue]);

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(andNew = false) {
    const payload = {
      ...form,
      country: Array.isArray(form.country) ? form.country.join(', ') : form.country,
      createdBy: userName,
      lastEditBy: userName,
    };
    const res = await fetch(`${API_URL}/tours/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro ao salvar', 'error');
    } else {
      if (andNew) {
        setForm({ ...defaultForm });
        setBlockUpdateTotalValue(false);
        setBlockUpdateNumberOfGroups(false);
      } else {
        navigate('/listar-tours');
      }
    }
  }

  const activities = products.filter(p => p.category !== 'adicional');
  const additionals = products.filter(p => p.category === 'adicional');
  const uniqueActivities = [...new Set(activities.map(p => p.name))];
  const uniqueAdditionals = [...new Set(additionals.map(p => p.name))];
  const clientContacts = customers.find(c => c.name === form.client)?.contacts || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Cadastrar Tour</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={form.type} label="Tipo" onChange={e => set('type', e.target.value)}>
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="privativo">Privativo</MenuItem>
                  <MenuItem value="show/evento">Show/Evento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nº da Reserva" value={form.orderRef}
                onChange={e => set('orderRef', e.target.value)} placeholder="Deixe em branco para gerar auto" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox checked={form.isHighSeason} onChange={e => set('isHighSeason', e.target.checked)} />} label="Alta Temporada" />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={platforms} value={form.platform}
                onInputChange={(_, v) => set('platform', v)}
                renderInput={p => <TextField {...p} size="small" label="Plataforma" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={uniqueActivities} value={form.activity}
                onInputChange={(_, v) => set('activity', v)}
                renderInput={p => <TextField {...p} size="small" label="Atividade" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={uniqueAdditionals} value={form.adicional}
                onInputChange={(_, v) => set('adicional', v)}
                renderInput={p => <TextField {...p} size="small" label="Adicional" />} />
            </Grid>

            {form.platform === 'Email' && (
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Assunto do Email" value={form.emailSubject}
                  onChange={e => set('emailSubject', e.target.value)} />
              </Grid>
            )}

            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Data do Tour" type="date"
                value={form.tourDate} onChange={e => set('tourDate', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Hora" type="time"
                value={form.tourHour} onChange={e => set('tourHour', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Duração" value={form.duration}
                onChange={e => set('duration', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={locals} value={form.local}
                onInputChange={(_, v) => set('local', v)}
                renderInput={p => <TextField {...p} size="small" label="Local" />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={languages} value={form.language}
                onInputChange={(_, v) => set('language', v)}
                renderInput={p => <TextField {...p} size="small" label="Idioma" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={statuses} value={form.status}
                onInputChange={(_, v) => set('status', v)}
                renderInput={p => <TextField {...p} size="small" label="Status" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple options={countries} value={form.country}
                onChange={(_, v) => set('country', v)}
                renderInput={p => <TextField {...p} size="small" label="País(es)" />} />
            </Grid>

            {/* PAX Section */}
            {PAX_TYPES.map(pax => (
              <Grid item xs={6} sm={2} key={pax.key}>
                <TextField fullWidth size="small" label={pax.label} type="number"
                  value={form[pax.key]} onChange={e => set(pax.key, parseInt(e.target.value)||0)} />
              </Grid>
            ))}

            {form.type === 'privativo' && (
              <Grid item xs={6} sm={2}>
                <TextField fullWidth size="small" label="Nº Grupos" type="number"
                  value={form.numberOfGroups}
                  onChange={e => {
                    setBlockUpdateNumberOfGroups(true);
                    set('numberOfGroups', parseInt(e.target.value)||0);
                  }} />
              </Grid>
            )}

            {/* Financial */}
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={currencies} value={form.currency}
                onInputChange={(_, v) => set('currency', v)}
                renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={paymentMethods} value={form.paymentMethod}
                onInputChange={(_, v) => set('paymentMethod', v)}
                renderInput={p => <TextField {...p} size="small" label="Método de Pagamento" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={paymentStatuses} value={form.paymentStatus}
                onInputChange={(_, v) => set('paymentStatus', v)}
                renderInput={p => <TextField {...p} size="small" label="Status de Pagamento" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat
                customInput={TextField} fullWidth size="small" label="Valor Total"
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.totalValue}
                onValueChange={v => {
                  setBlockUpdateTotalValue(true);
                  set('totalValue', v.value);
                }}
              />
            </Grid>

            {/* Client */}
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={customers.map(c => c.name)} value={form.client}
                onInputChange={(_, v) => set('client', v)}
                renderInput={p => <TextField {...p} size="small" label="Cliente" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo
                options={clientContacts.map(c => c.contactName || '')}
                value={form.clientName}
                onInputChange={(_, v) => {
                  set('clientName', v);
                  const contact = clientContacts.find(c => c.contactName === v);
                  if (contact) set('clientContact', contact.contactEmail || '');
                }}
                renderInput={p => <TextField {...p} size="small" label="Nome do Cliente" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contato do Cliente" value={form.clientContact}
                onChange={e => set('clientContact', e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nome do Guia Acompanhante" value={form.companionName}
                onChange={e => set('companionName', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contato do Guia" value={form.companionContact}
                onChange={e => set('companionContact', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple options={guides} value={form.ceGuide}
                onChange={(_, v) => set('ceGuide', v)}
                renderInput={p => <TextField {...p} size="small" label="Guias CE" />} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={form.commissioned}
                  onChange={e => {
                    set('commissioned', e.target.checked);
                    if (e.target.checked) setCommissionModal(true);
                  }}
                />}
                label="Comissionado"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Observações"
                value={form.comments} onChange={e => set('comments', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Histórico da Conversa"
                value={form.conversationHistory} onChange={e => set('conversationHistory', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Data de Registro" type="date"
                value={form.dateOfRegistration} onChange={e => set('dateOfRegistration', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit(false)}>Salvar</Button>
            <Button variant="outlined" onClick={() => handleSubmit(true)}>Salvar e Criar Outra</Button>
            <Button variant="text" onClick={() => navigate('/listar-tours')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Commission Modal */}
      <Dialog open={commissionModal} onClose={() => setCommissionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dados da Comissão</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Nome do Comissionado" value={form.comissionersName}
                onChange={e => set('comissionersName', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Contato do Comissionado" value={form.comissionersContact}
                onChange={e => set('comissionersContact', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Moeda</InputLabel>
                <Select value={form.comissionCurrency} label="Moeda"
                  onChange={e => set('comissionCurrency', e.target.value)}>
                  {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Valor da Comissão" value={form.comissionPrice}
                onChange={e => set('comissionPrice', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.comissionPaid} onChange={e => set('comissionPaid', e.target.checked)} />} label="Pago" />
              <FormControlLabel control={<Checkbox checked={form.comissionByPercentage} onChange={e => set('comissionByPercentage', e.target.checked)} />} label="Calcular por porcentagem" />
            </Grid>
            {form.comissionByPercentage && (
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Percentual (%)" type="number"
                  value={form.comissionPercentage} onChange={e => set('comissionPercentage', e.target.value)} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommissionModal(false)} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
