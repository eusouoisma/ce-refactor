import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, TextField, Autocomplete,
  Button, Checkbox, FormControlLabel,
  ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Divider, Chip, Grid,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import { calcVariantValue, selectVariant } from '../../utils/functions';
import { COLORS } from '../../utils/colors';

const PAX_TYPES = [
  { key: 'paxAdult',     label: 'Adulto' },
  { key: 'paxHalf',      label: 'Meia' },
  { key: 'paxFree',      label: 'Cortesia' },
  { key: 'paxNet',       label: 'NET' },
  { key: 'paxBrazilian', label: 'Brasileiro' },
];

const defaultForm = {
  type: 'regular', clientType: 'b2b', orderRef: '', platform: '', activity: '', adicional: '', duration: '',
  tourDate: '', tourHour: '', local: '', status: '', language: '', client: '',
  paxAdult: 0, paxHalf: 0, paxFree: 0, paxNet: 0, paxBrazilian: 0,
  currency: '', paymentMethod: '', paymentStatus: '', totalValue: '', numberOfGroups: 0,
  ceGuide: [], clientName: '', clientContact: '', country: [], emailSubject: '',
  companionName: '', companionContact: '', isHighSeason: false, commissioned: false,
  comissionersName: '', comissionersContact: '', comissionCurrency: '', comissionPrice: '',
  comissionPaid: false, comissionByPercentage: false, comissionPercentage: '',
  comments: '', conversationHistory: '', dateOfRegistration: new Date().toISOString().split('T')[0],
};

// ── Componentes auxiliares ─────────────────────────────────────────────────

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

