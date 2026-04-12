import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Button, Autocomplete, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

export default function FinancialTourUpdate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { userName } = useStore();
  const [form, setForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [accountNumbers, setAccountNumbers] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);

  useEffect(() => {
    const urls = [
      `${API_URL}/products/list-all`,
      `${API_URL}/settings/status`,
      `${API_URL}/settings/currencies`,
      `${API_URL}/settings/payment-methods`,
      `${API_URL}/settings/payment-status`,
      `${API_URL}/settings/companies`,
      `${API_URL}/settings/account-numbers`,
      `${API_URL}/tours/list-by-id?tour_id=${id}`,
      `${API_URL}/changeRequests/get-by-tour-id?tour_id=${id}`,
    ];
    Promise.all(urls.map(u => fetch(u).then(r => r.json())))
      .then(([pr, st, cu, pm, ps, co, an, tour, crs]) => {
        setProducts(pr.map ? pr : []);
        setStatuses(st.map ? st.map(x => x.value) : []);
        setCurrencies(cu.map ? cu.map(x => x.value) : []);
        setPaymentMethods(pm.map ? pm.map(x => x.value) : []);
        setPaymentStatuses(ps.map ? ps.map(x => x.value) : []);
        setCompanies(co.map ? co.map(x => x.value) : []);
        setAccountNumbers(an.map ? an.map(x => x.value) : []);
        if (tour && !tour.error) {
          setForm({
            ...tour,
            isHighSeason: tour.isHighSeason == 1,
            commissioned: tour.commissioned == 1,
            comissionPaid: tour.comissionPaid == 1,
            tourDate: tour.tourDate ? String(tour.tourDate).split('T')[0] : '',
            paymentDate: tour.paymentDate ? String(tour.paymentDate).split('T')[0] : '',
          });
        }
        setChangeRequests(Array.isArray(crs) ? crs.map(cr => ({ ...cr, approved: false, reproved: false })) : []);
      });
  }, [id]);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function approveCr(i) { setChangeRequests(p => p.map((cr, idx) => idx === i ? { ...cr, approved: true, reproved: false } : cr)); }
  function reproveCr(i) { setChangeRequests(p => p.map((cr, idx) => idx === i ? { ...cr, reproved: true, approved: false } : cr)); }

  async function handleSubmit() {
    const payload = { ...form, changeRequests, lastEditBy: userName };
    const res = await fetch(`${API_URL}/tours/update-financial?id=${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro', 'error');
    } else {
      navigate('/listar-tours-financeiro');
    }
  }

  async function deleteCommission() {
    if (!form.commissionId) return;
    await fetch(`${API_URL}/comissions/delete?id=${form.commissionId}`);
    set('commissioned', false);
    set('commissionId', null);
  }

  if (!form) return <Box sx={{ p: 3 }}>Carregando...</Box>;

  const activityOptions = [...new Set(products.map(p => p.name))];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Editar Tour Financeiro #{id}</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={companies} value={form.company||''}
                onInputChange={(_, v) => set('company', v)}
                renderInput={p => <TextField {...p} size="small" label="Empresa" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nº Fatura" value={form.invoiceNumber||''}
                onChange={e => set('invoiceNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo options={statuses} value={form.status||''}
                onInputChange={(_, v) => set('status', v)}
                renderInput={p => <TextField {...p} size="small" label="Status" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={paymentStatuses} value={form.paymentStatus||''}
                onInputChange={(_, v) => set('paymentStatus', v)}
                renderInput={p => <TextField {...p} size="small" label="Status Pgto" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={accountNumbers} value={form.accountNumber||''}
                onInputChange={(_, v) => set('accountNumber', v)}
                renderInput={p => <TextField {...p} size="small" label="Nº Conta" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Data Pgto" type="date"
                value={form.paymentDate||''} onChange={e => set('paymentDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Data Tour" type="date"
                value={form.tourDate||''} onChange={e => set('tourDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Hora" type="time"
                value={form.tourHour||''} onChange={e => set('tourHour', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={activityOptions} value={form.activity||''}
                onInputChange={(_, v) => set('activity', v)}
                renderInput={p => <TextField {...p} size="small" label="Atividade" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Cliente" value={form.client||''} onChange={e => set('client', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Nº Reserva" value={form.orderRef||''} onChange={e => set('orderRef', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo options={currencies} value={form.currency||''}
                onInputChange={(_, v) => set('currency', v)}
                renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat customInput={TextField} fullWidth size="small" label="Valor Total"
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.totalValue||''} onValueChange={v => set('totalValue', v.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat customInput={TextField} fullWidth size="small" label="Valor Líquido"
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.netValue||''} onValueChange={v => set('netValue', v.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} size="small" label="Comentários Financeiros"
                value={form.financialComments||''} onChange={e => set('financialComments', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={!!form.commissioned} onChange={e => { set('commissioned', e.target.checked); }} />} label="Comissionado" />
              {form.commissioned && form.commissionId && <Button color="error" size="small" onClick={deleteCommission}>Excluir Comissão</Button>}
            </Grid>
          </Grid>

          {changeRequests.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Change Requests</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Campo</TableCell><TableCell>Valor Antigo</TableCell><TableCell>Novo Valor</TableCell><TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changeRequests.map((cr, i) => (
                    <TableRow key={i}>
                      <TableCell>{cr.name}</TableCell>
                      <TableCell>{cr.oldValue}</TableCell>
                      <TableCell>{cr.newValue}</TableCell>
                      <TableCell>
                        {!cr.approved && !cr.reproved && (
                          <>
                            <Button size="small" color="success" onClick={() => approveCr(i)}>Aprovar</Button>
                            <Button size="small" color="error" onClick={() => reproveCr(i)}>Reprovar</Button>
                          </>
                        )}
                        {cr.approved && <Chip label="Aprovado" color="success" size="small" />}
                        {cr.reproved && <Chip label="Reprovado" color="error" size="small" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
            <Button variant="text" onClick={() => navigate('/listar-tours-financeiro')}>Cancelar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
