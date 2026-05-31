import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { forwardRef } from 'react';
import { NumericFormat } from 'react-number-format';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Divider, Dialog, Chip,
  DialogTitle, DialogContent, DialogActions, Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { apiFetch } from '../../utils/api';
import { formatMoney } from '../../utils/functions';
import { useStore } from '../../components/Store';

const PAYMENT_TYPES = { hour: 'Por Hora', tour: 'Por Tour', day: 'Por Dia', special: 'Especial' };

const TYPE_CHIP = {
  Fixo:   { color: 'success' },
  Extra:  { color: 'warning' },
  Evento: { color: 'info' },
};

const MoneyInput = forwardRef((props, ref) => {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={values => onChange({ target: { name: other.name, value: values.value } })}
      allowLeadingZeros={false}
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator=","
      allowedDecimalSeparators={['.']}
      thousandSeparator="."
      isAllowed={v => v.value.length <= 9}
    />
  );
});

// Reusable section header with left accent bar
function SectionLabel({ children }) {
  return (
    <Typography
      variant="subtitle2"
      fontWeight={700}
      sx={{
        mb: 1,
        pl: 1.25,
        borderLeft: '3px solid',
        borderColor: 'primary.main',
        lineHeight: 1.4,
        color: 'text.primary',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontSize: '0.72rem',
      }}
    >
      {children}
    </Typography>
  );
}

// Consistent table header cell
function TH({ children, align }) {
  return (
    <TableCell align={align} sx={{ fontWeight: 700, bgcolor: '#f5f5f5', fontSize: '0.78rem', py: 0.75, whiteSpace: 'nowrap' }}>
      {children}
    </TableCell>
  );
}

