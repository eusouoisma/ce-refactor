import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import Swal from 'sweetalert2';
import {
  Box, Typography, Button, IconButton, TextField, Autocomplete, Tooltip,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { apiFetch } from '../../utils/api';
import { useStore } from '../../components/Store';

const WEEK_DAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

// Compact but readable table styles for the interactive view
const TABLE_COMPACT_SX = {
  overflowX: 'auto',
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    whiteSpace: 'nowrap',
    borderSpacing: 0,
  },
  '& thead th': {
    background: '#e6e6e6',
    border: '1px solid #ccc',
    padding: '5px 8px',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  '& tbody td': {
    border: '1px solid #ccc',
    padding: '2px 4px',
    textAlign: 'left',
    fontSize: 11,
  },
  '& thead th': {
    fontSize: 11,
  },
  '& .MuiInputBase-root': {
    fontSize: '11px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '2px',
  },
  '& .MuiAutocomplete-inputRoot': {
    flexWrap: 'nowrap',
    padding: '0 24px 0 4px !important',
  },
  '& .MuiFormControl-root': {
    width: '100%',
    minWidth: 0,
  },
};

// Print-only inline styles (no MUI/emotion — must be pure inline for react-to-print iframe)
const PS = {
  page: { fontFamily: 'Arial, sans-serif', fontSize: '11px', padding: '12px', background: '#fff', color: '#000' },
  h1: { textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0' },
  sub: { textAlign: 'center', fontSize: '10px', margin: '0 0 10px 0' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' },
  th: { border: '1px solid #999', padding: '3px 5px', background: '#e6e6e6', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' },
  td: { border: '1px solid #999', padding: '2px 5px', textAlign: 'center', whiteSpace: 'nowrap' },
  tdRed: { border: '1px solid #999', padding: '2px 5px', textAlign: 'center', whiteSpace: 'nowrap', color: 'red' },
  sectionTitle: { fontWeight: 'bold', fontSize: '12px', margin: '8px 0 4px 0' },
};

export default function DayOrderEdit() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { userName, userPermissions } = useStore();

  const [dayOrder, setDayOrder] = useState(null);
  const [tours, setTours] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [empOptions, setEmpOptions] = useState([]);
  const [comments, setComments] = useState('');
  const [invalidEmployees, setInvalidEmployees] = useState([]);
  const [invalidTours, setInvalidTours] = useState([]);

  const printRef = useRef();
  const downloadRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `@page { size: A4; margin: 1cm; } body { margin: 0; }`,
  });

  function load() {
    apiFetch(`/day-order/list-by-id?day_order_id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setDayOrder(d.infos);
          const emps = (d.employees || []).map(e => ({
            ...e,
            deleted: e.deleted === '1' || e.deleted === true,
            namesOptions: [],
          }));
          setEmployees(emps);
          setComments(d.infos?.comments || '');
        }
      });
    apiFetch(`/day-order/list-tours-by-dayorder-id?id=${id}`)
      .then(r => r.json())
      .then(d => setTours(d.data || []));
    apiFetch('/day-order/list-functions')
      .then(r => r.json())
      .then(setFunctions);
    apiFetch('/day-order/list-employees-options')
      .then(r => r.json())
      .then(d => setEmpOptions(Array.isArray(d) ? d : []));
  }

  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!functions.length || !empOptions.length) return;
    setEmployees(prev => prev.map(emp => ({
      ...emp,
      namesOptions: empOptions.filter(o => o.function === emp.function),
    })));
  }, [functions.length, empOptions.length]);

  const isBlocked = useMemo(() => {
    if (!dayOrder) return false;
    const perms = parseInt(userPermissions);
    if (perms === 5) return true;
    if (perms === 4 || perms === 2) return false;
    return (new Date() - new Date(dayOrder.date)) > 39 * 3600000;
  }, [dayOrder, userPermissions]);

  const canFinalize = useMemo(() => [2, 4].includes(parseInt(userPermissions)), [userPermissions]);

  const getToursByGuide = useCallback((guideName) => {
    if (!guideName) return '';
    const nums = [];
    tours.forEach((t, i) => {
      if (t.guides) {
        const gl = t.guides.split(',').map(g => g.trim());
        if (gl.includes(guideName)) nums.push(i + 1);
      }
    });
    return nums.join(',');
  }, [tours]);

  const getFunctionIndex = useCallback((fn, empId) => {
    if (!fn) return '';
    const sameFunc = employees.filter(e => e.function === fn && !e.deleted);
    const idx = sameFunc.indexOf(employees.find(e => e.id === empId));
    return idx !== -1 ? ` - ${idx + 1}` : '';
  }, [employees]);

  function updateEmp(empId, field, value) {
    setEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const u = { ...e, [field]: value };
      if (field === 'function') u.namesOptions = empOptions.filter(o => o.function === value);
      if (field === 'name') {
        const opt = (e.namesOptions || []).find(o => o.name === value);
        if (opt) { u.phone = opt.phone; u.type = opt.type; }
      }
      return u;
    }));
    setInvalidEmployees(p => p.filter(eid => eid !== empId));
  }

  async function addEmployee() {
    const empty = { function: '', name: '', prevision: '', arrival: '', departure: '', phone: '', comments: '', namesOptions: [], deleted: false };
    const res = await apiFetch('/day-order/create-employee', {
      method: 'POST',
      body: JSON.stringify({ dayOrderId: id, editedBy: userName, employee: empty }),
    });
    const data = await res.json();
    if (!data.error) setEmployees(prev => [...prev, { ...empty, id: data.data }]);
    else Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' });
  }

  async function save() {
    const body = employees.map(e => {
      const allEmpty = !e.function && !e.name && !e.prevision && !e.arrival && !e.departure && !e.phone && !e.comments;
      return { ...e, deleted: e.deleted || allEmpty };
    });
    const res = await apiFetch('/day-order/update-employees', {
      method: 'POST',
      body: JSON.stringify({ dayOrderId: id, comments, lastEditBy: userName, employees: body }),
    });
    const data = await res.json();
    if (!data.error) Swal.fire({ title: 'Sucesso', html: 'Ordem do dia atualizada', icon: 'success' }).then(() => load());
    else Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' });
  }

  function validateForPayment() {
    const newInvalidEmps = [];
    const newInvalidTours = [];
    employees.filter(e => !e.deleted).forEach(emp => {
      if (emp.function === 'Guia') {
        if (!getToursByGuide(emp.name)) newInvalidEmps.push(emp.id);
      } else if (emp.type !== 'Fixo' && !emp.comments && (!emp.arrival || !emp.departure)) {
        newInvalidEmps.push(emp.id);
      }
    });
    tours.forEach((t, i) => {
      if (t.status !== 'No Show' && t.type !== 'show/evento' && !t.guides) newInvalidTours.push(i);
    });
    setInvalidEmployees(newInvalidEmps);
    setInvalidTours(newInvalidTours);
    if (newInvalidEmps.length) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Há colaboradores com dados incompletos nessa ordem do dia' }); return false; }
    if (newInvalidTours.length) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Todos os tours precisam ter guias associados' }); return false; }
    return true;
  }

  async function finalize() {
    if (!validateForPayment()) return;
    const body = employees.map(e => {
      const allEmpty = !e.function && !e.name && !e.prevision && !e.arrival && !e.departure && !e.phone && !e.comments;
      return { ...e, deleted: e.deleted || allEmpty };
    });
    await apiFetch('/day-order/update-employees', {
      method: 'POST',
      body: JSON.stringify({ dayOrderId: id, comments, lastEditBy: userName, employees: body }),
    });
    const res = await apiFetch('/day-order/calculate-payments', {
      method: 'POST',
      body: JSON.stringify({ dayOrderId: id, lastEditBy: userName }),
    });
    const data = await res.json();
    if (!data.error) Swal.fire({ title: 'Sucesso', html: 'Ordem do dia finalizada e pagamentos inseridos', icon: 'success' }).then(() => load());
    else Swal.fire({ icon: 'error', title: 'Algo deu errado!', text: data.message });
  }

  function openSplitReturn(tour) {
    if (isBlocked) return;
    const isPrincipal = dayOrder?.name === 'Tour Principal';
    Swal.fire({
      title: 'O que você deseja fazer?',
      showCancelButton: true,
      confirmButtonText: isPrincipal ? 'Separar tour' : 'Retornar para o tour principal',
      cancelButtonText: 'Cancelar',
    }).then(r => {
      if (!r.isConfirmed) return;
      if (isPrincipal) {
        Swal.fire({
          title: `Separar o tour ${tour.activity} às ${tour.tourHour} no idioma ${tour.language}?`,
          showDenyButton: true, confirmButtonText: 'Sim', denyButtonText: 'Não',
        }).then(r2 => {
          if (!r2.isConfirmed) return;
          apiFetch('/day-order/split-tours-to-another-day-order', {
            method: 'POST',
            body: JSON.stringify({ activity: tour.activity, hour: tour.tourHour, date: tour.tourDate, language: tour.language, dayOrderId: id, editedBy: userName }),
          }).then(r => r.json()).then(d => {
            if (d.error) Swal.fire({ icon: 'error', title: 'Oops...', text: 'Algo deu errado!' });
            else Swal.fire('Tour separado com sucesso!!', '', 'success').then(() => load());
          });
        });
      } else {
        Swal.fire({
          title: `Retornar o tour ${tour.activity} às ${tour.tourHour} para a ordem principal?`,
          showDenyButton: true, confirmButtonText: 'Sim', denyButtonText: 'Não',
        }).then(r2 => {
          if (!r2.isConfirmed) return;
          apiFetch('/day-order/return-tour-to-original-day-order', {
            method: 'POST',
            body: JSON.stringify({ activity: tour.activity, hour: tour.tourHour, date: tour.tourDate, language: tour.language, dayOrderId: id }),
          }).then(r => r.json()).then(d => {
            if (d.error) Swal.fire({ icon: 'error', title: 'Oops...', text: d.message });
            else Swal.fire('Tour retornado com sucesso!!', '', 'success').then(() => navigate(`/editar-ordem-do-dia?id=${d.original}`));
          });
        });
      }
    });
  }

  const phoneLabel = dayOrder?.name === 'Tour Principal' ? 'Telefone' : 'Documento';
  const activeEmployees = employees.filter(e => !e.deleted);

  if (!dayOrder) return <Box sx={{ p: 3 }}>Carregando...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <IconButton size="small" onClick={() => navigate(`/editar-ordem-do-dia?id=${dayOrder.prev}`)} disabled={!dayOrder.prev}>
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {dayOrder.name} — {dayOrder.formatedDate} {WEEK_DAYS[dayOrder.weekDay]}
        </Typography>
        <IconButton size="small" onClick={() => navigate(`/editar-ordem-do-dia?id=${dayOrder.next}`)} disabled={!dayOrder.next}>
          <NavigateNextIcon />
        </IconButton>
      </Box>
      {isBlocked && (
        <Box sx={{ bgcolor: 'rgba(162,40,40,0.25)', border: '1px solid rgba(162,40,40,0.4)', borderRadius: 1, p: 1.5, mb: 2, textAlign: 'center' }}>
          <Typography color="error" fontWeight={600}>Edição permitida apenas para o financeiro</Typography>
        </Box>
      )}
      <Box sx={TABLE_COMPACT_SX}>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Duração</th><th>Início</th><th>Atividade</th>
              <th>Grupo</th><th>Pax</th><th>Idioma</th><th>Guia</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t, i) => (
              <tr
                key={i}
                title="Clique para separar/retornar tour"
                onClick={() => openSplitReturn(t)}
                style={{
                  background: invalidTours.includes(i) ? '#ffcccc' : i % 2 === 0 ? '#fff' : '#f0f0f0',
                  cursor: isBlocked ? 'default' : 'pointer',
                }}
              >
                <td>{i + 1}</td>
                <td>{t.duration}</td>
                <td>{t.tourHour}</td>
                <td>{t.activity}</td>
                <td>{t.numberOfGroups || 1}</td>
                <td>{t.paxTotal}</td>
                <td>{t.language}</td>
                <td>{t.guides || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* ── EMPLOYEES TABLE (interactive) ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>Funcionários</Typography>
        {!isBlocked && (
          <Tooltip title="Adicionar funcionário">
            <IconButton size="small" color="primary" onClick={addEmployee}><AddCircleIcon /></IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={TABLE_COMPACT_SX}>
        <table>
          <thead>
            <tr>
              <th>Função</th><th>Nome</th><th>Tours</th><th>Previsão</th>
              <th>Chegada</th><th>Saída</th><th>{phoneLabel}</th><th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map(emp => {
              const isBloqueio = emp.comments?.toLowerCase() === 'bloqueio';
              const isDayOff = !isBloqueio && !!emp.comments;
              const isInvalid = invalidEmployees.includes(emp.id);
              const isGuia = emp.function === 'Guia';
              // Regras de cor idênticas ao sistema antigo:
              // invalid → fundo #c24f4f; bloqueio → tudo vermelho; dayoff → só última coluna vermelha
              const rowStyle = isInvalid ? { background: '#c24f4f' } : {};
              const cellColor = isBloqueio ? 'red' : undefined;
              const inputColor = isBloqueio ? 'red' : undefined;
              const lastCellColor = (isBloqueio || isDayOff) ? 'red' : undefined;

              return (
                <tr key={emp.id} style={rowStyle}>
                  {/* Função */}
                  <td style={{ color: cellColor }}>
                    {isGuia ? (
                      <TextField variant="outlined" size="small"
                        value={`${emp.function}${getFunctionIndex(emp.function, emp.id)}`}
                        sx={{ minWidth: 160 }}
                        inputProps={{ readOnly: true, style: { fontSize: 11, color: inputColor } }}
                      />
                    ) : (
                      <Autocomplete freeSolo size="small"
                        options={functions.filter(f => f.name !== 'Guia').map(f => f.name)}
                        value={(emp.function || '') + getFunctionIndex(emp.function, emp.id)}
                        onChange={(_, v) => updateEmp(emp.id, 'function', v || '')}
                        disabled={isBlocked}
                        sx={{ minWidth: 160 }}
                        renderInput={p => (
                          <TextField {...p} variant="outlined" size="small" placeholder="Função"
                            inputProps={{ ...p.inputProps, style: { fontSize: 11, color: inputColor } }}
                          />
                        )}
                      />
                    )}
                  </td>
                  {/* Nome */}
                  <td style={{ color: cellColor }}>
                    {isGuia ? (
                      <TextField variant="outlined" size="small"
                        value={emp.name || ''}
                        sx={{ minWidth: 130 }}
                        inputProps={{ readOnly: true, style: { fontSize: 11, color: inputColor } }}
                      />
                    ) : (
                      <Autocomplete freeSolo size="small"
                        options={(emp.namesOptions || []).map(o => o.name)}
                        value={emp.name || ''}
                        onChange={(_, v) => updateEmp(emp.id, 'name', v || '')}
                        disabled={isBlocked}
                        sx={{ minWidth: 130 }}
                        renderInput={p => (
                          <TextField {...p} variant="outlined" size="small" placeholder="Nome"
                            inputProps={{ ...p.inputProps, style: { fontSize: 11, color: inputColor } }}
                          />
                        )}
                      />
                    )}
                  </td>
                  <td style={{ color: cellColor }}>
                    <TextField variant="outlined" size="small"
                      value={getToursByGuide(emp.name)}
                      sx={{ width: 46 }}
                      inputProps={{ readOnly: true, style: { textAlign: 'center', fontSize: 11, padding: '3px 4px', color: inputColor } }}
                    />
                  </td>
                  <td style={{ color: cellColor }}>
                    <TextField variant="outlined" size="small" type="time"
                      value={emp.prevision || ''}
                      onChange={e => updateEmp(emp.id, 'prevision', e.target.value)}
                      disabled={isBlocked}
                      sx={{ width: 90 }}
                      inputProps={{ style: { fontSize: 11, padding: '3px 4px', color: inputColor } }}
                    />
                  </td>
                  <td style={{ color: cellColor }}>
                    <TextField variant="outlined" size="small" type="time"
                      value={emp.arrival || ''}
                      onChange={e => updateEmp(emp.id, 'arrival', e.target.value)}
                      disabled={isBlocked}
                      sx={{ width: 90 }}
                      inputProps={{ style: { fontSize: 11, padding: '3px 4px', color: inputColor } }}
                    />
                  </td>
                  <td style={{ color: cellColor }}>
                    <TextField variant="outlined" size="small" type="time"
                      value={emp.departure || ''}
                      onChange={e => updateEmp(emp.id, 'departure', e.target.value)}
                      disabled={isBlocked}
                      sx={{ width: 90 }}
                      inputProps={{ style: { fontSize: 11, padding: '3px 4px', color: inputColor } }}
                    />
                  </td>
                  <td style={{ color: cellColor }}>
                    <TextField variant="outlined" size="small"
                      value={emp.phone || ''}
                      onChange={e => updateEmp(emp.id, 'phone', e.target.value)}
                      disabled={isBlocked}
                      inputProps={{ style: { fontSize: 11, color: inputColor } }}
                    />
                  </td>
                  <td style={{ color: lastCellColor }}>
                    <TextField variant="outlined" size="small"
                      value={emp.comments || ''}
                      onChange={e => updateEmp(emp.id, 'comments', e.target.value)}
                      disabled={isBlocked}
                      inputProps={{ style: { fontSize: 11, color: lastCellColor } }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>

      <TextField fullWidth multiline minRows={3} label="Observações da Ordem do Dia"
        value={comments} onChange={e => setComments(e.target.value)}
        disabled={isBlocked} sx={{ mt: 2, mb: 2 }}
      />

      {/* ── ACTION BUTTONS ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
        {!isBlocked && <Button variant="contained" onClick={save}>Salvar</Button>}
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
        <DownloadTableExcel filename={`Ordem-do-dia-${dayOrder.formatedDate}`} sheet="ordem-do-dia" currentTableRef={downloadRef.current}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />}>Exportar Excel</Button>
        </DownloadTableExcel>
        {!isBlocked && canFinalize && (
          <Button variant="outlined" color="success" onClick={finalize}>Finalizar e gerar pagamentos</Button>
        )}
      </Box>

      {/*
        ── PRINT CONTENT (off-screen) ──
        The outer div hides content visually. The ref is on the INNER div so react-to-print
        clones it without the left:-9999px offset (which would make the print page blank).
        Only plain HTML + inline styles inside — emotion/MUI classes don't survive the iframe copy.
      */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, overflow: 'hidden' }}>
      <div
        ref={printRef}
        style={{ width: '900px', ...PS.page }}
      >
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={PS.h1}>
            Ordem do Dia — {dayOrder.formatedDate} {WEEK_DAYS[dayOrder.weekDay]}
          </div>
          <div style={PS.sub}>
            {dayOrder.name} &nbsp;|&nbsp; carnavalexperience.com.br &nbsp;|&nbsp; Reservas: (21) 967659549
          </div>
        </div>

        <div style={PS.sectionTitle}>Tours do Dia</div>
        <table style={PS.table}>
          <thead>
            <tr>
              <th style={PS.th}>#</th>
              <th style={PS.th}>Duração</th>
              <th style={PS.th}>Início</th>
              <th style={PS.th}>Atividade</th>
              <th style={PS.th}>Grupo</th>
              <th style={PS.th}>Pax</th>
              <th style={PS.th}>Idioma</th>
              <th style={PS.th}>Guia</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                <td style={PS.td}>{i + 1}</td>
                <td style={PS.td}>{t.duration}</td>
                <td style={PS.td}>{t.tourHour}</td>
                <td style={PS.td}>{t.activity}</td>
                <td style={PS.td}>{t.numberOfGroups || 1}</td>
                <td style={PS.td}>{t.paxTotal}</td>
                <td style={PS.td}>{t.language}</td>
                <td style={PS.td}>{t.guides}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={PS.sectionTitle}>Funcionários</div>
        <table style={PS.table}>
          <thead>
            <tr>
              <th style={PS.th}>Função</th>
              <th style={PS.th}>Nome</th>
              <th style={PS.th}>Tours</th>
              <th style={PS.th}>Previsão</th>
              <th style={PS.th}>Chegada</th>
              <th style={PS.th}>Saída</th>
              <th style={PS.th}>{phoneLabel}</th>
              <th style={PS.th}>Observações</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp, i) => {
              const isBloqueio = emp.comments?.toLowerCase() === 'bloqueio';
              const isDayOff = !isBloqueio && !!emp.comments;
              const isInvalid = invalidEmployees.includes(emp.id);
              const rowBg = isInvalid ? '#c24f4f' : undefined;
              const cellSt = isBloqueio ? PS.tdRed : PS.td;
              const lastCellSt = (isBloqueio || isDayOff) ? PS.tdRed : PS.td;
              return (
                <tr key={emp.id} style={{ background: rowBg }}>
                  <td style={cellSt}>{emp.function}{getFunctionIndex(emp.function, emp.id)}</td>
                  <td style={cellSt}>{emp.name}</td>
                  <td style={cellSt}>{getToursByGuide(emp.name)}</td>
                  <td style={cellSt}>{emp.prevision}</td>
                  <td style={cellSt}>{emp.arrival}</td>
                  <td style={cellSt}>{emp.departure}</td>
                  <td style={cellSt}>{emp.phone}</td>
                  <td style={lastCellSt}>{emp.comments}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {comments && (
          <div style={{ marginTop: '8px', fontSize: '11px' }}>
            <strong>Observações:</strong> {comments}
          </div>
        )}
      </div>
      </div>

      {/* ── EXCEL DOWNLOAD TABLE (hidden) ── */}
      <Box ref={downloadRef} sx={{ display: 'none' }}>
        <table>
          <tbody>
            <tr><td>carnavalexperience.com.br — Reservas: (21) 967659549</td></tr>
            <tr><td>Ordem do Dia {dayOrder.formatedDate} - {WEEK_DAYS[dayOrder.weekDay]}</td></tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr><th>#</th><th>Duração</th><th>Início</th><th>Atividade</th><th>Grupo</th><th>Pax</th><th>Idioma</th><th>Guia</th></tr>
          </thead>
          <tbody>
            {tours.map((t, i) => (
              <tr key={i}><td>{i+1}</td><td>{t.duration}</td><td>{t.tourHour}</td><td>{t.activity}</td><td>{t.numberOfGroups||1}</td><td>{t.paxTotal}</td><td>{t.language}</td><td>{t.guides}</td></tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr><th>Função</th><th>Nome</th><th>Tours</th><th>Previsão</th><th>Chegada</th><th>Saída</th><th>{phoneLabel}</th><th>Observações</th></tr>
          </thead>
          <tbody>
            {activeEmployees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.function}</td><td>{emp.name}</td><td>{getToursByGuide(emp.name)}</td>
                <td>{emp.prevision}</td><td>{emp.arrival}</td><td>{emp.departure}</td>
                <td>{emp.phone}</td><td>{emp.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table><tbody><tr><td>Observações: {comments}</td></tr></tbody></table>
      </Box>

    </Box>
  );
}
