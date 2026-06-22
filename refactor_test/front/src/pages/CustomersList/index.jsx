import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, InputAdornment,
  Divider, Chip, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress,
  Tooltip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import Swal from 'sweetalert2';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';
import { isReadOnly } from '../../utils/permissions';
import { COLORS } from '../../utils/colors';

const EMPTY_CUSTOMER = {
  companyName: '', customerType: 'Agência', address: '', phone: '', email: '', website: '', notes: '',
  razaoSocial: '', cnpj: '', inscricaoEstadual: '', enderecoFiscal: '',
  mainPhone: '', whatsapp: '', emailFinanceiro: '', emailComercial: '', status: 'Ativo',
};

const EMPTY_CONTACT = { firstName: '', lastName: '', role: '', email: '', whatsapp: '', notes: '' };

function InfoField({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: COLORS.textPrimary, whiteSpace: 'pre-line' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function CustomersList() {
  const { userName, userPermissions } = useStore();
  const readOnly = isReadOnly(userPermissions);

  const [customers, setCustomers]       = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab]             = useState(0);

  const [editOpen, setEditOpen]   = useState(false);
  const [editForm, setEditForm]   = useState({ ...EMPTY_CUSTOMER });

  const [newOpen, setNewOpen]     = useState(false);
  const [newForm, setNewForm]     = useState({ ...EMPTY_CUSTOMER });

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ ...EMPTY_CONTACT });
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editContactForm, setEditContactForm] = useState({ ...EMPTY_CONTACT, id: null });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/customers/list-all').then(r => r.json());
      setCustomers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    apiFetch('/settings/customer-types').then(r => r.json()).then(d => setCustomerTypes(d.map ? d.map(x => x.value) : []));
  }, [loadList]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/customers/list-by-id?customer_id=${id}`).then(r => r.json());
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function selectCustomer(cust) {
    setSelected(cust.id);
    setTab(0);
    setDetail(null);
    loadDetail(cust.id);
  }

  const filtered = customers.filter(c =>
    !search || c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Salvar novo cliente ──
  async function handleCreateCustomer() {
    if (!newForm.companyName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nome da empresa é obrigatório' }); return;
    }
    if (!newForm.customerType) {
      Swal.fire({ icon: 'warning', title: 'Tipo do cliente é obrigatório' }); return;
    }
    const res = await apiFetch('/customers/create', {
      method: 'POST', body: JSON.stringify({ ...newForm, createdBy: userName, lastEditBy: userName }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    setNewOpen(false);
    setNewForm({ ...EMPTY_CUSTOMER });
    await loadList();
    // Select newly created
    const refreshed = await apiFetch('/customers/list-all').then(r => r.json());
    const created = refreshed.find(c => c.id === data.customerId);
    if (created) selectCustomer(created);
  }

  // ── Salvar edição do cliente ──
  async function handleUpdateCustomer() {
    if (!editForm.companyName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nome da empresa é obrigatório' }); return;
    }
    const res = await apiFetch('/customers/update', {
      method: 'POST', body: JSON.stringify({ ...editForm, customerId: selected, lastEditBy: userName }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    setEditOpen(false);
    await loadList();
    await loadDetail(selected);
  }

  // ── Adicionar contato ──
  async function handleAddContact() {
    const res = await apiFetch('/customers/add-contact', {
      method: 'POST', body: JSON.stringify({ ...contactForm, customerId: selected, createdBy: userName, lastEditBy: userName }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    setContactOpen(false);
    setContactForm({ ...EMPTY_CONTACT });
    await loadDetail(selected);
  }

  // ── Excluir contato ──
  async function handleDeleteContact(contactId, name) {
    const { isConfirmed } = await Swal.fire({
      title: `Excluir contato "${name}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Excluir', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e2445c',
    });
    if (!isConfirmed) return;
    const res = await apiFetch(`/customers/delete-contact?id=${contactId}`);
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', 'Erro ao excluir', 'error'); return; }
    await loadDetail(selected);
  }

  function openEdit() {
    if (!detail) return;
    setEditForm({
      companyName: detail.companyName || '', customerType: detail.customerType || '',
      address: detail.address || '', phone: detail.phone || '', email: detail.email || '',
      website: detail.website || '', notes: detail.notes || '', razaoSocial: detail.razaoSocial || '',
      cnpj: detail.cnpj || '', inscricaoEstadual: detail.inscricaoEstadual || '',
      enderecoFiscal: detail.enderecoFiscal || '', mainPhone: detail.mainPhone || '',
      whatsapp: detail.whatsapp || '', emailFinanceiro: detail.emailFinanceiro || '',
      emailComercial: detail.emailComercial || '', status: detail.status || 'Ativo',
    });
    setEditOpen(true);
  }

  const toggleSx = {
    '& .MuiToggleButton-root': {
      px: 2, py: 0.7, fontSize: '0.82rem', fontWeight: 600,
      color: COLORS.textSecondary, borderColor: COLORS.border, textTransform: 'none',
    },
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Painel esquerdo — lista de clientes ── */}
      <Box sx={{
        width: 240, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`,
        display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc',
      }}>
        {/* Header */}
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: COLORS.textPrimary, mb: 1.5 }}>
            Clientes
          </Typography>
          <TextField
            size="small" fullWidth placeholder="Buscar..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
            }}
          />
        </Box>

        {!readOnly && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Button fullWidth size="small" variant="contained" startIcon={<AddRoundedIcon />}
              onClick={() => { setNewForm({ ...EMPTY_CUSTOMER }); setNewOpen(true); }}
              sx={{ fontSize: '0.78rem' }}>
              Novo Cliente
            </Button>
          </Box>
        )}

        <Divider />

        {/* Lista */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loading && filtered.length === 0 && (
            <Typography sx={{ p: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
              Nenhum cliente encontrado.
            </Typography>
          )}
          {filtered.map(c => (
            <Box key={c.id}
              onClick={() => selectCustomer(c)}
              sx={{
                px: 2, py: 1.25, cursor: 'pointer', fontSize: '0.83rem',
                borderLeft: '3px solid',
                borderLeftColor: selected === c.id ? COLORS.primary : 'transparent',
                bgcolor: selected === c.id ? COLORS.primaryAlpha : 'transparent',
                color: selected === c.id ? COLORS.primary : COLORS.textPrimary,
                fontWeight: selected === c.id ? 600 : 400,
                '&:hover': { bgcolor: selected === c.id ? COLORS.primaryAlpha : '#f0f2f5' },
                transition: 'all 0.12s',
              }}
            >
              {c.companyName}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Painel direito — detalhe ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {!selected && !detailLoading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
              Selecione um cliente para ver os detalhes
            </Typography>
          </Box>
        )}

        {detailLoading && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {detail && !detailLoading && (
          <Box sx={{ p: 3 }}>

            {/* Header do detalhe */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: COLORS.textPrimary }}>
                  {detail.companyName}
                </Typography>
                {detail.customerType && (
                  <Chip label={detail.customerType} size="small"
                    sx={{ bgcolor: '#f0f2ff', color: '#3d4eac', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #c5caf5' }} />
                )}
                <Chip
                  label={detail.status || 'Ativo'}
                  size="small"
                  sx={{
                    bgcolor: (detail.status || 'Ativo') === 'Ativo' ? '#e8f9f0' : '#fdecea',
                    color: (detail.status || 'Ativo') === 'Ativo' ? '#00875a' : '#c62828',
                    fontWeight: 700, fontSize: '0.72rem',
                    border: '1px solid', borderColor: (detail.status || 'Ativo') === 'Ativo' ? '#b3f0d8' : '#f5c6c6',
                  }}
                />
              </Box>
              {!readOnly && (
                <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={openEdit}>
                  Editar
                </Button>
              )}
            </Box>

            {/* Informações Gerais */}
            <Box sx={{ mb: 3, p: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: 2, bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>Informações Gerais</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <InfoField label="Nome da Empresa" value={detail.companyName} />
                  <InfoField label="Endereço" value={detail.address} />
                  <InfoField label="Telefone Geral" value={detail.phone} />
                  <InfoField label="E-mail Geral" value={detail.email} />
                  <InfoField label="Site" value={detail.website} />
                  <InfoField label="Observações" value={detail.notes} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    Dados para NF
                  </Typography>
                  <InfoField label="Razão Social" value={detail.razaoSocial} />
                  <InfoField label="CNPJ" value={detail.cnpj} />
                  <InfoField label="Inscrição Estadual" value={detail.inscricaoEstadual} />
                  <InfoField label="Endereço Fiscal" value={detail.enderecoFiscal} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    Contatos Principais
                  </Typography>
                  <InfoField label="Telefone" value={detail.mainPhone} />
                  <InfoField label="WhatsApp" value={detail.whatsapp} />
                  <InfoField label="E-mail Financeiro" value={detail.emailFinanceiro} />
                  <InfoField label="E-mail Comercial" value={detail.emailComercial} />
                </Grid>
              </Grid>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}
                textColor="primary" indicatorColor="primary"
                sx={{ '& .MuiTab-root': { fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', minWidth: 100 } }}>
                <Tab label="Contatos" />
                <Tab label="Financeiro" />
                <Tab label="Marketing" />
                <Tab label="Diretor" />
              </Tabs>
            </Box>

            {/* Tab: Contatos */}
            {tab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Contatos</Typography>
                  {!readOnly && (
                    <Button size="small" variant="contained" startIcon={<PersonAddRoundedIcon />}
                      onClick={() => { setContactForm({ ...EMPTY_CONTACT }); setContactOpen(true); }}>
                      Adicionar Contato
                    </Button>
                  )}
                </Box>

                {(!detail.contacts || detail.contacts.length === 0) ? (
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', py: 2 }}>
                    Nenhum contato cadastrado.
                  </Typography>
                ) : (
                  <Table size="small" sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 1, overflow: 'hidden' }}>
                    <TableHead sx={{ bgcolor: '#f5f6fa' }}>
                      <TableRow>
                        {['Nome', 'Sobrenome', 'Função', 'E-mail', 'WhatsApp', 'Observações', ''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.contacts.map(c => (
                        <TableRow key={c.id} hover>
                          <TableCell>{c.firstName}</TableCell>
                          <TableCell>{c.lastName}</TableCell>
                          <TableCell>{c.role}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.whatsapp}</TableCell>
                          <TableCell>{c.notes}</TableCell>
                          <TableCell sx={{ width: 40 }}>
                            {!readOnly && (
                              <Tooltip title="Excluir contato" arrow>
                                <IconButton size="small" color="error"
                                  onClick={() => handleDeleteContact(c.id, [c.firstName, c.lastName].filter(Boolean).join(' '))}>
                                  <DeleteRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {tab > 0 && (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Em breve.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── Dialog: Novo Cliente ── */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Novo Cliente</DialogTitle>
        <DialogContent>
          <CustomerForm form={newForm} setForm={setNewForm} customerTypes={customerTypes} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setNewOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateCustomer}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Editar Cliente ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Editar Cliente</DialogTitle>
        <DialogContent>
          <CustomerForm form={editForm} setForm={setEditForm} customerTypes={customerTypes} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateCustomer}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Adicionar Contato ── */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Adicionar Contato</DialogTitle>
        <DialogContent>
          <ContactForm form={contactForm} setForm={setContactForm} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setContactOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddContact}>Adicionar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

function CustomerForm({ form, setForm, customerTypes = [] }) {
  const f = (field, value) => setForm(p => ({ ...p, [field]: value }));
  return (
    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 3, height: 14, bgcolor: COLORS.primary, borderRadius: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Identificação
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField fullWidth size="small" label="Nome da Empresa *" autoFocus
          value={form.companyName} onChange={e => f('companyName', e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={form.customerType} label="Tipo" onChange={e => f('customerType', e.target.value)}>
            <MenuItem value=""><em>—</em></MenuItem>
            {customerTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={form.status} label="Status" onChange={e => f('status', e.target.value)}>
            <MenuItem value="Ativo">Ativo</MenuItem>
            <MenuItem value="Inativo">Inativo</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TextField fullWidth size="small" label="Endereço"
        value={form.address} onChange={e => f('address', e.target.value)} />
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Telefone Geral" value={form.phone} onChange={e => f('phone', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="E-mail Geral" value={form.email} onChange={e => f('email', e.target.value)} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Site" value={form.website} onChange={e => f('website', e.target.value)} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" multiline rows={2} label="Observações" value={form.notes} onChange={e => f('notes', e.target.value)} /></Grid>
      </Grid>

      <Divider />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 3, height: 14, bgcolor: '#fdab3d', borderRadius: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Dados para NF
        </Typography>
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Razão Social" value={form.razaoSocial} onChange={e => f('razaoSocial', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="CNPJ" value={form.cnpj} onChange={e => f('cnpj', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Inscrição Estadual" value={form.inscricaoEstadual} onChange={e => f('inscricaoEstadual', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Endereço Fiscal" value={form.enderecoFiscal} onChange={e => f('enderecoFiscal', e.target.value)} /></Grid>
      </Grid>

      <Divider />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 3, height: 14, bgcolor: '#a25ddc', borderRadius: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Contatos Principais
        </Typography>
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Telefone" value={form.mainPhone} onChange={e => f('mainPhone', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="WhatsApp" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="E-mail Financeiro" value={form.emailFinanceiro} onChange={e => f('emailFinanceiro', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="E-mail Comercial" value={form.emailComercial} onChange={e => f('emailComercial', e.target.value)} /></Grid>
      </Grid>
    </Box>
  );
}

function ContactForm({ form, setForm }) {
  const f = (field, value) => setForm(p => ({ ...p, [field]: value }));
  return (
    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Nome" autoFocus value={form.firstName} onChange={e => f('firstName', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Sobrenome" value={form.lastName} onChange={e => f('lastName', e.target.value)} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Função" value={form.role} onChange={e => f('role', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="E-mail" value={form.email} onChange={e => f('email', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="WhatsApp" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Observações" value={form.notes} onChange={e => f('notes', e.target.value)} /></Grid>
      </Grid>
    </Box>
  );
}
