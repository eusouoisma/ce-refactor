import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import LogoImg from "../../assets/logo-ce.png";

import {
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Button,
  Switch,
} from "@mui/material";

import CheckBoxIcon from "@mui/icons-material/CheckBox";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  EditButton,
  Main,
  SelectMonths,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./tourlist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  Indicators,
  DownloadExcelWrapper,
  HaveCommentsIcon,
  PageHeader,
  Logo,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { formatMoney } from "../../utils/functions";
import { API_URL } from "../../utils/env";

const convertDate = (date) => {
  if (!date) return "";
  date = date.split("/");
  const day = date[0];
  const month = date[1];
  const year = date[2];

  return new Date(`${year}-${month}-${day}`);
};

const TourList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const {
    sidebarClosed,
    userName,
    setSidebarClosed,
    selectedFiltersTours,
    setSelectedFiltersTours,
    toursIsFiltered,
    setToursIsFiltered,
    filteredMonthsTours,
    setFilteredMonthsTours,
    currentYear,
    setCurrentYear,
    userPermissions,
  } = useContext(StoreContext);

  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(0);
  const [filteredYear, setFilteredYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [selectedLines, setSelectedLines] = useState([]);

  const tableRef = useRef(null);

  const columnsNames = [
    {
      code: "actions",
      name: "",
    },
    {
      code: "status",
      name: "Status",
    },
    {
      code: "formatedTourDate",
      name: "Data",
    },
    {
      code: "weekDay",
      name: "Dia",
    },
    {
      code: "tourHour",
      name: "Horário",
    },
    {
      code: "activity",
      name: "Atividade",
    },
    {
      code: "adicional",
      name: "Adicional",
    },
    {
      code: "paxAdult",
      name: "Adulto",
    },
    {
      code: "paxNet",
      name: "NET",
    },
    {
      code: "paxBrazilian",
      name: "Brasileiro",
    },
    {
      code: "paxHalf",
      name: "Meia",
    },
    {
      code: "paxFree",
      name: "Free",
    },
    {
      code: "totalPax",
      name: "Total",
    },
    {
      code: "numberOfGroups",
      name: "Nº Grupos",
    },
    {
      code: "language",
      name: "Idioma",
    },
    {
      code: "client",
      name: "Cliente",
    },
    {
      code: "orderRef",
      name: "Nº Reserva",
    },

    {
      code: "ceGuide",
      name: "Guia CE",
    },
    {
      code: "currency",
      name: "Moeda",
    },
    {
      code: "totalValue",
      name: "Valor",
    },
    {
      code: "paymentMethod",
      name: "Pagamento",
    },
    {
      code: "paymentStatus",
      name: "Status de Pagamento",
    },
    {
      code: "clientName",
      name: "Nome Cliente",
    },
    {
      code: "clientContact",
      name: "Contato Cliente",
    },
    {
      code: "companionName",
      name: "Nome Guia",
    },
    {
      code: "companionContact",
      name: "Contato Guia",
    },
    {
      code: "local",
      name: "Local",
    },
    {
      code: "platform",
      name: "Plataforma",
    },

    {
      code: "emailSubject",
      name: "Nome Email",
    },
    {
      code: "comissioned",
      name: "Comissão",
    },
    {
      code: "comments",
      name: "Obs",
    },
    {
      code: "conversationHistory",
      name: "Histórico da Conversa",
    },
    {
      code: "country",
      name: "País",
    },
    {
      code: "dateOfRegistrationFormated",
      name: "Data do Registro",
    },
    {
      code: "createdBy",
      name: "Criado por",
    },
    {
      code: "lastEditBy",
      name: "Editado por",
    },
    {
      code: "actions",
      name: "",
    },
  ];

  const months = [
    {
      name: "JAN",
      value: 1,
    },
    {
      name: "FEV",
      value: 2,
    },
    {
      name: "MAR",
      value: 3,
    },
    {
      name: "ABR",
      value: 4,
    },
    {
      name: "MAI",
      value: 5,
    },
    {
      name: "JUN",
      value: 6,
    },
    {
      name: "JUL",
      value: 7,
    },
    {
      name: "AGO",
      value: 8,
    },
    {
      name: "SET",
      value: 9,
    },
    {
      name: "OUT",
      value: 10,
    },
    {
      name: "NOV",
      value: 11,
    },
    {
      name: "DEZ",
      value: 12,
    },
  ];

  const getWeekDay = (date) => {
    if (!date) return "";
    date = date.split("/");
    const d = new Date(`${date[1]} / ${date[0]} / ${date[2]}`);
    let day = d.getDay();
    const days = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return days[day];
  };

  const cancelSelectedTours = useCallback(
    async () => {
      if ([5].indexOf(userPermissions) !== -1) return;
      
      const selectedTours = filteredTours.filter(tour => selectedLines.includes(tour.id));
      const orderRefs = selectedTours.map(tour => tour.orderRef).join(", ");
      
      MySwal.fire({
        title: `Tem certeza que deseja cancelar os tours: ${orderRefs}?`,
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
            createdBy: userName,
            lastEditBy: userName,
          };
          fetch(`${API_URL}tours/cancel-multiple.php?ids=${selectedLines.join(",")}`, {
            method: "POST",
            body: JSON.stringify(body),
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Tours cancelados com sucesso!!", "", "success").then(() => {
                // Recarregar os dados dos tours
                let year = filteredYear;
                let months =
                  filteredMonthsTours[0] === null
                    ? [new Date().getMonth() + 1]
                    : filteredMonthsTours;
                fetch(
                  `${API_URL}tours/list-all.php?months=${months.join(",")}&year=${year}`,
                  {
                    method: "GET",
                  }
                )
                  .then((response) => response.json())
                  .then((response) => {
                    let newResponse = response;
                    newResponse.forEach((tour) => {
                      tour.weekDay = getWeekDay(tour.formatedTourDate);
                      tour.totalPax =
                        parseInt(tour.paxAdult || 0) +
                        parseInt(tour.paxHalf || 0) +
                        parseInt(tour.paxNet || 0) +
                        parseInt(tour.paxFree || 0) +
                        parseInt(tour.paxBrazilian || 0);
                    });
                    setTours(response);
                    setFilteredTours(response);
                    setSelectedLines([]); // Limpar seleções
                  });
              })
            );
        }
      });
    },
    [userName, userPermissions, selectedLines, filteredTours, filteredYear, filteredMonthsTours]
  );

  const deleteTour = useCallback(
    async (tourId, orderRef) => {
      if ([5].indexOf(userPermissions) !== -1) return;
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
            createdBy: userName,
            lastEditBy: userName,
          };
          fetch(`${API_URL}tours/cancel.php?id=${tourId}`, {
            method: "POST",
            body: JSON.stringify(body),
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Tour cancelado com sucesso!!", "", "success").then(() => {
                // Recarregar os dados dos tours
                let year = filteredYear;
                let months =
                  filteredMonthsTours[0] === null
                    ? [new Date().getMonth() + 1]
                    : filteredMonthsTours;
                fetch(
                  `${API_URL}tours/list-all.php?months=${months.join(",")}&year=${year}`,
                  {
                    method: "GET",
                  }
                )
                  .then((response) => response.json())
                  .then((response) => {
                    let newResponse = response;
                    newResponse.forEach((tour) => {
                      tour.weekDay = getWeekDay(tour.formatedTourDate);
                      tour.totalPax =
                        parseInt(tour.paxAdult || 0) +
                        parseInt(tour.paxHalf || 0) +
                        parseInt(tour.paxNet || 0) +
                        parseInt(tour.paxFree || 0) +
                        parseInt(tour.paxBrazilian || 0);
                    });
                    setTours(response);
                    setFilteredTours(response);
                  });
              })
            );
        }
      });
    },
    [userName, filteredYear, filteredMonthsTours]
  );

  const editTour = useCallback((tourId) => {
    navigate(`/editar-tour?id=${tourId}`);
  }, []);

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      tours.forEach((tour) => {
        if (options.indexOf(tour[filter]) === -1) {
          let valid = true;
          selectedFiltersTours.forEach((selectedFilter) => {
            if (
              selectedFilter.selecteds.indexOf(
                tour[selectedFilter.attributeName]
              ) === -1 &&
              selectedFilter.attributeName !== filter
            )
              valid = false;
          });
          if (valid) options.push(tour[filter]);
        }
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [tours, setActiveFilter, selectedFiltersTours]
  );

  const searchFilters = useCallback(
    (e) => {
      const search = e.target.value;
      const filter = activeFilter;
      setSearch(search);
      let options = [];
      tours.forEach((tour) => {
        if (options.indexOf(tour[filter]) === -1) options.push(tour[filter]);
      });
      options = options.filter((a) =>
        a.toLowerCase().includes(search.toLowerCase())
      );
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [activeFilter, tours]
  );

  const closeFilter = useCallback(() => {
    setActiveFilter(false);
  }, [setActiveFilter]);

  const changeFilter = useCallback(
    (e, attribute, option) => {
      let newFilters = selectedFiltersTours;
      if (e.target.checked) {
        if (newFilters.find((item) => item.attributeName === attribute)) {
          newFilters
            .find((item) => item.attributeName === attribute)
            .selecteds.push(option);
        } else {
          newFilters.push({ attributeName: attribute, selecteds: [option] });
        }
      } else {
        newFilters
          .find((item) => item.attributeName === attribute)
          .selecteds.splice(
            newFilters
              .find((item) => item.attributeName === attribute)
              .selecteds.indexOf(option),
            1
          );
      }

      setSelectedFiltersTours(newFilters);
      setReset(Math.random());
    },
    [selectedFiltersTours, activeFilter]
  );

  const checkFilterIsActive = useCallback(
    (option) => {
      if (
        selectedFiltersTours.find(
          (item) => item.attributeName === activeFilter
        ) &&
        selectedFiltersTours
          .find((item) => item.attributeName === activeFilter)
          .selecteds.indexOf(option) !== -1
      )
        return true;
      else return false;
    },
    [activeFilter, selectedFiltersTours, reset]
  );

  const checkIfColumnIsFiltered = useCallback(
    (column) => {
      let filters = [];

      tours.forEach((tour) => {
        if (filters.indexOf(tour[column]) === -1) filters.push(tour[column]);
      });

      const total = filters.length;

      if (
        !selectedFiltersTours.find(
          (filter) => filter.attributeName === column
        ) ||
        !selectedFiltersTours.find((filter) => filter.attributeName === column)
          .selecteds
      )
        return false;

      return (
        selectedFiltersTours.find((filter) => filter.attributeName === column)
          .selecteds.length !== total
      );
    },
    [selectedFiltersTours, tours]
  );

  const selectAll = useCallback(() => {
    let newFilters = selectedFiltersTours;

    let filter = newFilters.find(
      (filter) => filter.attributeName === activeFilter
    );

    tours.forEach((tour) => {
      if (filter.selecteds.indexOf(tour[activeFilter]) === -1)
        filter.selecteds.push(tour[activeFilter]);
    });

    newFilters.find(
      (filter) => filter.attributeName === activeFilter
    ).selecteds = filter.selecteds;

    setSelectedFiltersTours(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFiltersTours]);

  const clearAll = useCallback(() => {
    let newFilters = selectedFiltersTours;
    newFilters.find(
      (filter) => filter.attributeName === activeFilter
    ).selecteds = [];
    setSelectedFiltersTours(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFiltersTours]);

  const resetFilters = useCallback(() => {
    //Seleciona todos os filtros possíveis
    let filters = [];

    columnsNames.forEach((attribute) => {
      tours.forEach((tour) => {
        if (filters.find((item) => item.attributeName === attribute.code)) {
          if (
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.indexOf(tour[attribute.code]) === -1
          )
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.push(tour[attribute.code]);
        } else {
          filters.push({
            attributeName: attribute.code,
            selecteds: [tour[attribute.code]],
          });
        }
      });
    });
    setSelectedFiltersTours(filters);
  }, [tours, columnsNames]);

  const toggleMonth = useCallback(
    (month) => {
      setToursIsFiltered(false);
      let newFilteredMonths = filteredMonthsTours;
      if (filteredMonthsTours.includes(month)) {
        newFilteredMonths.splice(newFilteredMonths.indexOf(month), 1);
        setFilteredMonthsTours(newFilteredMonths);
      } else {
        newFilteredMonths.push(month);
      }
      setReset(Math.random());
    },
    [filteredMonthsTours]
  );

  const changeYear = useCallback((year) => {
    setFilteredYear(year);
    setCurrentYear(year);
    resetFilters();
  }, []);

  useEffect(() => {
    let year = filteredYear;
    let months =
      filteredMonthsTours[0] === null
        ? [new Date().getMonth() + 1]
        : filteredMonthsTours;
    if (filteredMonthsTours[0] === null)
      setFilteredMonthsTours([new Date().getMonth() + 1]);
    fetch(
      `${API_URL}tours/list-all.php?months=${months.join(",")}&year=${year}`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((response) => {
        let newResponse = response;
        newResponse.forEach((tour) => {
          tour.weekDay = getWeekDay(tour.formatedTourDate);
          tour.totalPax =
            parseInt(tour.paxAdult || 0) +
            parseInt(tour.paxHalf || 0) +
            parseInt(tour.paxNet || 0) +
            parseInt(tour.paxFree || 0) +
            parseInt(tour.paxBrazilian || 0);
        });
        setLoading(true);
        setTours(response);
        setFilteredTours(response);

        if (!toursIsFiltered) {
          setToursIsFiltered(true);
          //Seleciona todos os filtros possíveis
          let filters = [];

          columnsNames.forEach((attribute) => {
            response.forEach((tour) => {
              if (
                filters.find((item) => item.attributeName === attribute.code)
              ) {
                if (
                  filters
                    .find((item) => item.attributeName === attribute.code)
                    .selecteds.indexOf(tour[attribute.code]) === -1
                )
                  filters
                    .find((item) => item.attributeName === attribute.code)
                    .selecteds.push(tour[attribute.code]);
              } else {
                filters.push({
                  attributeName: attribute.code,
                  selecteds: [tour[attribute.code]],
                });
              }
            });
          });
          setSelectedFiltersTours(filters);
        }
      });
  }, [filteredMonthsTours.length, filteredYear, selectedFiltersTours]);

  //Atualiza os tours filtrados
  useEffect(() => {
    const filteredItems = tours.filter((tour) => {
      let ok = true;
      selectedFiltersTours.forEach((filter) => {
        if (filter.selecteds.indexOf(tour[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });

      return ok;
    });
    setFilteredTours(filteredItems);
    setLoading(false);
  }, [selectedFiltersTours, reset, tours]);

  useEffect(() => {
    let paxTotal = 0;
    filteredTours.forEach((tour) => {
      if (tour.status !== "Cancelado" && tour.canceled === "0")
        paxTotal += parseInt(tour.totalPax) || 0;
    });
    setIndicators({
      paxTotal: paxTotal,
    });
  }, [filteredTours]);

  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()} min-padding="true">
        <PageHeader>
          <div>
            <Logo src={LogoImg} />
          </div>
          <Indicators>
            <thead>
              <tr>
                <th>Pax Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{indicators.paxTotal}</td>
              </tr>
            </tbody>
          </Indicators>
        </PageHeader>
        <SubTitle>Tours</SubTitle>
        <Title>Listar</Title>
        <DownloadExcelWrapper>
          <DownloadTableExcel
            filename="Lista-de-Tours"
            sheet="tours-list"
            currentTableRef={tableRef.current}
          >
            <Button variant="outlined" style={{ marginBottom: "20px" }}>
              Exportar para Excel
            </Button>
          </DownloadTableExcel>
          <Button
            variant="outlined"
            style={{ marginBottom: "20px", marginLeft: "20px" }}
            onClick={resetFilters}
          >
            Resetar Filtros
          </Button>
          {selectedLines.length > 1 && (
            <Button
              variant="outlined"
              color="error"
              style={{ marginBottom: "20px", marginLeft: "20px" }}
              onClick={cancelSelectedTours}
            >
              Cancelar Selecionadas ({selectedLines.length})
            </Button>
          )}
        </DownloadExcelWrapper>
        <SelectMonths reset={reset}>
          <TextField
            id="currentYear"
            label="Ano"
            variant="outlined"
            name="currentYear"
            type="number"
            value={filteredYear}
            onChange={(e) => {
              changeYear(e.target.value);
            }}
          />
          {months.map((month) => (
            <FormGroup key={month.name}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filteredMonthsTours.includes(month.value)}
                    onChange={() => toggleMonth(month.value)}
                  />
                }
                label={month.name}
              />
            </FormGroup>
          ))}
        </SelectMonths>
        <Tables>
          <Table ref={tableRef} loading={loading.toString()}>
            <thead>
              <tr>
                {columnsNames.map((column, index) => {
                  return (
                    <th
                      onClick={() => openFilter(column.code)}
                      className={`${
                        checkIfColumnIsFiltered(column.code) && !loading
                          ? "active"
                          : ""
                      }`}
                      key={`${column.code}-${index}`}
                    >
                      {column.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredTours.map((tour) => {
                return (
                  <tr
                    key={tour.id}
                    className={selectedLines.includes(tour.id) ? "selected" : ""}
                    onClick={() => {
                      if (selectedLines.includes(tour.id)) {
                        setSelectedLines(selectedLines.filter(id => id !== tour.id));
                      } else {
                        setSelectedLines([...selectedLines, tour.id]);
                      }
                    }}
                  >
                    <td>
                      <Tooltip title="Edit" placement="top">
                        <EditButton onClick={() => editTour(tour.id)} />
                      </Tooltip>
                      <Tooltip title="Delete" placement="top">
                        <DeleteButton
                          onClick={() => deleteTour(tour.id, tour.orderRef)}
                        />
                      </Tooltip>
                    </td>
                    <td>
                      {tour.comments !== "" && (
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
                          <HaveCommentsIcon />
                        </Tooltip>
                      )}
                      {tour.status}
                    </td>
                    <td>{tour.formatedTourDate}</td>
                    <td>{tour.weekDay}</td>
                    <td>{tour.tourHour}</td>
                    <td>{tour.activity}</td>
                    <td>{tour.adicional}</td>
                    <td>{tour.paxAdult}</td>
                    <td>{tour.paxNet}</td>
                    <td>{tour.paxBrazilian}</td>
                    <td>{tour.paxHalf}</td>
                    <td>{tour.paxFree}</td>
                    <td>{tour.totalPax}</td>
                    <td>
                      {tour.type === "regular" ? "" : tour.numberOfGroups}
                    </td>
                    <td>{tour.language}</td>
                    <td>{tour.client}</td>
                    <td>{tour.orderRef}</td>
                    <td>{tour.ceGuide}</td>
                    <td>{tour.currency}</td>
                    <td>
                      {tour.type === "regular"
                        ? formatMoney(tour.totalValue)
                        : "-"}
                    </td>
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
                    <td>{tour.conversationHistory}</td>
                    <td>{tour.country}</td>
                    <td>{tour.dateOfRegistrationFormated}</td>
                    <td>{tour.createdBy}</td>
                    <td>{tour.lastEditBy}</td>
                    <td>
                      <Tooltip title="Edit" placement="top">
                        <EditButton onClick={() => editTour(tour.id)} />
                      </Tooltip>
                      <Tooltip title="Delete" placement="top">
                        <DeleteButton
                          onClick={() => deleteTour(tour.id, tour.orderRef)}
                        />
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Tables>
        <Filter opened={(activeFilter !== false).toString()}>
          <FilterTitle>
            Filtrando{" "}
            {activeFilter &&
              columnsNames.find((filter) => activeFilter === filter.code).name}
          </FilterTitle>
          <CloseFilter onClick={() => closeFilter()} />
          <div status={reset}>
            <div className="filters-actions">
              <span onClick={selectAll}>Selecionar Tudo</span>
              <span onClick={clearAll}>Limpar Tudo</span>
            </div>
            <div className="filters-search">
              <TextField
                id="search"
                label="Pesquisar"
                variant="outlined"
                name="search"
                value={search}
                onChange={searchFilters}
              />
            </div>
            <ul>
              {filtersOptions
                .sort((a, b) => a - b)
                .map((option) => {
                  return (
                    <li key={option}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              id={option}
                              name={option}
                              onChange={(e) =>
                                changeFilter(e, activeFilter, option)
                              }
                              checked={checkFilterIsActive(option)}
                            />
                          }
                          label={
                            activeFilter === "fulfilled"
                              ? option === "1"
                                ? "Yes"
                                : "No"
                              : option
                          }
                        />
                      </FormGroup>
                    </li>
                  );
                })}
            </ul>
          </div>
        </Filter>
      </Content>
    </Main>
  );
};

export default TourList;
