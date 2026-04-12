import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Swal from 'sweetalert2';
import { API_URL } from '../../utils/env';

export default function DayOrderSettings() {
  const [functions, setFunctions] = useState([]);
  const [empOptions, setEmpOptions] = useState([]);
  const [remunerations, setRemunerations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newFn, setNewFn] = useState({ name: '', orderNumber: '' });
  const [newEmp, setNewEmp] = useState({ name: '', function: '', type: '', phone: '' });
  const [newRem, setNewRem] = useState({ functionId: '', paymentType: 'day', activity: '', hourlyValue1: '', hourlyValue2: '', hourlyValue3: '' });

  function load() {
    fetch(`${API_URL}/day-order/list-functions`).then(r => r.json()).then(setFunctions);
    fetch(`${API_URL}/day-order/list-employees-options`).then(r => r.json()).then(setEmpOptions);
    fetch(`${API_URL}/day-order/list-remunerations`).then(r => r.json()).then(setRemunerations);
    fetch(`${API_URL}/day-order/list-activities`, { method: 'POST' }).then(r => r.json()).then(d => setActivities(Array.isArray(d) ? d.map(x => x.name) : []));
  }

  useEffect(() => { load(); }, []);

  async function createFn() {
    await fetch(`${API_URL}/day-order/create-function`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFn),
    });
    setNewFn({ name: '', orderNumber: '' });
    load();
  }

  async function deleteFn(id) {
    const confirm = await Swal.fire({ title: 'Excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/day-order/delete-function?id=${id}`);
    load();
  }

  async function createEmp() {
    const res = await fetch(`${API_URL}/day-order/create-employee-option`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    setNewEmp({ name: '', function: '', type: '', phone: '' });
    load();
  }

  async function deleteEmp(id) {
    const confirm = await Swal.fire({ title: 'Excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_URL}/day-order/delete-employee?id=${id}`);
    load();
  }

  async function createRem() {
    const res = await fetch(`${API_URL}/day-order/create-remuneration`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRem),
    });
    const data = await res.json();
    if (data.error) { Swal.fire('Erro', data.message || 'Erro', 'error'); return; }
    setNewRem({ functionId: '', paymentType: 'day', activity: '', hourlyValue1: '', hourlyValue2: '', hourlyValue3: '' });
    load();
  }

  async function deleteRem(id) {
    await fetch(`${API_URL}/day-order/delete-remuneration?id=${id}`);
    load();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Opções - Ordem do Dia</Typography>

      {/* Functions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Funções</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Nome" value={newFn.name} onChange={e => setNewFn(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Ordem" type="number" value={newFn.orderNumber} onChange={e => setNewFn(p => ({ ...p, orderNumber: e.target.value }))} /></Grid>
            <Grid item xs={2}><Button variant="contained" onClick={createFn} size="small">Criar</Button></Grid>
          </Grid>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Ordem</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {functions.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.name}</TableCell>
                  <TableCell>{f.orderNumber}</TableCell>
                  <TableCell><IconButton size="small" color="error" onClick={() => deleteFn(f.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </CardContent>
      </Card>

      {/* Employee options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Funcionários</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}><TextField fullWidth size="small" label="Nome" value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={3}>
              <FormControl fullWidth size="small"><InputLabel>Função</InputLabel>
                <Select value={newEmp.function} label="Função" onChange={e => setNewEmp(p => ({ ...p, function: e.target.value }))}>
                  {functions.map(f => <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}><TextField fullWidth size="small" label="Tipo" value={newEmp.type} onChange={e => setNewEmp(p => ({ ...p, type: e.target.value }))} /></Grid>
            <Grid item xs={2}><TextField fullWidth size="small" label="Telefone" value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} /></Grid>
            <Grid item xs={2}><Button variant="contained" onClick={createEmp} size="small">Criar</Button></Grid>
          </Grid>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Função</TableCell><TableCell>Tipo</TableCell><TableCell>Telefone</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {empOptions.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{e.name}</TableCell><TableCell>{e.function}</TableCell>
                  <TableCell>{e.type}</TableCell><TableCell>{e.phone}</TableCell>
                  <TableCell><IconButton size="small" color="error" onClick={() => deleteEmp(e.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </CardContent>
      </Card>

      {/* Remunerations */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Remunerações</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Função</InputLabel>
                <Select value={newRem.functionId} label="Função" onChange={e => setNewRem(p => ({ ...p, functionId: e.target.value }))}>
                  {functions.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Tipo</InputLabel>
                <Select value={newRem.paymentType} label="Tipo" onChange={e => setNewRem(p => ({ ...p, paymentType: e.target.value }))}>
                  <MenuItem value="day">Por Dia</MenuItem>
                  <MenuItem value="hour">Por Hora</MenuItem>
                  <MenuItem value="special">Especial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small"><InputLabel>Atividade</InputLabel>
                <Select value={newRem.activity} label="Atividade" onChange={e => setNewRem(p => ({ ...p, activity: e.target.value }))}>
                  {activities.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={1}><TextField fullWidth size="small" label="Val.1" type="number" value={newRem.hourlyValue1} onChange={e => setNewRem(p => ({ ...p, hourlyValue1: e.target.value }))} /></Grid>
            <Grid item xs={1}><TextField fullWidth size="small" label="Val.2" type="number" value={newRem.hourlyValue2} onChange={e => setNewRem(p => ({ ...p, hourlyValue2: e.target.value }))} /></Grid>
            <Grid item xs={1}><TextField fullWidth size="small" label="Val.3" type="number" value={newRem.hourlyValue3} onChange={e => setNewRem(p => ({ ...p, hourlyValue3: e.target.value }))} /></Grid>
            <Grid item xs={2}><Button variant="contained" onClick={createRem} size="small">Criar</Button></Grid>
          </Grid>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow><TableCell>Função ID</TableCell><TableCell>Tipo</TableCell><TableCell>Atividade</TableCell><TableCell>Val.1</TableCell><TableCell>Val.2</TableCell><TableCell>Val.3</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {remunerations.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.functionId}</TableCell><TableCell>{r.paymentType}</TableCell>
                  <TableCell>{r.activity}</TableCell><TableCell>{r.hourlyValue1}</TableCell>
                  <TableCell>{r.hourlyValue2}</TableCell><TableCell>{r.hourlyValue3}</TableCell>
                  <TableCell><IconButton size="small" color="error" onClick={() => deleteRem(r.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
