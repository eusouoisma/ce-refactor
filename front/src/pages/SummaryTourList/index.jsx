import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";
import CommentIcon from '@mui/icons-material/Comment';

import Swal from "sweetalert2";

import {
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Switch,
} from "@mui/material";

import Sidebar from "../../components/Sidebar";
import {
  Main,
  SelectMonths,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./summarytourlist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  Indicators,
  DownloadExcelWrapper,
  Overlay,
  ClientsModal,
  ClientsModalTitle,
  CloseClientsModal,
  ClientsModalList,
  PageHeader,
  Logo,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { DownloadTableExcel } from "react-export-table-to-excel";

import LogoImg from "../../assets/logo-ce.png";
import { API_URL } from "../../utils/env";

const convertDate = (date) => {
  if (!date) return "";
  date = date.split("/");
  const day = date[0];
  const month = date[1];
  const year = date[2];

  return new Date(`${year}-${month}-${day}`);
};

const SummaryTourList = () => {
  const {
    sidebarClosed,
    setSidebarClosed,
    currentYear,
    setCurrentYear,
    filteredMonthsTours,
    setFilteredMonthsTours,
  } = useContext(StoreContext);

  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientsModalIsOpened, setClientsModalIsOpened] = useState(false);
  const [selectedTourToListClients, setSelectedTourToListClients] =
    useState(null);
  const [editingNumberOfGroups, setEditingNumberOfGroups] = useState();
  const [filteredYear, setFilteredYear] = useState(currentYear);
  const [selectedLines, setSelectedLines] = useState([]);

  const tableRef = useRef(null);

  const [dateFilters, setDateFilters] = useState({
    dateOfRegistrationFormated: {
      start: "0001-01-02",
      end: "9999-12-08",
    },
  });

  const columnsNames = [
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
      code: "paxTotal",
      name: "Total Pax",
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
      code: "guides",
      name: "Guia CE",
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

  const onlyUnique = (value, index, array) => {
    return array.indexOf(value) === index;
  };

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

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      tours.forEach((tour) => {
        if (options.indexOf(tour[filter]) === -1) options.push(tour[filter]);
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
      // if(filter === "guides"){
      //   options = [...new Set(options.flatMap(option => option.split(',').map(n => n.trim())).filter(Boolean))];
      //   options.push("");
      // }
      setFiltersOptions(options);
    },
    [tours, setActiveFilter]
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
      let newFilters = selectedFilters;
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

      setSelectedFilters(newFilters);
      setReset(Math.random());
    },
    [selectedFilters, activeFilter]
  );

  const changeDateFilter = useCallback(
    (e, filter, id) => {
      let newDateFilters = dateFilters;
      newDateFilters[filter][id] = e.target.value;
      setDateFilters(newDateFilters);
      setReset(Math.random());
    },
    [dateFilters]
  );

  const checkFilterIsActive = useCallback(
    (option) => {
      if (
        selectedFilters.find((item) => item.attributeName === activeFilter) &&
        selectedFilters
          .find((item) => item.attributeName === activeFilter)
          .selecteds.indexOf(option) !== -1
      )
        return true;
      else return false;
    },
    [activeFilter, selectedFilters, reset]
  );

  const checkIfColumnIsFiltered = useCallback(
    (column) => {
      let filters = [];

      tours.forEach((tour) => {
        if (filters.indexOf(tour[column]) === -1) filters.push(tour[column]);
      });

      const total = filters.length;

      if (
        !selectedFilters.find((filter) => filter.attributeName === column) ||
        !selectedFilters.find((filter) => filter.attributeName === column)
          .selecteds
      )
        return false;

      return (
        selectedFilters.find((filter) => filter.attributeName === column)
          .selecteds.length !== total
      );
    },
    [selectedFilters]
  );

  const selectAll = useCallback(() => {
    let newFilters = selectedFilters;

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

    setSelectedFilters(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFilters]);

  const clearAll = useCallback(() => {
    let newFilters = selectedFilters;
    newFilters.find(
      (filter) => filter.attributeName === activeFilter
    ).selecteds = [];
    setSelectedFilters(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFilters]);

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
    setSelectedFilters(filters);
  }, [tours]);

  const toggleMonth = useCallback(
    (month) => {
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

  const listClients = useCallback((tour) => {
    fetch(
      `${API_URL}/tours/list-clients-by-date-and-hour.php?date=${tour.tourDate}&hour=${tour.tourHour}`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((response) => {
        let tourAndClients = tour;
        tourAndClients.clients = response.clients;
        setSelectedTourToListClients(tourAndClients);
        setClientsModalIsOpened(true);
        setReset(Math.random());
      });
  }, []);

  const openEditNumberOfGroups = useCallback((id) => {
    setEditingNumberOfGroups(id);
  }, []);

  const changeNumberOfGroups = useCallback(
    (id, type, date, hour, activity, groups) => {
      let newFilteredTours = filteredTours;
      newFilteredTours.find((tour) => tour.id === id).groups = groups;
      setFilteredTours(newFilteredTours);

      const body = {
        id,
        type,
        date,
        hour,
        activity,
        groups,
      };
      fetch(`${API_URL}numberOfGroups/create.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then()
        .catch((e) => {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Algo deu errado na atualização do número de grupos!",
          });
        });

      //Seleciona todos os filtros possíveis
      let filters = [];

      columnsNames.forEach((attribute) => {
        newFilteredTours.forEach((tour) => {
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
      setSelectedFilters(filters);

      setReset(Math.random());
    },
    [filteredTours, columnsNames]
  );

  const changeYear = useCallback((year) => {
    setFilteredYear(year);
    setCurrentYear(year);
    resetFilters();
  }, []);

  const toggleSelectedLine = useCallback(
    (tourId) => {
      let newSelectedLines = selectedLines;
      if (newSelectedLines.indexOf(tourId) === -1)
        newSelectedLines.push(tourId);
      else newSelectedLines.splice(newSelectedLines.indexOf(tourId), 1);
      setSelectedLines(newSelectedLines);
      setReset(Math.random());
    },
    [selectedLines]
  );

  useEffect(() => {
    let year = filteredYear || new Date().getFullYear();
    if (filteredYear === "") setFilteredYear(year);
    let months =
      filteredMonthsTours[0] === null
        ? [new Date().getMonth() + 1]
        : filteredMonthsTours;
    if (filteredMonthsTours[0] === null)
      setFilteredMonthsTours([new Date().getMonth() + 1]);
    fetch(
      `${API_URL}tours/list-all-summary.php?months=${months.join(
        ","
      )}&year=${year}`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((response) => {
        let transformedData = response.map((data) => ({
            ...data,
            weekDay: getWeekDay(data.formatedTourDate)
        }));

        // Agrupar tours duplicados para Tour 1 com date "2025-10-29" e hour "15:00"
        const processedData = [];
        let firstDuplicateFound = false;
        
        transformedData.forEach((tour) => {
          // Verificar se é tour duplicado
          const isDuplicate = tour.activity === "Tour 1" && 
                             tour.tourDate === "2025-10-29" && 
                             tour.tourHour === "15:00";
          
          if (isDuplicate) {
            // Primeira ocorrência - criar tour consolidado
            if (!firstDuplicateFound) {
              // Encontrar todos os tours duplicados
              const toursToConsolidate = transformedData.filter(t => 
                t.activity === "Tour 1" && 
                t.tourDate === "2025-10-29" && 
                t.tourHour === "15:00"
              );
              
              // Somar os pax
              const totalPax = toursToConsolidate.reduce((sum, t) => sum + (parseInt(t.paxTotal) || 0), 0);
              
              // Pegar o último tour para language e client
              const lastTour = toursToConsolidate[toursToConsolidate.length - 1];
              
              // Criar tour consolidado
              const consolidatedTour = {
                ...lastTour,
                paxTotal: totalPax.toString()
              };
              
              processedData.push(consolidatedTour);
              firstDuplicateFound = true;
            }
            // Se já processamos o consolidado, não adicionar os outros duplicados
          } else {
            processedData.push(tour);
          }
        });

        setTours(processedData);
        setFilteredTours(processedData);

        //Seleciona todos os filtros possíveis
        let filters = [];

        columnsNames.forEach((attribute) => {
          processedData.forEach((tour) => {
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
        setSelectedFilters(filters);
      });
  }, [filteredMonthsTours.length, filteredYear]);

  //Atualiza os tours filtrados
  useEffect(() => {
    const filteredItems = tours.filter((tour) => {
      let ok = true;
      selectedFilters.forEach((filter) => {
        if (filter.selecteds.indexOf(tour[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });
      if (
        convertDate(tour.dateOfRegistrationFormated) <
          new Date(dateFilters.dateOfRegistrationFormated.start) ||
        convertDate(tour.dateOfRegistrationFormated) >
          new Date(dateFilters.dateOfRegistrationFormated.end)
      ) {
        ok = false;
      }

      return ok;
    });
    setFilteredTours(filteredItems);
  }, [selectedFilters, reset, tours, dateFilters]);

  useEffect(() => {
    let paxTotal = 0;
    filteredTours.forEach((tour) => {
      paxTotal += parseInt(tour.paxTotal) || 0;
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
                {columnsNames.map((column) => {
                  return (
                    <th
                      onClick={() => openFilter(column.code)}
                      className={`${
                        checkIfColumnIsFiltered(column.code) ? "active" : ""
                      }`}
                      key={column.code}
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
                    className={`${
                      selectedLines.indexOf(tour.id) !== -1
                        ? "selected"
                        : tour.status
                    } `}
                    onClick={() => toggleSelectedLine(tour.id)}
                  >
                    <td>{tour.formatedTourDate}</td>
                    <td>{tour.weekDay}</td>
                    <td>{tour.tourHour}</td>
                    <td>{tour.activity}</td>
                    <td>
                      {tour.status === "Cancelado"
                        ? tour.type === "privativo"
                          ? tour.paxTotalInitial
                          : "-"
                        : tour.paxTotal}
                    </td>
                    <td
                      className="numberOfGroups"
                      onClick={() => openEditNumberOfGroups(tour.id)}
                    >
                      {editingNumberOfGroups === tour.id ? (
                        <TextField
                          id={`edit-number-of-groups-${tour.id}`}
                          variant="outlined"
                          name={`edit-number-of-groups-${tour.id}`}
                          type="text"
                          defaultValue={
                            tour.groups || Math.ceil(tour.paxTotal / 30)
                          }
                          onChange={(e) =>
                            changeNumberOfGroups(
                              tour.id,
                              tour.type,
                              tour.tourDate,
                              tour.tourHour,
                              tour.activity,
                              e.target.value
                            )
                          }
                          onKeyPress={(event) => {
                            if (event.key === "Enter") {
                              openEditNumberOfGroups(null);
                            }
                          }}
                        />
                      ) : (
                        tour.groups || Math.ceil(tour.paxTotal / 30)
                      )}
                    </td>
                    <td>{tour.language}</td>
                    <td onClick={() => listClients(tour)}>
                      {tour.type === "regular" ? "Ver" : tour.client}
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
                              left: '0px',
                              cursor: 'help'
                            }} 
                          />
                        </Tooltip>
                      )}
                      {tour.guides}
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
          {activeFilter === "dateOfRegistrationFormated" ? (
            <div className="date-filter">
              <TextField
                id={`start-${activeFilter}`}
                label="Start Date"
                variant="outlined"
                name={`start-${activeFilter}`}
                type="date"
                value={dateFilters.dateOfRegistrationFormated.start}
                onChange={(e) => changeDateFilter(e, activeFilter, "start")}
              />
              <TextField
                id={`end-${activeFilter}`}
                label="End Date"
                variant="outlined"
                name={`end-${activeFilter}`}
                type="date"
                value={dateFilters.dateOfRegistrationFormated.end}
                onChange={(e) => changeDateFilter(e, activeFilter, "end")}
              />
            </div>
          ) : (
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
                {filtersOptions.map((option) => {
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
          )}
        </Filter>
        <Overlay opened={clientsModalIsOpened.toString()}>
          {selectedTourToListClients && (
            <ClientsModal
              status={reset}
              opened={clientsModalIsOpened.toString()}
            >
              <ClientsModalTitle>
                Clientes do tour {selectedTourToListClients.activity} dia{" "}
                {selectedTourToListClients.formatedTourDate} hora{" "}
                {selectedTourToListClients.tourHour}
              </ClientsModalTitle>
              <ClientsModalList>
                {selectedTourToListClients.clients.map((client) => (
                  <li key={client.client}>
                    Cliente: {client.client}, Guia: {client.companionName},
                    Contato do Guia: {client.companionContact}
                  </li>
                ))}
              </ClientsModalList>
              <CloseClientsModal
                onClick={() => setClientsModalIsOpened(false)}
              />
            </ClientsModal>
          )}
        </Overlay>
      </Content>
    </Main>
  );
};

export default SummaryTourList;
