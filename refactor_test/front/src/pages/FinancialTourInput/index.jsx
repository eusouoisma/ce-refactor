import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Autocomplete,
  Button, Checkbox, FormControlLabel,
  ToggleButton, ToggleButtonGroup, Divider,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { COLORS } from '../../utils/colors';

const defaultForm = {
  type: 'regular', company: '', invoiceNumber: '', status: '', paymentStatus: '',
  accountNumber: '', paymentDate: '', tourDate: '', tourHour: '', activity: '', adicional: '',
  isHighSeason: false, client: '', clientName: '', clientContact: '', orderRef: '',
  paymentMethod: '', currency: '', totalValue: '', netValue: '', comments: '',
  financialComments: '', commissioned: false, conversationHistory: '',
  dateOfRegistration: new Date().toISOString().split('T')[0],
};

function Section({ label, color = COLORS.primary, children }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ width: 3, height: 14, bgcolor: color, borderRadius: 2, flexShrink: 0 }} />
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 700, color: COLORS.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

export default function FinancialTourInput() {
  const navigate = useNavigate();
  const { userName } = useStore();
  const [form, setForm] = useState({ ...defaultForm });
  const [products, setProducts]             = useState([]);
  const [statuses, setStatuses]             = useState([]);
  const [currencies, setCurrencies]         = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [companies, setCompanies]           = useState([]);
  const [accountNumbers, setAccountNumbers] = useState([]);

  useEffect(() => {
    const urls = [
      '/products/list-all',
      '/settings/status',
      '/settings/currencies',
      '/settings/payment-methods',
      '/settings/payment-status',
      '/settings/companies',
      '/settings/account-numbers',
    ];
    Promise.all(urls.map(p => apiFetch(p).then(r => r.json())))
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

  function handleTypeChange(_, v) {
    if (!v) return;
    setForm(p => ({ ...p, type: v, activity: '', adicional: '' }));
  }

  async function handleSubmit(andNew = false) {
    const payload = { ...form, createdBy: userName, lastEditBy: userName };
    const res = await apiFetch('/tours/create-financial', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro ao salvar', 'error');
    } else if (andNew) {
      await Swal.fire({ icon: 'success', title: 'Tour cadastrado com sucesso!' });
      setForm({ ...defaultForm });
    } else {
      await Swal.fire({ icon: 'success', title: 'Tour cadastrado com sucesso!' });
      navigate('/listar-tours-financeiro');
    }
  }

  const activityOptions = [...new Set(
    products.filter(p => p.category !== 'adicional').map(p => p.name)
  )];
  const additionalOptions = [...new Set(
    products.filter(p => p.category === 'adicional').map(p => p.name)
  )];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Área rolável ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3.5 }}>

        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.textPrimary, lineHeight: 1.2 }}>
            Cadastrar Tour Financeiro
          </Typography>
        </Box>

        {/* Seletor de tipo */}
        <Box sx={{ mb: 3.5 }}>
          <ToggleButtonGroup
            value={form.type} exclusive onChange={handleTypeChange} size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2.5, py: 0.7,
                fontSize: '0.82rem', fontWeight: 600,
                fontFamily: '"Poppins", sans-serif',
                color: COLORS.textSecondary,
                borderColor: COLORS.border,
                textTransform: 'none',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: COLORS.primary, color: '#fff', borderColor: COLORS.primary,
                  '&:hover': { bgcolor: COLORS.primaryDark },
                },
                '&:not(.Mui-selected):hover': { bgcolor: COLORS.primaryAlpha, color: COLORS.primary },
              },
            }}
          >
            <ToggleButton value="regular">Regular</ToggleButton>
            <ToggleButton value="privativo">Privativo</ToggleButton>
            <ToggleButton value="show/evento">Show / Evento</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>

          {/* ── Identificação ── */}
          <Section label="Identificação" color={COLORS.primary}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <Autocomplete freeSolo options={companies} value={form.company}
                  onInputChange={(_, v) => set('company', v)}
                  renderInput={p => <TextField {...p} size="small" label="Empresa" />} />
                <TextField fullWidth size="small" label="Nº da NF" value={form.invoiceNumber}
                  onChange={e => set('invoiceNumber', e.target.value)} />
                <TextField fullWidth size="small" label="Nº da Reserva" value={form.orderRef}
                  onChange={e => set('orderRef', e.target.value)} />
              </Box>
              <Autocomplete freeSolo options={statuses} value={form.status}
                onInputChange={(_, v) => set('status', v)}
                renderInput={p => <TextField {...p} size="small" label="Status Reserva" />} />
            </Box>
          </Section>

          <Divider />

          {/* ── Datas ── */}
          <Section label="Datas" color="#fdab3d">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
              <TextField fullWidth size="small" label="Data do Tour" type="date"
                value={form.tourDate} onChange={e => set('tourDate', e.target.value)}
                InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" label="Hora do Tour" type="time"
                value={form.tourHour} onChange={e => set('tourHour', e.target.value)}
                InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" label="Data de Pagamento" type="date"
                value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Box>
          </Section>

          <Divider />

          {/* ── Atividade ── */}
          <Section label="Atividade" color="#ff642e">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
              <Autocomplete freeSolo options={activityOptions} value={form.activity}
                onInputChange={(_, v) => set('activity', v)}
                renderInput={p => <TextField {...p} size="small" label="Atividade" />} />
              <Autocomplete freeSolo options={additionalOptions} value={form.adicional}
                onInputChange={(_, v) => set('adicional', v)}
                renderInput={p => <TextField {...p} size="small" label="Adicional" />} />
            </Box>
          </Section>

          <Divider />

          {/* ── Financeiro ── */}
          <Section label="Financeiro" color="#00c875">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Autocomplete freeSolo options={paymentStatuses} value={form.paymentStatus}
                  onInputChange={(_, v) => set('paymentStatus', v)}
                  renderInput={p => <TextField {...p} size="small" label="Status de Pagamento" />} />
                <Autocomplete freeSolo options={accountNumbers} value={form.accountNumber}
                  onInputChange={(_, v) => set('accountNumber', v)}
                  renderInput={p => <TextField {...p} size="small" label="Número de Conta" />} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1.5 }}>
                <Autocomplete freeSolo options={currencies} value={form.currency}
                  onInputChange={(_, v) => set('currency', v)}
                  renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
                <Autocomplete freeSolo options={paymentMethods} value={form.paymentMethod}
                  onInputChange={(_, v) => set('paymentMethod', v)}
                  renderInput={p => <TextField {...p} size="small" label="Método de Pagamento" />} />
                <NumericFormat customInput={TextField} fullWidth size="small" label="Valor Total"
                  thousandSeparator="." decimalSeparator="," decimalScale={2}
                  value={form.totalValue} onValueChange={v => set('totalValue', v.value)} />
                <NumericFormat customInput={TextField} fullWidth size="small" label="Valor NET"
                  thousandSeparator="." decimalSeparator="," decimalScale={2}
                  value={form.netValue} onValueChange={v => set('netValue', v.value)} />
              </Box>
              <FormControlLabel
                control={<Checkbox checked={form.isHighSeason} size="small"
                  onChange={e => set('isHighSeason', e.target.checked)} />}
                label={<Typography sx={{ fontSize: '0.83rem', fontWeight: 500 }}>Alta Temporada</Typography>}
                sx={{ m: 0 }}
              />
            </Box>
          </Section>

          <Divider />

          {/* ── Cliente ── */}
          <Section label="Cliente" color="#0086c0">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <TextField fullWidth size="small" label="Cliente" value={form.client}
                  onChange={e => set('client', e.target.value)} />
                <TextField fullWidth size="small" label="Nome do Cliente" value={form.clientName}
                  onChange={e => set('clientName', e.target.value)} />
                <TextField fullWidth size="small" label="Contato do Cliente" value={form.clientContact}
                  onChange={e => set('clientContact', e.target.value)} />
              </Box>
              <FormControlLabel
                control={<Checkbox checked={form.commissioned} size="small"
                  onChange={e => set('commissioned', e.target.checked)} />}
                label={<Typography sx={{ fontSize: '0.83rem', fontWeight: 500 }}>Comissionado</Typography>}
                sx={{ m: 0 }}
              />
            </Box>
          </Section>

          <Divider />

          {/* ── Notas ── */}
          <Section label="Notas" color="#676879">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.75 }}>
              <TextField fullWidth multiline rows={4} size="small" label="Observações Escritório"
                value={form.comments} onChange={e => set('comments', e.target.value)} />
              <TextField fullWidth multiline rows={4} size="small" label="Observações Financeiro"
                value={form.financialComments} onChange={e => set('financialComments', e.target.value)} />
              <TextField fullWidth multiline rows={4} size="small" label="Histórico da Conversa"
                value={form.conversationHistory} onChange={e => set('conversationHistory', e.target.value)} />
            </Box>
          </Section>

        </Box>
      </Box>

      {/* ── Footer fixo ── */}
      <Box sx={{
        flexShrink: 0, borderTop: `1px solid ${COLORS.border}`,
        px: 3.5, py: 2, display: 'flex', gap: 1.5, alignItems: 'center',
        bgcolor: '#fff',
      }}>
        <Button variant="contained" onClick={() => handleSubmit(false)} sx={{ px: 3.5 }}>
          Salvar
        </Button>
        <Button variant="outlined" onClick={() => handleSubmit(true)}>
          Salvar e Criar Outro
        </Button>
        <Button variant="text" sx={{ color: COLORS.textSecondary }} onClick={() => navigate('/listar-tours-financeiro')}>
          Cancelar
        </Button>
      </Box>

    </Box>
  );
}
