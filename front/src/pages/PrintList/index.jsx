import React, { useContext, useState, useEffect, useRef } from 'react';
import { Container, Title, InputContainer, StyledInput, StyledSelect } from './printlist';
import Sidebar from '../../components/Sidebar';
import { Content } from '../../utils/stylesbase';
import StoreContext from '../../components/Store/Context';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../../utils/env';
import { DownloadTableExcel } from "react-export-table-to-excel";

const LINHAS_EXTRAS = 5;

const PrintList = () => {
    const { sidebarClosed } = useContext(StoreContext);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableHours, setAvailableHours] = useState([]);
    const [selectedHour, setSelectedHour] = useState('');
    const [tableData, setTableData] = useState([]);
    const [verdeInicio, setVerdeInicio] = useState('');
    const [verdeFim, setVerdeFim] = useState('');
    const [azulInicio, setAzulInicio] = useState('');
    const [azulFim, setAzulFim] = useState('');
    const [cobrador, setCobrador] = useState('');
    const printRef = useRef();
    const headerRef = useRef();
    const tableRef = useRef();

    useEffect(() => {
        const fetchAvailableHours = async () => {
            if (selectedDate) {
                try {
                    const response = await fetch(`${API_URL}tours/available-hours.php?date=${selectedDate}&type=regular&status=Confirmado`);
                    const data = await response.json();
                    setAvailableHours(data);
                } catch (error) {
                    console.error('Erro ao buscar horários:', error);
                }
            }
        };
        fetchAvailableHours();
    }, [selectedDate]);

    useEffect(() => {
        const fetchTableData = async () => {
            if (selectedDate && selectedHour) {
                try {
                    const response = await fetch(`${API_URL}tours/regular-list.php?date=${selectedDate}&hour=${selectedHour}`);
                    const data = await response.json();
                    setTableData(Array.isArray(data) ? data : []);
                } catch (error) {
                    setTableData([]);
                }
            } else {
                setTableData([]);
            }
        };
        fetchTableData();
    }, [selectedDate, selectedHour]);

    // Linhas extras em branco
    const linhasExtras = Array.from({ length: LINHAS_EXTRAS }, (_, i) => ({
        n: tableData.length + i + 1,
        guideAgency: '',
        adulto: '',
        net: '',
        brasileiro: '',
        meia: '',
        free: '',
        total: '',
        nomePax: '',
        guia: '',
        paymentMethod: '',
        valorTotal: '',
        comissao: '',
        statusPgto: '',
        obs: '',
    }));

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'TOUR REGULAR - CARNAVAL EXPERIENCE',
        removeAfterPrint: true,
        pageStyle: `
            @page { 
                size: landscape;
                margin: 18mm 10mm; 
            }
            @media print {
                body { background: white !important; }
                .print-area {
                    padding: 0 !important;
                    box-sizing: border-box;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 auto !important;
                }
                table { width: 100% !important; max-width: 100% !important; box-sizing: border-box; table-layout: fixed !important; }
                th, td {
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                    white-space: pre-line !important;
                    font-size: 13px;
                    padding: 4px;
                }
            }
        `,
    });

    // Função para formatar data yyyy-mm-dd para dd/mm/yyyy
    const formatDateBR = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <Container>
            <Sidebar />
            <Content sidebarclosed={sidebarClosed.toString()}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <Title style={{ textAlign: 'center' }}>Imprimir Lista</Title>
                    <InputContainer>
                        <StyledInput
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <StyledSelect
                            value={selectedHour}
                            onChange={(e) => setSelectedHour(e.target.value)}
                            disabled={!selectedDate || availableHours.length === 0}
                        >
                            <option value="">Selecione um horário</option>
                            {availableHours.map((hour) => (
                                <option key={hour} value={hour}>
                                    {hour}
                                </option>
                            ))}
                        </StyledSelect>
                    </InputContainer>
                </div>
                {selectedDate && selectedHour && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                            <DownloadTableExcel
                                filename={`TOUR_REGULAR_${formatDateBR(selectedDate)}_${selectedHour}`}
                                sheet="Lista de Tours"
                                currentTableRef={headerRef.current}
                            >
                                <button style={{ padding: '8px 20px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Exportar para Excel</button>
                            </DownloadTableExcel>
                            <button onClick={handlePrint} style={{ padding: '8px 20px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Imprimir</button>
                        </div>
                        <div ref={printRef} className="print-area">
                            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
                                TOUR REGULAR - CARNAVAL EXPERIENCE
                            </div>
                            <div id="info-row-print" className="info-row" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 8 }}>
                                <div>Data: <b>{formatDateBR(selectedDate)}</b></div>
                                <div>Hora: <b>{selectedHour}</b></div>
                                <div>VERDE: <input value={verdeInicio} onChange={e => setVerdeInicio(e.target.value)} style={{ width: 40 }} /> À <input value={verdeFim} onChange={e => setVerdeFim(e.target.value)} style={{ width: 40 }} /> | AZUL: <input value={azulInicio} onChange={e => setAzulInicio(e.target.value)} style={{ width: 40 }} /> À <input value={azulFim} onChange={e => setAzulFim(e.target.value)} style={{ width: 40 }} /></div>
                                <div>Cobrador: <input value={cobrador} onChange={e => setCobrador(e.target.value)} style={{ width: 80 }} /></div>
                            </div>
                            <div style={{ overflowX: 'auto', marginTop: 16 }}>
                                {/* Tabela oculta para exportação do Excel */}
                                <div style={{ display: 'none' }}>
                                    <table ref={headerRef}>
                                        <thead>
                                            <tr>
                                                <th colSpan="15">TOUR REGULAR - CARNAVAL EXPERIENCE</th>
                                            </tr>
                                            <tr>
                                                <th>Data: {formatDateBR(selectedDate)}</th>
                                                <th>Hora: {selectedHour}</th>
                                                <th>VERDE: {verdeInicio} À {verdeFim}</th>
                                                <th>AZUL: {azulInicio} À {azulFim}</th>
                                                <th>Cobrador: {cobrador}</th>
                                                <th colSpan="10"></th>
                                            </tr>
                                            <tr><th colSpan="15"></th></tr>
                                            <tr>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '3%' }}>N°</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '10%' }}>Guia/ Agência</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Adulto</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>NET</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Brasileiro</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Meia</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Free</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Total</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '12%' }}>Nome do Cliente</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Guia</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '8%' }}>Forma de pgto</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '7%' }}>Valor Total</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Comissão</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '7%' }}>Status do pgto</th>
                                                <th style={{ border: '1px solid #222', padding: 4, width: '24%' }}>OBS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...tableData, ...linhasExtras].map((row, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.n}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.guideAgency}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.adulto}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.net}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.brasileiro}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.meia}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.free}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.total}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.nomePax}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.guia}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.paymentMethod}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.valorTotal}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.comissao}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.statusPgto}</td>
                                                    <td style={{ border: '1px solid #222', padding: 4 }}>{row.obs}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <table ref={tableRef} style={{ borderCollapse: 'collapse', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '3%' }}>N°</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '10%' }}>Guia/ Agência</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Adulto</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>NET</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Brasileiro</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Meia</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Free</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '4%' }}>Total</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '12%' }}>Nome do Cliente</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Guia</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '8%' }}>Forma de pgto</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '7%' }}>Valor Total</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '5%' }}>Comissão</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '7%' }}>Status do pgto</th>
                                            <th style={{ border: '1px solid #222', padding: 4, width: '24%' }}>OBS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...tableData, ...linhasExtras].map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.n}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.guideAgency}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.adulto}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.net}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.brasileiro}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.meia}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.free}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.total}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.nomePax}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.guia}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.paymentMethod}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.valorTotal}</td>
                                                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.comissao}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.statusPgto}</td>
                                                <td style={{ border: '1px solid #222', padding: 4 }}>{row.obs}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </Content>
        </Container>
    );
};

export default PrintList; 