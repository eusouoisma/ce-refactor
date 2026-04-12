import React, { useState, useContext, useEffect } from 'react';
import { Container, Title, SearchContainer, SearchBox, Table, DeleteButton, EditButton } from './quicksearch';
import { Autocomplete, TextField, Tooltip } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import Sidebar from '../../components/Sidebar';
import { Content, Indicators, PageHeader, Logo } from '../../utils/stylesbase';
import StoreContext from '../../components/Store/Context';
import { API_URL } from '../../utils/env';
import { formatMoney } from '../../utils/functions';
import LogoImg from '../../assets/logo-ce.png';

const MySwal = withReactContent(Swal);

const QuickSearch = () => {
    const { sidebarClosed, userPermissions } = useContext(StoreContext);
    const navigate = useNavigate();
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [tours, setTours] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [reservaValue, setReservaValue] = useState('');
    const [clienteValue, setClienteValue] = useState('');
    const [indicators, setIndicators] = useState({
        paxTotal: 0,
        totalValueByCurrency: {}
    });

    const buscarOpcoes = async (reserva = '', cliente = '') => {
        try {
            const response = await fetch(`${API_URL}quick-search/search.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reserva,
                    cliente
                })
            });

            const data = await response.json();
            
            if (!data.error) {
                setReservas(data.reservas);
                setClientes(data.clientes);
            }
        } catch (error) {
            console.error('Erro ao buscar opções:', error);
        }
    };

    const buscarTours = async (reserva = '', cliente = '') => {
        try {
            const response = await fetch(`${API_URL}quick-search/search-tours.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reserva,
                    cliente
                })
            });

            const data = await response.json();
            
            if (!data.error) {
                setTours(data.tours);
            }
        } catch (error) {
            console.error('Erro ao buscar tours:', error);
        }
    };

    // Calcular indicadores baseado nos tours filtrados
    useEffect(() => {
        let paxTotal = 0;
        let totalValueByCurrency = {};

        tours.forEach((tour) => {
            if (true) {
                
                // Calcular total de pax
                const totalPax = parseInt(tour.paxAdult || 0) + 
                               parseInt(tour.paxHalf || 0) + 
                               parseInt(tour.paxNet || 0) + 
                               parseInt(tour.paxFree || 0) + 
                               parseInt(tour.paxBrazilian || 0);
                paxTotal += totalPax;

                // Calcular valor total por moeda (para todos os tipos de tour)
                if (tour.totalValue && tour.currency) {
                    const value = parseFloat(tour.totalValue) || 0;
                    if (totalValueByCurrency[tour.currency]) {
                        totalValueByCurrency[tour.currency] += value;
                    } else {
                        totalValueByCurrency[tour.currency] = value;
                    }
                }
            }
        });

        setIndicators({
            paxTotal,
            totalValueByCurrency
        });
    }, [tours]);

    const handleInputChange = (inputValue, type) => {
        if (type === 'reserva') {
            setReservaValue(inputValue);
        } else {
            setClienteValue(inputValue);
        }

        if (inputValue.length >= 3) {
            if (type === 'reserva') {
                buscarOpcoes(inputValue, clienteValue);
                buscarTours(inputValue, clienteValue);
            } else {
                buscarOpcoes(reservaValue, inputValue);
                buscarTours(reservaValue, inputValue);
            }
        } else {
            if (type === 'reserva') {
                setReservas([]);
            } else {
                setClientes([]);
            }
            setTours([]);
        }
    };

    const editTour = (id) => {
        navigate(`/editar-tour?id=${id}`);
    };

    const deleteTour = (id, orderRef) => {
        if (userPermissions === 5) {
            Swal.fire({
                title: "Acesso Negado",
                text: "Você não tem permissão para cancelar tours.",
                icon: "error"
            });
            return;
        }

        MySwal.fire({
            title: `Tem certeza que deseja cancelar o tour Nº de reserva ${orderRef}`,
            showCancelButton: true,
            confirmButtonText: "Sim",
            input: "text",
            inputLabel: "Motivo de Cancelamento",
            inputPlaceholder: "Motivo de Cancelamento",
            inputAttributes: {
                name: "cancelReason",
            },
        }).then(({ ...params }) => {
            if (params.isConfirmed) {
                const body = {
                    cancelReason: params.value,
                    createdBy: localStorage.getItem('userName'),
                    lastEditBy: localStorage.getItem('userName'),
                };
                fetch(`${API_URL}tours/cancel.php?id=${id}`, {
                    method: "POST",
                    body: JSON.stringify(body),
                })
                .then((response) => response.json())
                .then((response) =>
                    Swal.fire("Tour cancelado com sucesso!!", "", "success").then(() => {
                        // Recarregar os dados dos tours
                        buscarTours(reservaValue, clienteValue);
                    })
                );
            }
        });
    };

    return (
        <Container>
            <Sidebar />
            <Content sidebarclosed={sidebarClosed.toString()}>
                <PageHeader>
                    <div>
                        <Logo src={LogoImg} />
                    </div>
                    <Indicators>
                        <thead>
                            <tr>
                                <th>Pax Total</th>
                                {userPermissions === 4 || userPermissions === 2 ? (
                                    Object.keys(indicators.totalValueByCurrency).map(currency => (
                                        <th key={currency}>Valor Total ({currency})</th>
                                    ))
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{indicators.paxTotal}</td>
                                {userPermissions === 4 || userPermissions === 2 ? (
                                    Object.entries(indicators.totalValueByCurrency).map(([currency, value]) => (
                                        <td key={currency}>{formatMoney(value)}</td>
                                    ))
                                ) : null}
                            </tr>
                        </tbody>
                    </Indicators>
                </PageHeader>
                <Title>Busca Rápida</Title>
                <SearchContainer>
                    <SearchBox>
                        <Autocomplete
                            options={reservas}
                            getOptionLabel={(option) => option.label}
                            value={reservaValue ? { label: reservaValue } : null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Nº da Reserva"
                                    variant="outlined"
                                    value={reservaValue}
                                    onChange={(e) => handleInputChange(e.target.value, 'reserva')}
                                />
                            )}
                            noOptionsText="Digite pelo menos 3 caracteres"
                            loadingText="Carregando..."
                            onInputChange={(_, value) => handleInputChange(value, 'reserva')}
                        />
                    </SearchBox>
                    <SearchBox>
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => option.label}
                            value={clienteValue ? { label: clienteValue } : null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Nome do Cliente"
                                    variant="outlined"
                                    value={clienteValue}
                                    onChange={(e) => handleInputChange(e.target.value, 'cliente')}
                                />
                            )}
                            noOptionsText="Digite pelo menos 3 caracteres"
                            loadingText="Carregando..."
                            onInputChange={(_, value) => handleInputChange(value, 'cliente')}
                        />
                    </SearchBox>
                </SearchContainer>

                {tours.length > 0 && (
                    <Table>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Dia</th>
                                <th>Horário</th>
                                <th>Atividade</th>
                                <th>Adulto</th>
                                <th>NET</th>
                                <th>Brasileiro</th>
                                <th>Meia</th>
                                <th>Free</th>
                                <th>Total</th>
                                <th>Nº Grupos</th>
                                <th>Idioma</th>
                                <th>Cliente</th>
                                <th>Nº Reserva</th>
                                <th>Guia CE</th>
                                <th>Moeda</th>
                                <th>Valor</th>
                                <th>Pagamento</th>
                                <th>Status de Pagamento</th>
                                <th>Nome Cliente</th>
                                <th>Contato Cliente</th>
                                <th>Nome Guia</th>
                                <th>Contato Guia</th>
                                <th>Local</th>
                                <th>Plataforma</th>
                                <th>Nome Email</th>
                                <th>Comissão</th>
                                <th>Obs</th>
                                <th>País</th>
                                <th>Data do Registro</th>
                                <th>Criado por</th>
                                <th>Editado por</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tours.map((tour) => (
                                <tr 
                                    key={tour.id}
                                    className={selectedLine === tour.id ? "selected" : ""}
                                    onClick={() => selectedLine === tour.id ? setSelectedLine(null) : setSelectedLine(tour.id)}
                                >
                                    <td>
                                        <Tooltip title="Edit" placement="top">
                                            <EditButton onClick={() => editTour(tour.id)} />
                                        </Tooltip>
                                        <Tooltip title="Delete" placement="top">
                                            <DeleteButton onClick={() => deleteTour(tour.id, tour.orderRef)} />
                                        </Tooltip>
                                    </td>
                                    <td>
                                        {tour.comments && (
                                            <Tooltip 
                                                title={tour.comments}
                                                placement="top"
                                                arrow
                                                enterDelay={200}
                                                leaveDelay={200}
                                                componentsProps={{
                                                    tooltip: {
                                                        sx: {
                                                            fontSize: '14px',
                                                            bgcolor: 'rgba(0, 0, 0, 0.8)',
                                                            '& .MuiTooltip-arrow': {
                                                                color: 'rgba(0, 0, 0, 0.8)',
                                                            },
                                                        },
                                                    },
                                                }}
                                            >
                                                <CommentIcon 
                                                    style={{ 
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        left: '0px'
                                                    }} 
                                                />
                                            </Tooltip>
                                        )}
                                        {tour.status}
                                    </td>
                                    <td>{tour.tourDate}</td>
                                    <td>{tour.weekDay}</td>
                                    <td>{tour.tourHour}</td>
                                    <td>{tour.activity}</td>
                                    <td>{tour.paxAdult}</td>
                                    <td>{tour.paxNet}</td>
                                    <td>{tour.paxBrazilian}</td>
                                    <td>{tour.paxHalf}</td>
                                    <td>{tour.paxFree}</td>
                                    <td>{tour.totalPax}</td>
                                    <td>{tour.type === "regular" ? "" : tour.numberOfGroups}</td>
                                    <td>{tour.language}</td>
                                    <td>{tour.client}</td>
                                    <td>{tour.orderRef}</td>
                                    <td>{tour.ceGuide}</td>
                                    <td>{tour.currency}</td>
                                    <td>{tour.type === "regular" ? formatMoney(tour.totalValue) : "-"}</td>
                                    <td>{tour.paymentMethod}</td>
                                    <td>{tour.paymentStatus}</td>
                                    <td>{tour.clientName}</td>
                                    <td>{tour.clientContact}</td>
                                    <td>{tour.companionName}</td>
                                    <td>{tour.companionContact}</td>
                                    <td>{tour.local}</td>
                                    <td>{tour.platform}</td>
                                    <td>{tour.emailSubject}</td>
                                    <td>{tour.comissioned ? <CheckBoxIcon /> : <></>}</td>
                                    <td>{tour.comments}</td>
                                    <td>{tour.country}</td>
                                    <td>{tour.dateOfRegistrationFormated}</td>
                                    <td>{tour.createdBy}</td>
                                    <td>{tour.lastEditBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Content>
        </Container>
    );
};

export default QuickSearch; 