function PaxCounter({ label, value, onChange, sublabel }) {
  const [localVal, setLocalVal] = useState(String(value));
  useEffect(() => { setLocalVal(String(value)); }, [value]);

  function commit(raw) {
    const n = parseInt(raw);
    onChange(isNaN(n) || n < 0 ? 0 : n);
  }

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
      py: 1.75, px: 1.25, borderRadius: 2,
      border: `1.5px solid ${value > 0 ? COLORS.primary + '55' : COLORS.border}`,
      bgcolor: value > 0 ? COLORS.primaryAlpha : '#fafafa',
      transition: 'all 0.15s',
      flex: 1, minWidth: 0,
    }}>
      <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.05em' }}>
        {label.toUpperCase()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <IconButton size="small" onClick={() => onChange(Math.max(0, value - 1))}
          sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.07)', '&:hover': { bgcolor: 'rgba(0,0,0,0.13)' } }}>
          <RemoveRoundedIcon sx={{ fontSize: 13 }} />
        </IconButton>
        <Box
          component="input"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && commit(localVal)}
          sx={{
            width: 36, textAlign: 'center', border: 'none', outline: 'none',
            fontWeight: 800, fontSize: '1.1rem',
            color: value > 0 ? COLORS.primary : COLORS.textPrimary,
            background: 'transparent', cursor: 'text', fontFamily: 'inherit',
            '&::-webkit-inner-spin-button': { display: 'none' },
            '&::-webkit-outer-spin-button': { display: 'none' },
          }}
        />
        <IconButton size="small" onClick={() => onChange(value + 1)}
          sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.07)', '&:hover': { bgcolor: 'rgba(0,0,0,0.13)' } }}>
          <AddRoundedIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>
      {sublabel && (
        <Typography sx={{ fontSize: '0.6rem', color: COLORS.textSecondary, fontStyle: 'italic' }}>
          {sublabel}
        </Typography>
      )}
    </Box>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function TourInput() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userPermissions } = useStore();
  const readOnly = isReadOnly(userPermissions);
  const planneId    = location.state?.planneId   || null;
  const planneData  = location.state?.planneData || null;
  const [form, setForm] = useState(() =>
    planneData ? { ...defaultForm, ...planneData } : { ...defaultForm }
  );
  const [platforms, setPlatforms]             = useState([]);
  const [products, setProducts]               = useState([]);
  const [languages, setLanguages]             = useState([]);
  const [statuses, setStatuses]               = useState([]);
  const [currencies, setCurrencies]           = useState([]);
  const [paymentMethods, setPaymentMethods]   = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [locals, setLocals]                   = useState([]);
  const [guides, setGuides]                   = useState([]);
  const [customers, setCustomers]             = useState([]);
  const [countries, setCountries]             = useState([]);
  const [commissionModal, setCommissionModal] = useState(false);
  const [blockUpdateTotalValue, setBlockUpdateTotalValue]         = useState(!!planneData);
  const [blockUpdateNumberOfGroups, setBlockUpdateNumberOfGroups] = useState(!!planneData);
  const [durationManuallyEdited, setDurationManuallyEdited]       = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [recurrence, setRecurrence] = useState({ interval: 1, unit: 'week', days: [], endDate: '' });
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ companyName: '', customerType: 'Agência' });
  const [customerTypes, setCustomerTypes] = useState([]);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ firstName: '', lastName: '', role: '', email: '', whatsapp: '' });

  useEffect(() => {
    const paths = [
      '/settings/platforms',
      '/products/list-all',
      '/settings/languages',
      '/settings/status',
      '/settings/currencies',
      '/settings/payment-methods',
      '/settings/payment-status',
      '/settings/locals',
      '/settings/guides',
      '/customers/list-grouped',
      '/settings/countries',
      '/settings/customer-types',
    ];
    Promise.all(paths.map(p => apiFetch(p).then(r => r.json())))
      .then(([pl, pr, la, st, cu, pm, ps, lo, gu, cust, co, ct]) => {
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
        setCustomerTypes(ct.map ? ct.map(x => x.value) : []);
      });
  }, []);

  // Auto-calcula numberOfGroups para privativo (ceil(paxAdult / 30))
  useEffect(() => {
    if (form.type === 'privativo' && !blockUpdateNumberOfGroups) {
      const groups = Math.ceil((parseInt(form.paxAdult) || 0) / 30) || 1;
      setForm(p => ({ ...p, numberOfGroups: groups }));
    }
  }, [form.paxAdult, form.type, blockUpdateNumberOfGroups]);

  // Auto-calcula totalValue (não roda para show/evento — entrada manual)
  useEffect(() => {
    if (blockUpdateTotalValue) return;
    if (form.type === 'show/evento') return;

    const activityVariants = products.filter(p => p.category !== 'adicional' && p.name === form.activity && p.variantId);
    if (activityVariants.length === 0) return;

    // Privativo usa apenas paxAdult; Regular soma Adult+Half+Net+Brazilian (Free não entra na faixa)
    const paxTotal = form.type === 'privativo'
      ? (parseInt(form.paxAdult) || 0)
      : (parseInt(form.paxAdult)||0) + (parseInt(form.paxHalf)||0) + (parseInt(form.paxNet)||0) + (parseInt(form.paxBrazilian)||0);

    const variant = selectVariant(activityVariants, paxTotal);
    let value = calcVariantValue(variant, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason);

    if (form.adicional) {
      const addVariants = products.filter(p => p.category === 'adicional' && p.name === form.adicional && p.variantId);
      const addVariant = selectVariant(addVariants, paxTotal);
      value += calcVariantValue(addVariant, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason);
    }

    setForm(p => ({ ...p, totalValue: String(value) }));
  }, [form.type, form.activity, form.adicional, form.paxAdult, form.paxHalf, form.paxFree, form.paxNet, form.paxBrazilian, form.numberOfGroups, form.isHighSeason, products, blockUpdateTotalValue]);

  // Calcula valor de comissão por percentual
  useEffect(() => {
    if (form.comissionByPercentage && form.comissionPercentage && form.totalValue) {
      const price = (parseFloat(form.comissionPercentage) / 100) * parseFloat(form.totalValue);
      setForm(p => ({ ...p, comissionPrice: String(isNaN(price) ? '' : price) }));
    }
  }, [form.comissionByPercentage, form.comissionPercentage, form.totalValue]);

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  // Ao trocar o tipo de tour, reseta campos dependentes
  function handleTypeChange(_, v) {
    if (!v) return;
    setForm(p => ({
      ...p,
      type: v,
      activity: '',
      adicional: '',
      duration: '',
      paxAdult: 0, paxHalf: 0, paxFree: 0, paxNet: 0, paxBrazilian: 0,
      numberOfGroups: 0,
      totalValue: '',
    }));
    setBlockUpdateTotalValue(false);
    setBlockUpdateNumberOfGroups(false);
    setDurationManuallyEdited(false);
  }

  async function handleSubmit(andNew = false) {
    if (readOnly) return;
    const payload = {
      ...form,
      country: Array.isArray(form.country) ? form.country.join(', ') : form.country,
      createdBy: userName,
      lastEditBy: userName,
      ...(planneId ? { planneId } : {}),
    };
    const res = await apiFetch('/tours/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      Swal.fire('Erro', data.message || 'Erro ao salvar', 'error');
    } else if (andNew) {
      await Swal.fire({ icon: 'success', title: 'Tour cadastrado com sucesso!' });
      setForm({ ...defaultForm });
      setBlockUpdateTotalValue(false);
      setBlockUpdateNumberOfGroups(false);
    } else {
      await Swal.fire({ icon: 'success', title: 'Tour cadastrado com sucesso!' });
      navigate(planneId ? '/importar-planne' : '/listar-tours');
    }
  }

  async function handleSaveRecurrence() {
    if (readOnly) return;
    if (!form.tourDate) { Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Defina a data do tour antes de criar recorrência.', customClass: { container: 'swal-on-top' } }); return; }
    if (!recurrence.endDate) { Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Informe a data final da recorrência.', customClass: { container: 'swal-on-top' } }); return; }
    if (recurrence.unit === 'week' && recurrence.days.length === 0) { Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione ao menos um dia da semana.', customClass: { container: 'swal-on-top' } }); return; }

    const payload = {
      ...form,
      country: Array.isArray(form.country) ? form.country.join(', ') : form.country,
      createdBy: userName,
      lastEditBy: userName,
    };
    const res  = await apiFetch('/tours/create-recurrence', { method: 'POST', body: JSON.stringify({ tourData: payload, recurrence }) });
    const data = await res.json();
    if (data.error) {
      Swal.fire({ icon: 'error', title: 'Erro', text: data.message || 'Erro ao criar recorrência', customClass: { container: 'swal-on-top' } });
    } else {
      setRecurrenceOpen(false);
      await Swal.fire({ icon: 'success', title: `${data.count} tour${data.count !== 1 ? 's' : ''} criado${data.count !== 1 ? 's' : ''} com sucesso!` });
      navigate('/listar-tours');
    }
  }

  async function handleSaveNewClient() {
    if (!newClientForm.companyName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Informe o nome da empresa', customClass: { container: 'swal-on-top' } });
      return;
    }
    if (!newClientForm.customerType) {
      Swal.fire({ icon: 'warning', title: 'Selecione o tipo do cliente', customClass: { container: 'swal-on-top' } });
      return;
    }
    const res = await apiFetch('/customers/create', { method: 'POST', body: JSON.stringify({ ...newClientForm, createdBy: userName, lastEditBy: userName }) });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    const refreshed = await apiFetch('/customers/list-grouped').then(r => r.json());
    setCustomers(refreshed.map ? refreshed : []);
    setForm(p => ({ ...p, client: newClientForm.companyName, clientName: '', clientContact: '' }));
    setNewClientOpen(false);
    setNewClientForm({ companyName: '', customerType: 'Agência' });
  }

  async function handleSaveNewContact() {
    if (!form.client) return;
    const customer = customers.find(c => c.name === form.client);
    if (!customer) return;
    const res = await apiFetch('/customers/add-contact', {
      method: 'POST',
      body: JSON.stringify({ customerId: customer.id, ...newContactForm, createdBy: userName, lastEditBy: userName }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    const refreshed = await apiFetch('/customers/list-grouped').then(r => r.json());
    setCustomers(refreshed.map ? refreshed : []);
    const fullName = [newContactForm.firstName, newContactForm.lastName].filter(Boolean).join(' ');
    setForm(p => ({ ...p, clientName: fullName, clientContact: newContactForm.email || newContactForm.whatsapp || '' }));
    setNewContactOpen(false);
    setNewContactForm({ firstName: '', lastName: '', role: '', email: '', whatsapp: '' });
  }

  // Atividades filtradas pelo tipo de tour selecionado
  const uniqueActivities = [...new Set(
    products.filter(p => p.category !== 'adicional' && p.type === form.type).map(p => p.name)
  )];
  const uniqueAdditionals = [...new Set(
    products.filter(p => p.category === 'adicional').map(p => p.name)
  )];
  const clientContacts  = customers.find(c => c.name === form.client)?.contacts || [];
  const clientContactNames = clientContacts.map(c => [c.firstName, c.lastName].filter(Boolean).join(' '));
  const totalPaxCount   = PAX_TYPES.reduce((s, p) => s + (parseInt(form[p.key]) || 0), 0);
  const isShowEvento    = form.type === 'show/evento';
  const isPrivativo     = form.type === 'privativo';
  const isB2B           = form.clientType === 'b2b';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Área rolável ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3.5 }}>

        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.textPrimary, lineHeight: 1.2 }}>
            Cadastrar Tour
          </Typography>
          {planneId && (
            <Box sx={{ mt: 1, px: 1.5, py: 0.75, bgcolor: '#e8f4fd', borderRadius: 1.5, border: '1px solid #b3d9f5', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.primary, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.primary, fontWeight: 600 }}>
                Importação da Planne — revise os dados e salve para confirmar
              </Typography>
            </Box>
          )}
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

          {/* ── Identificação + Data e Local ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>

            <Section label="Identificação" color={COLORS.primary}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField fullWidth size="small" label="Nº da Reserva"
                    value={form.orderRef} onChange={e => set('orderRef', e.target.value)}
                    placeholder="Gerado automaticamente" />
                  <Autocomplete freeSolo options={statuses} value={form.status}
                    onInputChange={(_, v) => set('status', v)}
                    renderInput={p => <TextField {...p} size="small" label="Status" />} />
                </Box>
                <Autocomplete freeSolo options={platforms} value={form.platform}
                  onInputChange={(_, v) => set('platform', v)}
                  renderInput={p => <TextField {...p} size="small" label="Plataforma" />} />
                {form.platform === 'Email' && (
                  <TextField fullWidth size="small" label="Assunto do Email"
                    value={form.emailSubject} onChange={e => set('emailSubject', e.target.value)} />
                )}
                <FormControlLabel
                  control={<Checkbox checked={form.isHighSeason} size="small"
                    onChange={e => set('isHighSeason', e.target.checked)} />}
                  label={<Typography sx={{ fontSize: '0.83rem', fontWeight: 500 }}>Alta Temporada</Typography>}
                  sx={{ m: 0 }}
                />
              </Box>
            </Section>

            <Section label="Data e Local" color="#fdab3d">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField fullWidth size="small" label="Data do Tour" type="date"
                    value={form.tourDate} onChange={e => set('tourDate', e.target.value)}
                    InputLabelProps={{ shrink: true }} />
                  <TextField fullWidth size="small" label="Horário" type="time"
                    value={form.tourHour} onChange={e => set('tourHour', e.target.value)}
                    InputLabelProps={{ shrink: true }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField fullWidth size="small" label="Duração"
                    value={form.duration} onChange={e => { setDurationManuallyEdited(true); set('duration', e.target.value); }} />
                  <Autocomplete freeSolo options={locals} value={form.local}
                    onInputChange={(_, v) => set('local', v)}
                    renderInput={p => <TextField {...p} size="small" label="Local" />} />
                </Box>
                <Autocomplete multiple options={countries} value={form.country}
                  onChange={(_, v) => set('country', v)}
                  renderInput={p => <TextField {...p} size="small" label="País(es)" />} />
              </Box>
            </Section>

          </Box>

          <Divider />

          {/* ── Atividade ── */}
          <Section label="Atividade" color="#ff642e">
            {/* As opções de atividade mudam conforme o tipo de tour selecionado */}
            <Box sx={{ display: 'grid', gridTemplateColumns: isShowEvento ? '1fr 1fr' : '1fr 1fr 1fr', gap: 1.75 }}>
              <Autocomplete freeSolo options={uniqueActivities} value={form.activity}
                onInputChange={(_, v) => {
                  set('activity', v);
                  if (!durationManuallyEdited) {
                    const prod = products.find(p => p.name === v && p.category !== 'adicional');
                    if (prod?.duration) set('duration', prod.duration);
                  }
                }}
                renderInput={p => <TextField {...p} size="small" label="Atividade" />} />
              <Autocomplete freeSolo options={uniqueAdditionals} value={form.adicional}
                onInputChange={(_, v) => set('adicional', v)}
                renderInput={p => <TextField {...p} size="small" label="Adicional" />} />
              {!isShowEvento && (
                <Autocomplete freeSolo options={languages} value={form.language}
                  onInputChange={(_, v) => set('language', v)}
                  renderInput={p => <TextField {...p} size="small" label="Idioma" />} />
              )}
            </Box>
          </Section>

          {/* ── Participantes (oculto para show/evento) ── */}
          {!isShowEvento && (
            <>
              <Divider />
              <Section label="Participantes" color="#a25ddc">
                <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>

                  {/* Regular: todos os tipos de pax */}
                  {!isPrivativo && PAX_TYPES.map(pax => (
                    <PaxCounter key={pax.key} label={pax.label}
                      value={form[pax.key]} onChange={v => set(pax.key, v)} />
                  ))}

                  {/* Privativo: apenas paxAdult + numberOfGroups */}
                  {isPrivativo && (
                    <>
                      <PaxCounter label="Nº de Pax" value={form.paxAdult}
                        onChange={v => set('paxAdult', v)} />
                      <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                        py: 1.75, px: 1.25, borderRadius: 2,
                        border: `1.5px solid ${COLORS.border}`,
                        bgcolor: '#fafafa',
                        flex: 1, minWidth: 0,
                      }}>
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.05em' }}>
                          GRUPOS
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <IconButton size="small"
                            onClick={() => { setBlockUpdateNumberOfGroups(true); set('numberOfGroups', Math.max(1, form.numberOfGroups - 1)); }}
                            sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.07)', '&:hover': { bgcolor: 'rgba(0,0,0,0.13)' } }}>
                            <RemoveRoundedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 26, textAlign: 'center', color: COLORS.textPrimary }}>
                            {form.numberOfGroups}
                          </Typography>
                          <IconButton size="small"
                            onClick={() => { setBlockUpdateNumberOfGroups(true); set('numberOfGroups', form.numberOfGroups + 1); }}
                            sx={{ width: 24, height: 24, bgcolor: 'rgba(0,0,0,0.07)', '&:hover': { bgcolor: 'rgba(0,0,0,0.13)' } }}>
                            <AddRoundedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                        <Typography sx={{ fontSize: '0.61rem', color: COLORS.textSecondary, fontStyle: 'italic' }}>
                          auto-calculado
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                {!isPrivativo && totalPaxCount > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Chip label={`${totalPaxCount} pax no total`} size="small"
                      sx={{ bgcolor: '#a25ddc18', color: '#7b3fad', fontWeight: 700, fontSize: '0.74rem', border: '1px solid #a25ddc44' }} />
                  </Box>
                )}
              </Section>
            </>
          )}

          <Divider />

          {/* ── Financeiro ── */}
          <Section label="Financeiro" color="#00c875">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 1.75, alignItems: 'start' }}>
              <Autocomplete freeSolo options={currencies} value={form.currency}
                onInputChange={(_, v) => set('currency', v)}
                renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
              <Autocomplete freeSolo options={paymentMethods} value={form.paymentMethod}
                onInputChange={(_, v) => set('paymentMethod', v)}
                renderInput={p => <TextField {...p} size="small" label="Método de Pagamento" />} />
              <Autocomplete freeSolo options={paymentStatuses} value={form.paymentStatus}
                onInputChange={(_, v) => set('paymentStatus', v)}
                renderInput={p => <TextField {...p} size="small" label="Status do Pagamento" />} />
              <NumericFormat
                customInput={TextField} fullWidth
                label={isShowEvento ? 'Valor Total (manual)' : 'Valor Total'}
                thousandSeparator="." decimalSeparator="," decimalScale={2}
                value={form.totalValue}
                onValueChange={(v, sourceInfo) => { if (sourceInfo.event) setBlockUpdateTotalValue(true); set('totalValue', v.value); }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.05rem', fontWeight: 700, color: COLORS.textPrimary,
                    '& fieldset': {
                      borderColor: form.totalValue ? '#00c87566' : undefined,
                      borderWidth: form.totalValue ? 1.5 : 1,
                    },
                  },
                }}
              />
            </Box>
          </Section>

          <Divider />

          {/* ── Cliente e Guias ── */}
          <Section label="Cliente e Guias" color="#0086c0">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>

              {/* Toggle B2B / B2C */}
              <Box>
                <ToggleButtonGroup
                  value={form.clientType} exclusive size="small"
                  onChange={(_, v) => { if (v) setForm(p => ({ ...p, clientType: v, client: '', clientName: '', clientContact: '' })); }}
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
                  <ToggleButton value="b2b">B2B</ToggleButton>
                  <ToggleButton value="b2c">B2C</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* B2B: selects com search + botões para adicionar */}
              {isB2B && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                    <Autocomplete
                      options={customers.map(c => c.name)}
                      value={form.client || null}
                      onChange={(_, v) => setForm(p => ({ ...p, client: v || '', clientName: '', clientContact: '' }))}
                      renderInput={p => <TextField {...p} size="small" label="Cliente" />}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                    <Autocomplete
                      options={clientContactNames}
                      value={form.clientName || null}
                      disabled={!form.client}
                      onChange={(_, v) => {
                        setForm(p => ({ ...p, clientName: v || '' }));
                        const contact = clientContacts.find(c => [c.firstName, c.lastName].filter(Boolean).join(' ') === v);
                        if (contact) set('clientContact', contact.email || contact.whatsapp || '');
                      }}
                      renderInput={p => <TextField {...p} size="small" label="Nome do Cliente" />}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField fullWidth size="small" label="Contato"
                      value={form.clientContact} onChange={e => set('clientContact', e.target.value)} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, pt: 0.5 }}>
                    <Button size="small" variant="outlined" startIcon={<BusinessRoundedIcon />}
                      onClick={() => { setNewClientForm({ companyName: '', customerType: 'Agência' }); setNewClientOpen(true); }}
                      sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      Novo Cliente
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<PersonAddRoundedIcon />}
                      disabled={!form.client}
                      onClick={() => { setNewContactForm({ firstName: '', lastName: '', role: '', email: '', whatsapp: '' }); setNewContactOpen(true); }}
                      sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      Novo Contato
                    </Button>
                  </Box>
                </Box>
              )}

              {/* B2C: nome do cliente e contato como campos livres */}
              {!isB2B && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
                  <TextField fullWidth size="small" label="Nome do Cliente"
                    value={form.clientName} onChange={e => set('clientName', e.target.value)} />
                  <TextField fullWidth size="small" label="Contato do Cliente"
                    value={form.clientContact} onChange={e => set('clientContact', e.target.value)} />
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.75 }}>
                <TextField fullWidth size="small" label="Nome do Guia"
                  value={form.companionName} onChange={e => set('companionName', e.target.value)} />
                <TextField fullWidth size="small" label="Contato do Guia"
                  value={form.companionContact} onChange={e => set('companionContact', e.target.value)} />
                <Autocomplete multiple options={guides} value={form.ceGuide}
                  onChange={(_, v) => set('ceGuide', v)}
                  renderInput={p => <TextField {...p} size="small" label="Guia do CE" />} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.commissioned} size="small"
                      onChange={e => { set('commissioned', e.target.checked); if (e.target.checked) setCommissionModal(true); }} />
                  }
                  label={<Typography sx={{ fontSize: '0.83rem', fontWeight: 500 }}>Comissionado</Typography>}
                  sx={{ m: 0 }}
                />
                {form.commissioned && form.comissionersName && (
                  <Chip label={form.comissionersName} size="small"
                    onClick={() => setCommissionModal(true)}
                    sx={{ fontSize: '0.72rem', height: 22, cursor: 'pointer', bgcolor: '#fdab3d22', color: '#9a6200', border: '1px solid #fdab3d55' }} />
                )}
              </Box>
            </Box>
          </Section>

          <Divider />

          {/* ── Notas ── */}
          <Section label="Notas" color="#676879">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
              <TextField fullWidth multiline rows={4} size="small" label="Observações"
                value={form.comments} onChange={e => set('comments', e.target.value)} />
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
        <Button variant="contained" onClick={() => handleSubmit(false)} disabled={readOnly} sx={{ px: 3.5 }}>
          Salvar
        </Button>
        <Button variant="outlined" onClick={() => handleSubmit(true)} disabled={readOnly}>
          Salvar e Criar Outro
        </Button>
        <Button variant="outlined" onClick={() => setRecurrenceOpen(true)} disabled={readOnly} sx={{ color: '#7b1fa2', borderColor: '#7b1fa2', '&:hover': { borderColor: '#6a0080', bgcolor: 'rgba(123,31,162,0.06)' } }}>
          Criar Recorrência
        </Button>
        <Button variant="text" sx={{ color: COLORS.textSecondary }} onClick={() => navigate('/listar-tours')}>
          Cancelar
        </Button>
      </Box>

      {/* ── Modal de recorrência ── */}
      <Dialog open={recurrenceOpen} onClose={() => setRecurrenceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          Recorrência personalizada
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>

            {/* Repetir a cada */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Repetir a cada:</Typography>
              <TextField
                type="number" size="small" sx={{ width: 72 }}
                inputProps={{ min: 1 }}
                value={recurrence.interval}
                onChange={e => setRecurrence(p => ({ ...p, interval: Math.max(1, parseInt(e.target.value) || 1) }))}
              />
              <TextField
                select size="small" sx={{ width: 120 }}
                value={recurrence.unit}
                onChange={e => setRecurrence(p => ({ ...p, unit: e.target.value, days: [] }))}
                SelectProps={{ native: true }}
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
              </TextField>
            </Box>

            {/* Repetir nos dias (só semana) */}
            {recurrence.unit === 'week' && (
              <Box>
                <Typography sx={{ fontSize: '0.9rem', mb: 1 }}>Repetir nos dias:</Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((label, idx) => {
                    const selected = recurrence.days.includes(idx);
                    return (
                      <Box
                        key={idx}
                        onClick={() => setRecurrence(p => ({
                          ...p,
                          days: selected ? p.days.filter(d => d !== idx) : [...p.days, idx],
                        }))}
                        sx={{
                          width: 44, height: 34, borderRadius: '8px', border: '2px solid',
                          borderColor: selected ? COLORS.primary : 'rgba(0,0,0,0.25)',
                          bgcolor: selected ? COLORS.primary : 'transparent',
                          color: selected ? '#fff' : 'text.secondary',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: COLORS.primary, opacity: 0.85 },
                        }}
                      >
                        {label}
                      </Box>
                    );
                  })}
                </Box>
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={recurrence.days.length === 7}
                      onChange={e => setRecurrence(p => ({ ...p, days: e.target.checked ? [0,1,2,3,4,5,6] : [] }))}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.9rem' }}>Todos</Typography>}
                />
              </Box>
            )}

            {/* Até */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Até:</Typography>
              <TextField
                type="date" size="small" fullWidth
                value={recurrence.endDate}
                onChange={e => setRecurrence(p => ({ ...p, endDate: e.target.value }))}
                inputProps={{ min: form.tourDate || '' }}
              />
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setRecurrenceOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveRecurrence}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal de comissão ── */}
      <Dialog open={commissionModal} onClose={() => setCommissionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Dados da Comissão</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField fullWidth size="small" label="Nome do Comissionado"
                value={form.comissionersName} onChange={e => set('comissionersName', e.target.value)} />
              <TextField fullWidth size="small" label="Contato"
                value={form.comissionersContact} onChange={e => set('comissionersContact', e.target.value)} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Autocomplete freeSolo options={currencies} value={form.comissionCurrency}
                onInputChange={(_, v) => set('comissionCurrency', v)}
                renderInput={p => <TextField {...p} size="small" label="Moeda" />} />
              <TextField fullWidth size="small" label="Valor da Comissão"
                value={form.comissionPrice} onChange={e => set('comissionPrice', e.target.value)}
                disabled={form.comissionByPercentage} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Checkbox checked={form.comissionPaid} size="small" onChange={e => set('comissionPaid', e.target.checked)} />}
                label={<Typography sx={{ fontSize: '0.83rem' }}>Pago</Typography>}
                sx={{ m: 0 }}
              />
              <FormControlLabel
                control={<Checkbox checked={form.comissionByPercentage} size="small" onChange={e => set('comissionByPercentage', e.target.checked)} />}
                label={<Typography sx={{ fontSize: '0.83rem' }}>Calcular por porcentagem</Typography>}
                sx={{ m: 0 }}
              />
            </Box>
            {form.comissionByPercentage && (
              <TextField fullWidth size="small" label="Percentual (%)" type="number"
                value={form.comissionPercentage} onChange={e => set('comissionPercentage', e.target.value)} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCommissionModal(false)} variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Novo Cliente ── */}
      <Dialog open={newClientOpen} onClose={() => setNewClientOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Novo Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField fullWidth size="small" label="Nome *" autoFocus
              value={newClientForm.companyName}
              onChange={e => setNewClientForm(p => ({ ...p, companyName: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSaveNewClient()} />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={newClientForm.customerType} label="Tipo"
                onChange={e => setNewClientForm(p => ({ ...p, customerType: e.target.value }))}>
                <MenuItem value=""><em>—</em></MenuItem>
                {customerTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setNewClientOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveNewClient}>Adicionar ao CRM</Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Novo Contato ── */}
      <Dialog open={newContactOpen} onClose={() => setNewContactOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          Novo Contato — {form.client}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField fullWidth size="small" label="Nome" autoFocus
                value={newContactForm.firstName}
                onChange={e => setNewContactForm(p => ({ ...p, firstName: e.target.value }))} />
              <TextField fullWidth size="small" label="Sobrenome"
                value={newContactForm.lastName}
                onChange={e => setNewContactForm(p => ({ ...p, lastName: e.target.value }))} />
            </Box>
            <TextField fullWidth size="small" label="Função"
              value={newContactForm.role}
              onChange={e => setNewContactForm(p => ({ ...p, role: e.target.value }))} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField fullWidth size="small" label="E-mail"
                value={newContactForm.email}
                onChange={e => setNewContactForm(p => ({ ...p, email: e.target.value }))} />
              <TextField fullWidth size="small" label="WhatsApp"
                value={newContactForm.whatsapp}
                onChange={e => setNewContactForm(p => ({ ...p, whatsapp: e.target.value }))} />
            </Box>
            <TextField fullWidth size="small" label="Observações" multiline rows={2}
              value={newContactForm.notes}
              onChange={e => setNewContactForm(p => ({ ...p, notes: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setNewContactOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveNewContact}>Adicionar ao CRM</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
