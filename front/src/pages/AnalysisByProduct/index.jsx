import React, { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import Sidebar from "../../components/Sidebar";
import { Main, SubTitle, Title } from "./analysisbyproduct";
import { Content } from "../../utils/stylesbase";
import StoreContext from "../../components/Store/Context";
import { API_URL } from "../../utils/env";
import Swal from "sweetalert2";
import {
    FilterWrapper,
    StyledTable,
    ChartWrapper,
    ChartBox,
} from "./analysisbyproduct";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const AnalysisByProduct = () => {
    const { sidebarClosed, userPermissions } = useContext(StoreContext);
    // Verifica se o usuário tem apenas a permissão de Relatórios
    const isOnlyReportsUser = userPermissions === 6;

    const [data, setData] = useState([]);
    const [startDate, setStartDate] = useState(dayjs().subtract(1, "year").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [preset, setPreset] = useState("365");
    const [orderBy, setOrderBy] = useState("pax");
    const [from, setFrom] = useState(1);
    const [to, setTo] = useState(10);
    const [loading, setLoading] = useState(false);
    const [graphKey, setGraphKey] = useState(0);
    
    // Novo estado para os dados dos tours regulares
    const [regularTourData, setRegularTourData] = useState(null);
    const [loadingRegularTour, setLoadingRegularTour] = useState(false);
    // Novo estado para dados totais
    const [totalData, setTotalData] = useState({
        totalPax: 0,
        totalValor: 0,
        currency: "BRL"
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}reports/analysis-by-product.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        startDate,
                        endDate,
                        orderBy,
                        from,
                        to,
                    }),
                });
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
            setLoading(false);
        };

        fetchData();
        
        // Buscar dados totais independente da faixa
        const fetchTotalData = async () => {
            try {
                const response = await fetch(`${API_URL}reports/analysis-by-product.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        startDate,
                        endDate,
                        orderBy,
                        from: 1,
                        to: 999999, // Um número alto para pegar todos os dados
                    }),
                });
                const result = await response.json();
                
                // Calcular somas totais
                const totalPax = result.reduce((sum, item) => sum + parseInt(item.totalPax || 0), 0);
                const totalValor = result.reduce((sum, item) => sum + parseFloat(item.valorTotal || 0), 0);
                const currency = result.length > 0 ? (["BRL", "USD", "EUR"].includes(result[0].currency) ? result[0].currency : "BRL") : "BRL";
                
                setTotalData({
                    totalPax,
                    totalValor,
                    currency
                });
            } catch (error) {
                console.error("Erro ao buscar dados totais:", error);
            }
        };
        
        fetchTotalData();
    }, [startDate, endDate, orderBy, from, to]);
    
    // Nova função para buscar dados dos tours regulares
    useEffect(() => {
        const fetchRegularTourData = async () => {
            setLoadingRegularTour(true);
            try {
                const response = await fetch(`${API_URL}reports/analysis-regular-tour.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        startDate,
                        endDate,
                    }),
                });
                const result = await response.json();
                setRegularTourData(result);
            } catch (error) {
                console.error("Erro ao buscar dados de tours regulares:", error);
            }
            setLoadingRegularTour(false);
        };

        fetchRegularTourData();
    }, [startDate, endDate]);

    const applyPreset = (key) => {
        setPreset(key);
        let start, end = dayjs().format("YYYY-MM-DD");

        switch (key) {
            case "30":
                start = dayjs().subtract(30, "day").format("YYYY-MM-DD");
                break;
            case "90":
                start = dayjs().subtract(90, "day").format("YYYY-MM-DD");
                break;
            case "365":
                start = dayjs().subtract(365, "day").format("YYYY-MM-DD");
                break;
            case "last_month":
                start = dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
                end = dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD");
                break;
            case "last_year":
                start = dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD");
                end = dayjs().subtract(1, "year").endOf("year").format("YYYY-MM-DD");
                break;
            case "this_year":
                start = dayjs().startOf("year").format("YYYY-MM-DD");
                end = dayjs().endOf("year").format("YYYY-MM-DD");
                break;
            case "all":
                start = "2020-01-01";
                break;
            default:
                return;
        }

        setStartDate(start);
        setEndDate(end);
    };

    const pieOptions = {
        plugins: {
            datalabels: {
                color: "#fff",
                formatter: (value, context) => {
                    return context.chart.data.labels[context.dataIndex];
                },
                font: {
                    weight: "bold",
                    size: 14,
                },
            },
            legend: {
                position: "bottom",
            },
        },
    };

    const piePax = {
        labels: data.map(d => d.activity || "N/A"),
        datasets: [{
            label: "Total Pax",
            data: data.map(d => d.totalPax),
            backgroundColor: data.map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`),
        }]
    };

    const pieValor = {
        labels: data.map(d => d.activity || "N/A"),
        datasets: [{
            label: "Valor Total",
            data: data.map(d => Number(d.valorTotal)),
            backgroundColor: data.map((_, i) => `hsl(${(i * 67) % 360}, 70%, 60%)`),
        }]
    };

    useEffect(() => {
        setTimeout(() => {
            setGraphKey(prev => prev + 1);
        }, 300);
    }, [sidebarClosed]);

    // Dados para o gráfico de barras de Tour Regular
    const regularTourBarData = regularTourData ? {
        labels: ['Adulto', 'Meia', 'Cortesia', 'Net'],
        datasets: [
            {
                label: 'Quantidade',
                data: [
                    regularTourData.paxAdult || 0,
                    regularTourData.paxHalf || 0, 
                    regularTourData.paxFree || 0,
                    regularTourData.paxNet || 0
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
            },
        ],
    } : null;
    
    // Novo gráfico para distribuição por valor em Tours Regulares
    const regularTourValueBarData = regularTourData ? {
        labels: ['Adulto', 'Meia', 'Cortesia', 'Net'],
        datasets: [
            {
                label: 'Valor',
                data: [
                    regularTourData.valorAdult || 0,
                    regularTourData.valorHalf || 0, 
                    regularTourData.valorFree || 0,
                    regularTourData.valorNet || 0
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(201, 203, 207, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
            },
        ],
    } : null;

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                color: '#444',
                anchor: 'end',
                align: 'top',
                formatter: (value) => value,
                font: {
                    weight: 'bold',
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                }
            }
        }
    };
    
    // Opções para o gráfico de valor
    const barValueOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                color: '#444',
                anchor: 'end',
                align: 'top',
                formatter: (value) => value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }),
                font: {
                    weight: 'bold',
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                    }
                }
            }
        }
    };

    // Modifica os dados da tabela para remover as colunas de valor se for usuário apenas de relatórios
    const tableHeaders = (
        <tr>
            <th>#</th>
            <th>Produto</th>
            <th>Total Pax</th>
            <th>% Pax</th>
            {!isOnlyReportsUser && <th>Valor Total</th>}
            {!isOnlyReportsUser && <th>% Valor</th>}
        </tr>
    );

    const tableRows = data.map((row, i) => (
        <tr key={i}>
            <td>{row.index}</td>
            <td>{row.activity || "N/A"}</td>
            <td>{row.totalPax}</td>
            <td>{row.paxPercent?.toFixed(2)}%</td>
            {!isOnlyReportsUser && (
                <td>
                    {Number(row.valorTotal).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: ["BRL", "USD", "EUR"].includes(row.currency) ? row.currency : "BRL",
                    })}
                </td>
            )}
            {!isOnlyReportsUser && <td>{row.valorPercent?.toFixed(2)}%</td>}
        </tr>
    ));

    const tableTotalRow = (
        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
            <td colSpan={2}>TOTAL GERAL DO PERÍODO</td>
            <td>{totalData.totalPax}</td>
            <td>100%</td>
            {!isOnlyReportsUser && (
                <td>
                    {totalData.totalValor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: totalData.currency,
                    })}
                </td>
            )}
            {!isOnlyReportsUser && <td>100%</td>}
        </tr>
    );

    // Modifica os dados da tabela de tours regulares
    const regularTourTableHeaders = (
        <tr>
            <th>Tipo</th>
            <th>Total Pax</th>
            <th>% Pax</th>
            {!isOnlyReportsUser && <th>Valor Total</th>}
            {!isOnlyReportsUser && <th>% Valor</th>}
        </tr>
    );

    return (
        <Main>
            <Sidebar />
            <Content sidebarclosed={sidebarClosed.toString()} min-padding="true">
                <SubTitle>Análise por Produto</SubTitle>
                <Title>Relatório</Title>

                <FilterWrapper>
                    <label>
                        Intervalo:
                        <select onChange={(e) => applyPreset(e.target.value)} value={preset}>
                            <option value="custom">Intervalo personalizado</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Últimos 365 dias</option>
                            <option value="last_month">Mês passado</option>
                            <option value="last_year">Ano passado</option>
                            <option value="this_year">Este ano</option>
                            <option value="all">Toda a história</option>
                        </select>
                    </label>
                    <label>
                        Data Inicial:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const newStart = e.target.value;
                                if (newStart > endDate) {
                                    Swal.fire("Data inválida", "A data inicial não pode ser maior que a final.", "warning");
                                    return;
                                }
                                setStartDate(newStart);
                                setPreset("custom");
                            }}
                        />
                    </label>
                    <label>
                        Data Final:
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                const newEnd = e.target.value;
                                if (newEnd < startDate) {
                                    Swal.fire("Data inválida", "A data final não pode ser menor que a inicial.", "warning");
                                    return;
                                }
                                setEndDate(newEnd);
                                setPreset("custom");
                            }}
                        />
                    </label>
                    <label>
                        Ordenar por:
                        <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                            <option value="pax">Pax</option>
                            <option value="valor">Valor</option>
                        </select>
                    </label>
                    <label>
                        Faixa:
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="number"
                                value={from}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value > to) {
                                        Swal.fire("Faixa inválida", "O número inicial não pode ser maior que o final.", "warning");
                                        return;
                                    }
                                    setFrom(value);
                                }}
                                min={1}
                                placeholder="De"
                            />
                            <input
                                type="number"
                                value={to}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value < from) {
                                        Swal.fire("Faixa inválida", "O número final não pode ser menor que o inicial.", "warning");
                                        return;
                                    }
                                    setTo(value);
                                }}
                                min={from}
                                placeholder="Até"
                            />
                        </div>
                    </label>
                </FilterWrapper>

                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <>
                        <StyledTable>
                            <thead>
                                {tableHeaders}
                            </thead>

                            <tbody>
                                {tableRows}
                                {tableTotalRow}
                            </tbody>
                        </StyledTable>

                        <ChartWrapper>
                            <ChartBox>
                                <h4 style={{ marginBottom: 20 }}>Distribuição por Pax</h4>
                                <Pie key={graphKey + "-pax"} data={piePax} options={pieOptions} plugins={[ChartDataLabels]} />
                            </ChartBox>
                            {!isOnlyReportsUser && (
                                <ChartBox>
                                    <h4 style={{ marginBottom: 20 }}>Distribuição por Valor</h4>
                                    <Pie key={graphKey + "-valor"} data={pieValor} options={pieOptions} plugins={[ChartDataLabels]} />
                                </ChartBox>
                            )}
                        </ChartWrapper>
                        
                        {/* Nova seção para Tours Regulares */}
                        <div style={{ marginTop: 60 }}>
                            <Title>Análise de Tours Regulares</Title>
                            
                            {loadingRegularTour ? (
                                <p>Carregando dados de tours regulares...</p>
                            ) : regularTourData ? (
                                <>
                                    <StyledTable>
                                        <thead>
                                            {regularTourTableHeaders}
                                        </thead>
                                        
                                        <tbody>
                                            <tr>
                                                <td>Adulto</td>
                                                <td>{regularTourData.paxAdult && regularTourData.paxAdult !== 0 ? regularTourData.paxAdult : '-'}</td>
                                                <td>{regularTourData.percentAdult && regularTourData.percentAdult !== 0 ? regularTourData.percentAdult?.toFixed(2) + '%' : '-'}</td>
                                                {!isOnlyReportsUser && (
                                                    <td>
                                                        {regularTourData.valorAdult && regularTourData.valorAdult !== 0 ? 
                                                            (regularTourData.valorAdult).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            }) : '-'
                                                        }
                                                    </td>
                                                )}
                                                {!isOnlyReportsUser && (
                                                    <td>{regularTourData.percentValorAdult && regularTourData.percentValorAdult !== 0 ? regularTourData.percentValorAdult?.toFixed(2) + '%' : '-'}</td>
                                                )}
                                            </tr>
                                            <tr>
                                                <td>Meia</td>
                                                <td>{regularTourData.paxHalf && regularTourData.paxHalf !== 0 ? regularTourData.paxHalf : '-'}</td>
                                                <td>{regularTourData.percentHalf && regularTourData.percentHalf !== 0 ? regularTourData.percentHalf?.toFixed(2) + '%' : '-'}</td>
                                                {!isOnlyReportsUser && (
                                                    <td>
                                                        {regularTourData.valorHalf && regularTourData.valorHalf !== 0 ? 
                                                            (regularTourData.valorHalf).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            }) : '-'
                                                        }
                                                    </td>
                                                )}
                                                {!isOnlyReportsUser && (
                                                    <td>{regularTourData.percentValorHalf && regularTourData.percentValorHalf !== 0 ? regularTourData.percentValorHalf?.toFixed(2) + '%' : '-'}</td>
                                                )}
                                            </tr>
                                            <tr>
                                                <td>Cortesia</td>
                                                <td>{regularTourData.paxFree && regularTourData.paxFree !== 0 ? regularTourData.paxFree : '-'}</td>
                                                <td>{regularTourData.percentFree && regularTourData.percentFree !== 0 ? regularTourData.percentFree?.toFixed(2) + '%' : '-'}</td>
                                                {!isOnlyReportsUser && (
                                                    <td>
                                                        {regularTourData.valorFree && regularTourData.valorFree !== 0 ? 
                                                            (regularTourData.valorFree).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            }) : '-'
                                                        }
                                                    </td>
                                                )}
                                                {!isOnlyReportsUser && (
                                                    <td>{regularTourData.percentValorFree && regularTourData.percentValorFree !== 0 ? regularTourData.percentValorFree?.toFixed(2) + '%' : '-'}</td>
                                                )}
                                            </tr>
                                            <tr>
                                                <td>Net</td>
                                                <td>{regularTourData.paxNet && regularTourData.paxNet !== 0 ? regularTourData.paxNet : '-'}</td>
                                                <td>{regularTourData.percentNet && regularTourData.percentNet !== 0 ? regularTourData.percentNet?.toFixed(2) + '%' : '-'}</td>
                                                {!isOnlyReportsUser && (
                                                    <td>
                                                        {regularTourData.valorNet && regularTourData.valorNet !== 0 ? 
                                                            (regularTourData.valorNet).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            }) : '-'
                                                        }
                                                    </td>
                                                )}
                                                {!isOnlyReportsUser && (
                                                    <td>{regularTourData.percentValorNet && regularTourData.percentValorNet !== 0 ? regularTourData.percentValorNet?.toFixed(2) + '%' : '-'}</td>
                                                )}
                                            </tr>
                                            <tr style={{ fontWeight: 'bold' }}>
                                                <td>Total</td>
                                                <td>{regularTourData.totalPax || '-'}</td>
                                                <td>100%</td>
                                                {!isOnlyReportsUser && (
                                                    <td>
                                                        {regularTourData.totalValor ? 
                                                            (regularTourData.totalValor).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            }) : '-'
                                                        }
                                                    </td>
                                                )}
                                                {!isOnlyReportsUser && <td>100%</td>}
                                            </tr>
                                        </tbody>
                                    </StyledTable>
                                    
                                    <ChartWrapper>
                                        <ChartBox style={{ marginTop: 30, maxWidth: 600 }}>
                                            <h5 style={{ marginBottom: 20 }}>Distribuição por Tipo de Pax - Tour Regular</h5>
                                            <Bar data={regularTourBarData} options={barOptions} plugins={[ChartDataLabels]} />
                                        </ChartBox>
                                        
                                        {!isOnlyReportsUser && (
                                            <ChartBox style={{ marginTop: 30, maxWidth: 600 }}>
                                                <h5 style={{ marginBottom: 20 }}>Distribuição por Valor - Tour Regular</h5>
                                                <Bar data={regularTourValueBarData} options={barValueOptions} plugins={[ChartDataLabels]} />
                                            </ChartBox>
                                        )}
                                    </ChartWrapper>
                                </>
                            ) : (
                                <p>Nenhum dado de tour regular encontrado para o período selecionado.</p>
                            )}
                        </div>
                    </>
                )}
            </Content>
        </Main>
    );
};

export default AnalysisByProduct;
