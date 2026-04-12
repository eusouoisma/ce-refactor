import React, { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import styled from "styled-components";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import Sidebar from "../../components/Sidebar";
import { Main, SubTitle, Title } from "./analysisbycountry";
import { Content } from "../../utils/stylesbase";
import StoreContext from "../../components/Store/Context";
import { API_URL } from "../../utils/env";
import Swal from "sweetalert2";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const FilterWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;

  label {
    font-size: 14px;
    color: #555;
    display: flex;
    flex-direction: column;
  }

  input,
  select {
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
    margin-top: 4px;
    min-width: 160px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 12px 16px;
    text-align: left;
  }

  thead {
    background-color: #f0f2f5;

    th {
      font-size: 13px;
      text-transform: uppercase;
      color: #555;
      font-weight: 600;
    }
  }

  tbody tr {
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;

    &:hover {
      background-color: #f9f9f9;
    }
  }

  td {
    font-size: 14px;
    color: #333;
  }
`;

const ChartWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  gap: 40px;
  margin-top: 40px;
  flex-wrap: wrap;
`;

const ChartBox = styled.div`
  flex: 1 1 48%;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const AnalysisByCountries = () => {
    const { sidebarClosed, userPermissions } = useContext(StoreContext);
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}reports/analysis-by-country.php`, {
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
    }, [startDate, endDate, orderBy, from, to]);

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
            case "last_12_months":
                start = dayjs().subtract(12, "month").startOf("month").format("YYYY-MM-DD");
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
        labels: data.map(d => d.country || "N/A"),
        datasets: [{
            label: "Total Pax",
            data: data.map(d => d.totalPax),
            backgroundColor: data.map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`),
        }]
    };

    const pieValor = {
        labels: data.map(d => d.country || "N/A"),
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

    return (
        <Main>
            <Sidebar />
            <Content sidebarclosed={sidebarClosed.toString()} min-padding="true">
                <SubTitle>Vendas por país</SubTitle>
                <Title>Listar</Title>

                <FilterWrapper>
                    <label>
                        Intervalo:
                        <select onChange={(e) => applyPreset(e.target.value)} value={preset}>
                            <option value="custom">Intervalo</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Últimos 365 dias</option>
                            <option value="last_month">Mês passado</option>
                            <option value="last_12_months">Últimos 12 meses</option>
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
                                    Swal.fire({
                                        icon: "warning",
                                        title: "Data inválida",
                                        text: "A data inicial não pode ser maior que a final.",
                                    });
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
                                    Swal.fire({
                                        icon: "warning",
                                        title: "Data inválida",
                                        text: "A data final não pode ser menor que a inicial.",
                                    });
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
                        Faixa (ex: do 5º ao 15º):
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="number"
                                value={from}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value > to) {
                                        Swal.fire({
                                            icon: "warning",
                                            title: "Faixa inválida",
                                            text: "O número inicial não pode ser maior que o final.",
                                        });
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
                                        Swal.fire({
                                            icon: "warning",
                                            title: "Faixa inválida",
                                            text: "O número final não pode ser menor que o inicial.",
                                        });
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
                                <tr>
                                    <th>#</th>
                                    <th>País</th>
                                    <th>Total Pax</th>
                                    <th>% Pax</th>
                                    {!isOnlyReportsUser && <th>Valor Total</th>}
                                    {!isOnlyReportsUser && <th>% Valor</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.index}</td>
                                        <td>{row.country || "N/A"}</td>
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
                                ))}
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
                    </>
                )}
            </Content>
        </Main>
    );
};

export default AnalysisByCountries;
