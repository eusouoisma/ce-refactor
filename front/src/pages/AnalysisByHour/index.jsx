import React, { useEffect, useState, useContext } from "react";
import Select, { components } from "react-select";
import dayjs from "dayjs";
import styled from "styled-components";
import Sidebar from "../../components/Sidebar";
import { Main, SubTitle, Title } from "./analysisbyhour";
import { Content } from "../../utils/stylesbase";
import StoreContext from "../../components/Store/Context";
import Swal from "sweetalert2";
import { API_URL } from "../../utils/env";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const FilterWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;

  label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: #333;
  }

  .btn-group {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }
`;

const DaySwitchGroup = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const DayButton = styled.button`
  background: ${({ active }) => (active ? "#4285F4" : "#f0f0f0")};
  color: ${({ active }) => (active ? "white" : "#333")};
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: ${({ active }) => (active ? "#357ae8" : "#e0e0e0")};
  }
`;

const ChartContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
  max-width: 1000px;
`;

const PresetSelector = styled.select`
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-top: 4px;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-top: 4px;
`;

const SelectWrapper = styled.div`
  .select-container {
    margin-top: 4px;
  }
  
  .select__control {
    border-radius: 6px;
    border: 1px solid #ccc;
    min-height: 38px;
  }
  
  .select__value-container {
    max-height: 38px;
    overflow: hidden;
  }
  
  .select__multi-value {
    display: none;
  }
`;