// Zebra row
function TR({ children, index }) {
  return (
    <TableRow hover sx={{ bgcolor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
      {children}
    </TableRow>
  );
}

const emptyFn  = { name: '', orderNumber: '' };
const emptyEmp = { function: '', type: '', name: '', phone: '' };
const emptyRem = { functionId: '', paymentType: 'day', activity: '', hourlyValue1: '', hourlyValue2: '', hourlyValue3: '' };

export default function DayOrderSettings() {
  const { userPermissions } = useStore();
  const canEdit = ![5].includes(parseInt(userPermissions));

  const [functions,     setFunctions]     = useState([]);
  const [empOptions,    setEmpOptions]    = useState([]);
  const [remunerations, setRemunerations] = useState([]);
  const [activities,    setActivities]    = useState([]);
  const [empFilter,     setEmpFilter]     = useState({ function: '', type: '', name: '' });

  const [newFn,     setNewFn]     = useState(emptyFn);
  const [editingFn, setEditingFn] = useState(null);

  const [newEmp,     setNewEmp]     = useState(emptyEmp);
  const [editingEmp, setEditingEmp] = useState(null);

  const [newRem, setNewRem] = useState(emptyRem);

  function load() {
    apiFetch('/day-order/list-functions').then(r => r.json()).then(setFunctions);
    apiFetch('/day-order/list-employees-options').then(r => r.json()).then(d =>
      setEmpOptions(Array.isArray(d) ? d.sort((a, b) => a.function.localeCompare(b.function)) : [])
    );
    apiFetch('/day-order/list-remunerations').then(r => r.json()).then(d => setRemunerations(Array.isArray(d) ? d : []));
    apiFetch('/day-order/list-activities', { method: 'POST' }).then(r => r.json()).then(d =>
      setActivities(Array.isArray(d) ? d.map(x => x.name) : [])
    );
  }

  useEffect(() => { load(); }, []);

  async function createFn(e) {
    e.preventDefault();
    if (!canEdit) return;
    await apiFetch('/day-order/create-function', { method: 'POST', body: JSON.stringify(newFn) });
    setNewFn(emptyFn);
    load();
    Swal.fire({ title: 'Função cadastrada!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function deleteFn(id) {
    if (!canEdit) return;
    const c = await Swal.fire({ title: 'Tem certeza que deseja excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!c.isConfirmed) return;
    await apiFetch(`/day-order/delete-function?id=${id}`);
    load();
    Swal.fire({ title: 'Função removida!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function saveEditFn(e) {
    e.preventDefault();
    if (!canEdit) return;
    const res = await apiFetch('/day-order/edit-function', { method: 'POST', body: JSON.stringify(editingFn) });
    const data = await res.json();
    if (data.error) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' }); return; }
    setEditingFn(null);
    load();
    Swal.fire({ title: 'Função editada!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function createEmp(e) {
    e.preventDefault();
    if (!canEdit) return;
    const res = await apiFetch('/day-order/create-employee-option', { method: 'POST', body: JSON.stringify(newEmp) });
    const data = await res.json();
    if (data.error) { Swal.fire({ icon: 'error', title: 'Oops...', text: data.message || 'Algo deu errado!' }); return; }
    setNewEmp(emptyEmp);
    load();
    Swal.fire({ title: 'Colaborador cadastrado!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function deleteEmp(id) {
    if (!canEdit) return;
    const c = await Swal.fire({ title: 'Tem certeza que deseja excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!c.isConfirmed) return;
    await apiFetch(`/day-order/delete-employee?id=${id}`);
    load();
    Swal.fire({ title: 'Colaborador removido!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function saveEditEmp(e) {
    e.preventDefault();
    if (!canEdit) return;
    const res = await apiFetch('/day-order/edit-employee-option', { method: 'POST', body: JSON.stringify(editingEmp) });
    const data = await res.json();
    if (data.error) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' }); return; }
    setEditingEmp(null);
    load();
    Swal.fire({ title: 'Colaborador editado!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function createRem(e) {
    e.preventDefault();
    if (!canEdit) return;
    const res = await apiFetch('/day-order/create-remuneration', { method: 'POST', body: JSON.stringify(newRem) });
    const data = await res.json();
    if (data.error) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' }); return; }
    setNewRem(emptyRem);
    load();
    Swal.fire({ title: 'Salário cadastrado!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async function deleteRem(id) {
    if (!canEdit) return;
    const c = await Swal.fire({ title: 'Tem certeza que deseja excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!c.isConfirmed) return;
    await apiFetch(`/day-order/delete-remuneration?id=${id}`);
    load();
    Swal.fire({ title: 'Removido!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  const getFnName      = id => functions.find(f => f.id === id)?.name || id;
  const isGuideSelected = functions.find(f => f.id === newRem.functionId)?.name === 'Guia';

  const filteredEmps = empOptions.filter(e => {
    const matchFn   = !empFilter.function || e.function?.toLowerCase().includes(empFilter.function.toLowerCase());
    const matchType = !empFilter.type     || e.type?.toLowerCase().includes(empFilter.type.toLowerCase());
    const matchName = !empFilter.name     || e.name?.toLowerCase().includes(empFilter.name.toLowerCase());
    return matchFn && matchType && matchName;
  });

  const remsGuia    = remunerations.filter(r => getFnName(r.functionId) === 'Guia');
  const remsDay     = remunerations.filter(r => r.paymentType === 'day'     && getFnName(r.functionId) !== 'Guia');
  const remsHour    = remunerations.filter(r => r.paymentType === 'hour'    && getFnName(r.functionId) !== 'Guia');
  const remsSpecial = remunerations.filter(r => r.paymentType === 'special');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Configurações — Ordem do Dia</Typography>

      {/* ── FUNÇÕES ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Funções</Typography>

          <Box component="form" onSubmit={createFn} sx={{ mb: 2 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField fullWidth size="small" label="Nome" value={newFn.name}
                  onChange={e => setNewFn(p => ({ ...p, name: e.target.value }))} required />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Ordem" type="number" value={newFn.orderNumber}
                  onChange={e => setNewFn(p => ({ ...p, orderNumber: e.target.value }))} required />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button variant="contained" type="submit" disabled={!canEdit} fullWidth>Criar</Button>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TH>Nome</TH>
                  <TH>Ordem</TH>
                  <TH />
                </TableRow>
              </TableHead>
              <TableBody>
                {functions.map((f, i) => (
                  <TR key={f.id} index={i}>
                    <TableCell sx={{ fontWeight: 500 }}>{f.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{f.orderNumber}</TableCell>
                    <TableCell align="right" sx={{ py: 0.25 }}>
                      <IconButton size="small" color="primary" onClick={() => setEditingFn({ ...f })} disabled={!canEdit}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error"   onClick={() => deleteFn(f.id)}         disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TR>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── SALÁRIOS ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>Salários</Typography>

          {/* Guias + Por Hora — side by side */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <SectionLabel>Guias</SectionLabel>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TH>Atividade</TH>
                      <TH>Valor por tour</TH>
                      <TH />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {remsGuia.map((r, i) => (
                      <TR key={r.id} index={i}>
                        <TableCell>{r.activity}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>R$ {formatMoney(r.hourlyValue1)}</TableCell>
                        <TableCell align="right" sx={{ py: 0.25 }}>
                          <IconButton size="small" color="error" onClick={() => deleteRem(r.id)} disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TR>
                    ))}
                    {remsGuia.length === 0 && (
                      <TableRow><TableCell colSpan={3} sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5, fontSize: '0.8rem' }}>Nenhum registro</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionLabel>Por Hora</SectionLabel>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TH>Função</TH>
                      <TH>Valor/hora</TH>
                      <TH />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {remsHour.map((r, i) => (
                      <TR key={r.id} index={i}>
                        <TableCell>{getFnName(r.functionId)}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>R$ {formatMoney(r.hourlyValue1)}</TableCell>
                        <TableCell align="right" sx={{ py: 0.25 }}>
                          <IconButton size="small" color="error" onClick={() => deleteRem(r.id)} disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TR>
                    ))}
                    {remsHour.length === 0 && (
                      <TableRow><TableCell colSpan={3} sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5, fontSize: '0.8rem' }}>Nenhum registro</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>

          {/* Por Dia — full width (4 value columns) */}
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Por Dia</SectionLabel>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TH>Função</TH>
                    <TH align="right">0h – 8h</TH>
                    <TH align="right">8h1min – 10h</TH>
                    <TH align="right">10h1min – 12h</TH>
                    <TH />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {remsDay.map((r, i) => (
                    <TR key={r.id} index={i}>
                      <TableCell>{getFnName(r.functionId)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>R$ {formatMoney(r.hourlyValue1)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>R$ {formatMoney(r.hourlyValue2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>R$ {formatMoney(r.hourlyValue3)}</TableCell>
                      <TableCell align="right" sx={{ py: 0.25 }}>
                        <IconButton size="small" color="error" onClick={() => deleteRem(r.id)} disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TR>
                  ))}
                  {remsDay.length === 0 && (
                    <TableRow><TableCell colSpan={5} sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5, fontSize: '0.8rem' }}>Nenhum registro</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Especial */}
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Especial</SectionLabel>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TH>Função</TH>
                    <TH>Tipo</TH>
                    <TH />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {remsSpecial.map((r, i) => (
                    <TR key={r.id} index={i}>
                      <TableCell>{getFnName(r.functionId)}</TableCell>
                      <TableCell><Chip label="Especial" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                      <TableCell align="right" sx={{ py: 0.25 }}>
                        <IconButton size="small" color="error" onClick={() => deleteRem(r.id)} disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TR>
                  ))}
                  {remsSpecial.length === 0 && (
                    <TableRow><TableCell colSpan={3} sx={{ color: 'text.disabled', textAlign: 'center', py: 1.5, fontSize: '0.8rem' }}>Nenhum registro</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Novo Salário</Typography>
          <Box component="form" onSubmit={createRem}>
            <Grid container spacing={1.5} alignItems="flex-end">
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Função</InputLabel>
                  <Select value={newRem.functionId} label="Função"
                    onChange={e => setNewRem(p => ({
                      ...p,
                      functionId: e.target.value,
                      paymentType: functions.find(f => f.id === e.target.value)?.name === 'Guia' ? 'tour' : p.paymentType,
                    }))}>
                    {functions.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {!isGuideSelected && (
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select value={newRem.paymentType} label="Tipo"
                      onChange={e => setNewRem(p => ({ ...p, paymentType: e.target.value }))}>
                      <MenuItem value="hour">Por Hora</MenuItem>
                      <MenuItem value="day">Por Dia</MenuItem>
                      <MenuItem value="tour">Por Tour</MenuItem>
                      <MenuItem value="special">Especial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {isGuideSelected && (
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Atividade</InputLabel>
                    <Select value={newRem.activity} label="Atividade"
                      onChange={e => setNewRem(p => ({ ...p, activity: e.target.value }))}>
                      {activities.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {(newRem.paymentType === 'tour' || newRem.paymentType === 'hour' || isGuideSelected) && (
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label={isGuideSelected ? 'Valor por tour' : 'Valor/hora'}
                    name="hourlyValue1" value={newRem.hourlyValue1}
                    onChange={e => setNewRem(p => ({ ...p, hourlyValue1: e.target.value }))}
                    InputProps={{ inputComponent: MoneyInput }} inputProps={{ prefix: 'R$ ' }} />
                </Grid>
              )}
              {newRem.paymentType === 'day' && !isGuideSelected && (<>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="0h – 8h" name="hourlyValue1" value={newRem.hourlyValue1}
                    onChange={e => setNewRem(p => ({ ...p, hourlyValue1: e.target.value }))}
                    InputProps={{ inputComponent: MoneyInput }} inputProps={{ prefix: 'R$ ' }} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="8h1min – 10h" name="hourlyValue2" value={newRem.hourlyValue2}
                    onChange={e => setNewRem(p => ({ ...p, hourlyValue2: e.target.value }))}
                    InputProps={{ inputComponent: MoneyInput }} inputProps={{ prefix: 'R$ ' }} />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="10h1min – 12h" name="hourlyValue3" value={newRem.hourlyValue3}
                    onChange={e => setNewRem(p => ({ ...p, hourlyValue3: e.target.value }))}
                    InputProps={{ inputComponent: MoneyInput }} inputProps={{ prefix: 'R$ ' }} />
                </Grid>
              </>)}
              <Grid item xs={12} sm={2}>
                <Button variant="contained" type="submit" disabled={!canEdit} fullWidth>Salvar</Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* ── COLABORADORES ── */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Colaboradores</Typography>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo size="small" options={functions.map(f => f.name)} value={empFilter.function}
                onInputChange={(_, v) => setEmpFilter(p => ({ ...p, function: v || '' }))}
                renderInput={p => <TextField {...p} size="small" label="Filtrar função" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete freeSolo size="small" options={['Fixo', 'Extra', 'Evento']} value={empFilter.type}
                onInputChange={(_, v) => setEmpFilter(p => ({ ...p, type: v || '' }))}
                renderInput={p => <TextField {...p} size="small" label="Filtrar tipo" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Filtrar nome" value={empFilter.name}
                onChange={e => setEmpFilter(p => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {filteredEmps.length} resultado{filteredEmps.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TH>Nome</TH>
                  <TH>Função</TH>
                  <TH>Tipo</TH>
                  <TH>Telefone</TH>
                  <TH />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmps.map((e, i) => (
                  <TR key={e.id} index={i}>
                    <TableCell sx={{ fontWeight: 500 }}>{e.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{e.function}</TableCell>
                    <TableCell>
                      <Chip
                        label={e.type}
                        size="small"
                        color={TYPE_CHIP[e.type]?.color || 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{e.phone}</TableCell>
                    <TableCell align="right" sx={{ py: 0.25 }}>
                      <IconButton size="small" color="primary" onClick={() => setEditingEmp({ ...e })} disabled={!canEdit}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error"   onClick={() => deleteEmp(e.id)}         disabled={!canEdit}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TR>
                ))}
                {filteredEmps.length === 0 && (
                  <TableRow><TableCell colSpan={5} sx={{ color: 'text.disabled', textAlign: 'center', py: 2, fontSize: '0.8rem' }}>Nenhum colaborador encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Novo Colaborador</Typography>
          <Box component="form" onSubmit={createEmp}>
            <Grid container spacing={1.5} alignItems="flex-end">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Função</InputLabel>
                  <Select value={newEmp.function} label="Função"
                    onChange={e => setNewEmp(p => ({ ...p, function: e.target.value }))}>
                    {functions.filter(f => f.name !== 'Guia').map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={newEmp.type} label="Tipo"
                    onChange={e => setNewEmp(p => ({ ...p, type: e.target.value }))}>
                    <MenuItem value="Fixo">Fixo</MenuItem>
                    <MenuItem value="Extra">Extra</MenuItem>
                    <MenuItem value="Evento">Evento</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Nome" value={newEmp.name}
                  onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} required />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField fullWidth size="small" label="Telefone" value={newEmp.phone}
                  onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="contained" type="submit" disabled={!canEdit} fullWidth>Salvar</Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Edit function dialog */}
      <Dialog open={Boolean(editingFn)} onClose={() => setEditingFn(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Função</DialogTitle>
        <Box component="form" onSubmit={saveEditFn}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Nome" value={editingFn?.name || ''}
                  onChange={e => setEditingFn(p => ({ ...p, name: e.target.value }))} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Ordem" type="number" value={editingFn?.orderNumber || ''}
                  onChange={e => setEditingFn(p => ({ ...p, orderNumber: e.target.value }))} required />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingFn(null)}>Cancelar</Button>
            <Button variant="contained" type="submit">Salvar</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit employee dialog */}
      <Dialog open={Boolean(editingEmp)} onClose={() => setEditingEmp(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Colaborador</DialogTitle>
        <Box component="form" onSubmit={saveEditEmp}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Função</InputLabel>
                  <Select value={editingEmp?.function || ''} label="Função"
                    onChange={e => setEditingEmp(p => ({ ...p, function: e.target.value }))}>
                    {functions.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={editingEmp?.type || ''} label="Tipo"
                    onChange={e => setEditingEmp(p => ({ ...p, type: e.target.value }))}>
                    <MenuItem value="Fixo">Fixo</MenuItem>
                    <MenuItem value="Extra">Extra</MenuItem>
                    <MenuItem value="Evento">Evento</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Nome" value={editingEmp?.name || ''}
                  onChange={e => setEditingEmp(p => ({ ...p, name: e.target.value }))} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Telefone" value={editingEmp?.phone || ''}
                  onChange={e => setEditingEmp(p => ({ ...p, phone: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingEmp(null)}>Cancelar</Button>
            <Button variant="contained" type="submit">Salvar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
