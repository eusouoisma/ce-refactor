import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Autocomplete, Chip, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';
import { useStore } from '../../components/Store';

export default function DayOrderEdit() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { userName } = useStore();
  const [info, setInfo] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tours, setTours] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [empOptions, setEmpOptions] = useState([]);
  const [newEmp, setNewEmp] = useState({ function: '', name: '', phone: '' });
  const [comments, setComments] = useState('');

  function load() {
    fetch(`${API_URL}/day-order/list-by-id?day_order_id=${id}`)
      .then(r => r.json()).then(d => {
        if (!d.error) {
          setInfo(d.infos);
          setEmployees(d.employees || []);
          setComments(d.infos?.comments || '');
        }
      });
    fetch(`${API_URL}/day-order/list-tours-by-dayorder-id?id=${id}`)
      .then(r => r.json()).then(d => setTours(d.data || []));
    fetch(`${API_URL}/day-order/list-functions`).then(r => r.json()).then(setFunctions);
    fetch(`${API_URL}/day-order/list-employees-options`).then(r => r.json()).then(setEmpOptions);
  }

  useEffect(() => { load(); }, [id]);

  function updateEmp(i, field, val) {
    setEmployees(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  async function addEmployee() {
    if (!newEmp.function || !newEmp.name) return;
    await fetch(`${API_URL}/day-order/create-employee`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOrderId: id, editedBy: userName, employee: newEmp }),
    });
    setNewEmp({ function: '', name: '', phone: '' });
    load();
  }

  async function save() {
    await fetch(`${API_URL}/day-order/update-employees`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOrderId: id, comments, lastEditBy: userName, employees }),
    });
    Swal.fire('Salvo!', '', 'success');
  }

  async function calculatePayments() {
    await save();
    const res = await fetch(`${API_URL}/day-order/calculate-payments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOrderId: id }),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message, 'error'); }
    else { Swal.fire('Pagamentos calculados!', '', 'success'); }
  }

  async function splitTour(tour) {
    await fetch(`${API_URL}/day-order/split-tours-to-another-day-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: tour.activity, hour: tour.tourHour, date: tour.tourDate, language: tour.language, dayOrderId: id, editedBy: userName }),
    });
    load();
  }

  async function returnToOriginal(tour) {
    await fetch(`${API_URL}/day-order/return-tour-to-original-day-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: tour.activity, hour: tour.tourHour, date: tour.tourDate, language: tour.language, dayOrderId: id }),
    });
    load();
  }

  if (!info) return <Box sx={{ p: 3 }}>Carregando...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={() => navigate(`/editar-ordem-do-dia?id=${info.prev}`)} disabled={!info.prev}><NavigateBeforeIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Ordem do Dia - {info.formatedDate}</Typography>
        <IconButton onClick={() => navigate(`/editar-ordem-do-dia?id=${info.next}`)} disabled={!info.next}><NavigateNextIcon /></IconButton>
      </Box>

      {/* Tours do dia */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Tours do Dia</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell><TableCell>Atividade</TableCell><TableCell>Duração</TableCell>
                  <TableCell>Idioma</TableCell><TableCell>Guias</TableCell><TableCell>Pax</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{t.tourHour}</TableCell>
                    <TableCell>{t.activity}</TableCell>
                    <TableCell>{t.duration}</TableCell>
                    <TableCell>{t.language}</TableCell>
                    <TableCell>{t.guides}</TableCell>
                    <TableCell>{t.paxTotal}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => splitTour(t)}>Separar</Button>
                      <Button size="small" color="warning" onClick={() => returnToOriginal(t)}>Retornar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Funcionários */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Funcionários</Typography>
          <TextField fullWidth size="small" label="Comentários da Ordem do Dia" value={comments}
            onChange={e => setComments(e.target.value)} multiline rows={2} sx={{ mb: 2 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Função</TableCell><TableCell>Nome</TableCell><TableCell>Previsão</TableCell>
                  <TableCell>Chegada</TableCell><TableCell>Saída</TableCell><TableCell>Telefone</TableCell>
                  <TableCell>Obs</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp, i) => (
                  <TableRow key={emp.id || i}>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select value={emp.function||''} onChange={e => updateEmp(i, 'function', e.target.value)}>
                          {functions.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Autocomplete freeSolo size="small" sx={{ width: 150 }}
                        options={empOptions.filter(o => o.function === emp.function).map(o => o.name)}
                        value={emp.name||''}
                        onInputChange={(_, v) => updateEmp(i, 'name', v)}
                        renderInput={p => <TextField {...p} size="small" />} />
                    </TableCell>
                    <TableCell><TextField size="small" type="time" value={emp.prevision||''} onChange={e => updateEmp(i, 'prevision', e.target.value)} sx={{ width: 100 }} /></TableCell>
                    <TableCell><TextField size="small" type="time" value={emp.arrival||''} onChange={e => updateEmp(i, 'arrival', e.target.value)} sx={{ width: 100 }} /></TableCell>
                    <TableCell><TextField size="small" type="time" value={emp.departure||''} onChange={e => updateEmp(i, 'departure', e.target.value)} sx={{ width: 100 }} /></TableCell>
                    <TableCell><TextField size="small" value={emp.phone||''} onChange={e => updateEmp(i, 'phone', e.target.value)} sx={{ width: 120 }} /></TableCell>
                    <TableCell><TextField size="small" value={emp.comments||''} onChange={e => updateEmp(i, 'comments', e.target.value)} sx={{ width: 150 }} /></TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => updateEmp(i, 'deleted', 1)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Adicionar Funcionário</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Função</InputLabel>
                <Select value={newEmp.function} label="Função" onChange={e => setNewEmp(p => ({ ...p, function: e.target.value }))}>
                  {functions.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete freeSolo size="small"
                options={empOptions.filter(o => o.function === newEmp.function).map(o => o.name)}
                value={newEmp.name}
                onInputChange={(_, v) => setNewEmp(p => ({ ...p, name: v }))}
                renderInput={p => <TextField {...p} size="small" label="Nome" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Telefone" value={newEmp.phone}
                onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" onClick={addEmployee}>Adicionar</Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={save}>Salvar</Button>
            <Button variant="outlined" color="secondary" onClick={calculatePayments}>Calcular Pagamentos</Button>
            <Button variant="text" onClick={() => navigate('/ordem-do-dia')}>Voltar</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