const CustomValueContainer = ({ children, ...props }) => {
    const selected = props.getValue();
    const total = props.selectProps.options.length;

    let label = "Nenhuma selecionada";
    if (selected.length === total) {
        label = "Todas selecionadas";
    } else if (selected.length === 1) {
        label = selected[0].label;
    } else if (selected.length > 0) {
        label = `${selected.length} selecionadas`;
    }

    return (
        <components.ValueContainer {...props}>
            <div style={{ paddingLeft: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
            </div>
            {children}
        </components.ValueContainer>
    );
};

const AnalysisByHour = () => {
    const { sidebarClosed } = useContext(StoreContext);

    const [startDate, setStartDate] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [preset, setPreset] = useState("30");

    const [activities, setActivities] = useState([]);
    const [activityOptions, setActivityOptions] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);

    const dias = ["TODOS", "SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
    const diaAtual = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"][dayjs().day()];
    const [day, setDay] = useState(diaAtual);

    const [data, setData] = useState([]);
    const [weekdayData, setWeekdayData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch(`${API_URL}reports/available-activities.php`);
                const json = await res.json();
                if (Array.isArray(json)) {
                    const options = json.map((a) => ({ value: a, label: a }));
                    setActivityOptions(options);
                    setActivities(json);
                    setSelectedActivities(options); // seleciona todas por padrão
                }
            } catch (err) {
                console.error("Erro ao buscar atividades:", err);
            }
        };

        fetchActivities();
    }, []);

    // Efeito para buscar dados do gráfico por hora (afetado por todos os filtros, incluindo dia da semana)
    useEffect(() => {
        const fetchHourData = async () => {
            setLoading(true);
            try {
                // Buscar dados por hora
                const res = await fetch(`${API_URL}reports/analysis-by-hour.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        startDate,
                        endDate,
                        day,
                        activities: selectedActivities.map((s) => s.value),
                    }),
                });
                const json = await res.json();
                
                console.log("Resposta do endpoint de hora:", json);
                
                // Verificar se a resposta contém a estrutura esperada
                if (json.error) {
                    console.error("Erro na resposta de hora:", json.message);
                    setData([]);
                    return;
                }
                
                // Extrair dados e logs de depuração
                const hourData = json.data || json;
                setData(Array.isArray(hourData) ? hourData : []);
                
                // Remover atualização de debugInfo
                if (json.debug) {
                    console.log("Debug info hora:", json.debug);
                }
            } catch (err) {
                console.error("Erro na busca por hora:", err);
            }
            setLoading(false);
        };

        if (selectedActivities.length > 0) {
            fetchHourData();
        } else {
            setData([]);
        }
    }, [startDate, endDate, day, selectedActivities]);

    // Efeito separado para buscar dados do gráfico por dia da semana (afetado pelo mesmo filtro de dia)
    useEffect(() => {
        const fetchWeekdayData = async () => {
            try {
                // Buscar dados por dia da semana (aplicando o mesmo filtro de dia do gráfico por hora)
                const weekdayRes = await fetch(`${API_URL}reports/analysis-by-weekday.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        startDate,
                        endDate,
                        day: null, // Nunca aplicar filtro de dia
                        applyDayFilter: false, // Nunca aplicar filtro de dia
                        activities: selectedActivities.map((s) => s.value),
                    }),
                });
                const weekdayJson = await weekdayRes.json();
                
                if (weekdayJson.error) {
                    console.error("Erro na resposta:", weekdayJson.message);
                    setWeekdayData([]);
                    return;
                }
                
                console.log("Resposta da API weekday:", weekdayJson);
                
                // Extrair os dados
                const weekdayData = weekdayJson.data || weekdayJson;
                setWeekdayData(Array.isArray(weekdayData) ? weekdayData : []);
                
                // Log para depuração
                if (weekdayJson.debug) {
                    console.log("Debug info weekday:", weekdayJson.debug);
                    
                    // Remover atualização de debugInfo
                }
            } catch (err) {
                console.error("Erro na busca por dia da semana:", err);
            }
        };

        if (selectedActivities.length > 0) {
            fetchWeekdayData();
        } else {
            setWeekdayData([]);
        }
    }, [startDate, endDate, day, selectedActivities]);

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

    // Dados para o gráfico por hora do dia
    const chartData = {
        labels: data.map((d) => d.hora),
        datasets: [
            {
                label: "Total de Vendas",
                data: data.map((d) => d.total),
                backgroundColor: "#4285F4",
                borderRadius: 6,
                barThickness: 30,
                datalabels: {
                    color: "#fff",
                    font: {
                        weight: "bold",
                        size: 13,
                    },
                },
            },
        ],
    };

    // Dados para o gráfico por dia da semana
    const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayDataValues = [
        weekdayData.find(d => d.dia === 'DOM')?.total || 0,
        weekdayData.find(d => d.dia === 'SEG')?.total || 0,
        weekdayData.find(d => d.dia === 'TER')?.total || 0,
        weekdayData.find(d => d.dia === 'QUA')?.total || 0,
        weekdayData.find(d => d.dia === 'QUI')?.total || 0,
        weekdayData.find(d => d.dia === 'SEX')?.total || 0,
        weekdayData.find(d => d.dia === 'SAB')?.total || 0
    ];
    
    const weekdayChartData = {
        labels: weekdayLabels,
        datasets: [
            {
                label: "Total de Ingressos",
                data: weekdayDataValues, // Sempre usar os dados completos, sem filtrar por dia
                backgroundColor: [
                    "#FF6384", // Domingo
                    "#36A2EB", // Segunda
                    "#4BC0C0", // Terça
                    "#FFCE56", // Quarta
                    "#9966FF", // Quinta
                    "#FF9F40", // Sexta
                    "#C9CBCF"  // Sábado
                ],
                borderRadius: 6,
                barThickness: 40,
                datalabels: {
                    color: "#fff",
                    font: {
                        weight: "bold",
                        size: 13,
                    },
                },
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            datalabels: {
                display: true,
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.raw} vendas`,
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Hora do Dia" },
                ticks: { font: { size: 12 } },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Vendas" },
                ticks: {
                    stepSize: 1,
                    font: { size: 12 },
                },
                grid: {
                    color: "#eee",
                },
            },
        },
    };

    const weekdayChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            datalabels: {
                display: true,
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.raw} ingressos`,
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Dia da Semana" },
                ticks: { font: { size: 12 } },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Total de Ingressos" },
                ticks: {
                    stepSize: 1,
                    font: { size: 12 },
                },
                grid: {
                    color: "#eee",
                },
            },
        },
    };

    return (
        <Main>
            <Sidebar />
            <Content sidebarclosed={sidebarClosed.toString()} min-padding="true">
                <SubTitle>Vendas por Horário</SubTitle>
                <Title>Análise por Dia</Title>

                <FilterWrapper>
                    <label>
                        Intervalo:
                        <PresetSelector onChange={(e) => applyPreset(e.target.value)} value={preset}>
                            <option value="custom">Intervalo personalizado</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Últimos 365 dias</option>
                            <option value="last_month">Mês passado</option>
                            <option value="last_12_months">Últimos 12 meses</option>
                            <option value="last_year">Ano passado</option>
                            <option value="this_year">Este ano</option>
                            <option value="all">Toda a história</option>
                        </PresetSelector>
                    </label>
                    <label>
                        Data Inicial:
                        <DateInput
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val > endDate) {
                                    Swal.fire("Data inválida", "A data inicial não pode ser maior que a final", "warning");
                                    return;
                                }
                                setStartDate(val);
                                setPreset("custom");
                            }}
                        />
                    </label>
                    <label>
                        Data Final:
                        <DateInput
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val < startDate) {
                                    Swal.fire("Data inválida", "A data final não pode ser menor que a inicial", "warning");
                                    return;
                                }
                                setEndDate(val);
                                setPreset("custom");
                            }}
                        />
                    </label>

                    <label style={{ width: "100%", maxWidth: 400 }}>
                        Atividades:
                        <SelectWrapper>
                            <Select
                                isMulti
                                options={activityOptions}
                                value={selectedActivities}
                                onChange={(selected) => setSelectedActivities(selected || [])}
                                placeholder="Selecione atividades..."
                                closeMenuOnSelect={false}
                                isSearchable
                                hideSelectedOptions={false}
                                classNamePrefix="select"
                                className="select-container"
                                components={{ 
                                    ValueContainer: CustomValueContainer 
                                }}
                            />
                        </SelectWrapper>
                        <div className="btn-group">
                            <button type="button" onClick={() => setSelectedActivities(activityOptions)}>Selecionar todas</button>
                            <button type="button" onClick={() => setSelectedActivities([])}>Limpar</button>
                        </div>
                    </label>
                </FilterWrapper>

                <DaySwitchGroup>
                    {dias.map((d) => {
                        const diaSelecionado = day === "ALL" ? "TODOS" : day;
                        return (
                            <DayButton
                                key={d}
                                active={d === diaSelecionado}
                                onClick={() => setDay(d === "TODOS" ? "ALL" : d)}
                            >
                                {d}
                            </DayButton>
                        );
                    })}
                </DaySwitchGroup>
                
                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <>
                        <ChartContainer>
                            <h5>Vendas por Hora do Dia</h5>
                            <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
                        </ChartContainer>
                        
                        <ChartContainer style={{ marginTop: "30px" }}>
                            <h5>Total de Ingressos por Dia da Semana</h5>
                            <Bar data={weekdayChartData} options={weekdayChartOptions} plugins={[ChartDataLabels]} />
                        </ChartContainer>
                    </>
                )}
            </Content>
        </Main>
    );
};

export default AnalysisByHour;
