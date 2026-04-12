import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Button, Autocomplete } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

const defaultForm = {
  type: 'regular', company: '', invoiceNumber: '', status: '', paymentStatus: '',
  accountNumber: '', paymentDate: '', tourDate: '', tourHour: '', activity: '', adicional: '',
  isHighSeason: false, client: '', clientName: '', clientContact: '', orderRef: '',
  paymentMethod: '', currency: '', totalValue: '', netValue: '', financialComments: '',
  commissioned: false, comissionersName: '', comissionersContact: '', comissionCurrency: '',
  comissionPrice: '', comissionPaid: false,
  comments: '', conversationHistory: '',
  dateOfRegistration: new Date().toISOString().split('T')[0],
};

export default function FinancialTourInput() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [form, setForm] = useState({ ...defaultForm });
  const [products, setProducts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [accountNumbers, setAccountNumbers] = useState([]);

  useEffect(() => {
    const urls = [
      `${API_URL}/products/list-all`,
      `${API_URL}/settings/status`,
      `${API_URL}/settings/currencies`,
      `${API_URL}/settings/payment-methods`,
      `${API_URL}/settings/payment-status`,
      `${API_URL}/settings/companies`,
      `${API_URL}/settings/account-numbers`,
    ];
    Promise.all(urls.map(u => fetch(u).then(r => r.json())))
      .then(([pr, st, cu, pm, ps, co, an]) => {
        setProducts(pr.map ? pr : []);
        setStatuses(st.map ? st.map(x => x.value) : []);
        setCurrencies(cu.map ? cu.map(x => x.value) : []);
        setPaymentMethods(pm.map ? pm.map(x => x.value) : []);
        setPaymentStatuses(ps.map ? ps.map(x => x.value) : []);
        setCompanies(co.map ? co.map(x => x.value) : []);
        setAccountNumbers(an.map ? an.map(x => x.value) : []);
      });
  }, []);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit(andNew = false) {
    const payload = { ...form, createdBy: userName, lastEditBy: userName };
    const res = await fetch(`${API_URL}/tours/create-financial`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro ao salvar', 'error');
    } else if (andNew) {
      setForm({ ...defaultForm });
    } else {
      navigate('/listar-tours-financeiro');
    }
  }

  const activityOptions = [...new Set(products.map(p => p.name))];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Cadastrar Tour Financeiro</Typography>
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
              <Autocomplete freeSolo options={companies} value={form.company}
                onInputChange={(_, v) => set('company', v)}
                renderInput={p => <TextField {...p} size="small" label="Empresa" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nº Fatura" value={form.invoiceNumber}
                onChange={e => set('invoiceNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={statuses} value={form.status}
                onInputChange={(_, v) => set('status', v)}
                renderInput={p => <TextField {...p} size="small" label="Status" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={paymentStatuses} value={form.paymentStatus}
                onInputChange={(_, v) => set('paymentStatus', v)}
                renderInput={p => <TextField {...p} size="small" label="Status Pgto" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={accountNumbers} value={form.accountNumber}
                onInputChange={(_, v) => set('accountNumber', v)}
                renderInput={p => <TextField {...p} size="small" label="Nº Conta" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Data Pgto" type="date"
                value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Data Tour" type="date"
                value={form.tourDate} onChange={e => set('tourDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Hora Tour" type="time"
                value={form.tourHour} onChange={e => set('tourHour', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={activityOptions} value={form.activity}
                onInputChange={(_, v) => set('activity', v)}
                renderInput={p => <TextField {...p} size="small" label="Atividade" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Adicional" value={form.adicional}
                onChange={e => set('adicional', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox checked={form.isHighSeason} onChange={e => set('isHighSeason', e.target.checked)} />} label="Alta Temporada" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Cliente" value={form.client}
                onChange={e => set('client', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nome do Cliente" value={form.clientName}
                onChange={e => set('clientName', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contato" value={form.clientContact}
                onChange={e => set('clientContact', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nº Reserva" value={form.orderRef}
                onChange={e => set('orderRef', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={paymentMethods} value={form.paymentMethod}
                onInputChange={(_, v) => set('paymentMethod', v)}
                renderInput={p => <TextField {...p} size="small" label="Método Pgto" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={currencies} value={form.currency}
                onInputChange={(_, v) => set('currency', v)}
                renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat customInput={TextField} fullWidth size="small" label="Valor Total"
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.totalValue} onValueChange={v => set('totalValue', v.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat customInput={TextField} fullWidth size="small" label="Valor Líquido"
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.netValue} onValueChange={v => set('netValue', v.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Comentários Financeiros"
                value={form.financialComments} onChange={e => set('financialComments', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.commissioned} onChange={e => set('commissioned', e.target.checked)} />} label="Comissionado" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Observações"
                value={form.comments} onChange={e => set('comments', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Histórico da Conversa"
                value={form.conversationHistory} onChange={e => set('conversationHistory', e.target.value)} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit(false)}>Salvar</Button>
            <Button variant="outlined" onClick={() => handleSubmit(true)}>Salvar e Criar Outra</Button>
            <Button variant="text" onClick={() => navigate('/listar-tours-financeiro')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
