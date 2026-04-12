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

import {
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Button,
  Switch,
} from "@mui/material";

import Sidebar from "../../components/Sidebar";
import {
  EditButton,
  Main,
  ReplayButton,
  SelectMonths,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./canceledlist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  DownloadExcelWrapper,
  HaveCommentsIcon,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { API_URL } from "../../utils/env";

const convertDate = (date) => {
  if (!date) return "";
  date = date.split("/");
  const day = date[0];
  const month = date[1];
  const year = date[2];

  return new Date(`${year}-${month}-${day}`);
};

const CanceledList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(0);
  const [filteredMonths, setFilteredMonths] = useState([null]);
  const [loading, setLoading] = useState(false);
  const [filteredYear, setFilteredYear] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);

  const tableRef = useRef(null);

  const [dateFilters, setDateFilters] = useState({
    dateOfRegistrationFormated: {
      start: "0001-01-02",
      end: "9999-12-08",
    },
  });

  const { sidebarClosed, userName, setSidebarClosed, userPermissions } =
    useContext(StoreContext);

  const columnsNames = [
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
      code: "paxAdult",
      name: "Adulto",
    },
    {
      code: "paxNet",
      name: "NET",
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
      code: "cancelReason",
      name: "Motivo de Cancelamento",
    },
    {
      code: "createdBy",
      name: "Criado por",
    },
    {
      code: "lastEditBy",
      name: "Editado por último por",
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

  const undeleteTour = useCallback(
    async (tourId, orderRef) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: `Tem certeza que deseja descancelar o tour Nº de reserva ${orderRef}`,
        showCancelButton: true,
        confirmButtonText: "Sim",
      }).then(({ ...params }) => {
        if (params.isConfirmed) {
          const body = {
            lastEditBy: userName,
          };
          fetch(`${API_URL}tours/uncancel.php?id=${tourId}`, {
            method: "POST",
            body: JSON.stringify(body),
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Tour descancelado com sucesso!!", "", "success").then(
                () => {
                  return navigate("/listar-tours");
                }
              )
            );
        }
      });
    },
    [userName, userPermissions]
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
        if (options.indexOf(tour[filter]) === -1) options.push(tour[filter]);
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
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
      let newFilteredMonths = filteredMonths;
      if (filteredMonths.includes(month)) {
        newFilteredMonths.splice(newFilteredMonths.indexOf(month), 1);
        setFilteredMonths(newFilteredMonths);
      } else {
        newFilteredMonths.push(month);
      }
      setReset(Math.random());
    },
    [filteredMonths]
  );

  useEffect(() => {
    let year = filteredYear || new Date().getFullYear();
    if (filteredYear === "") setFilteredYear(year);
    let months =
      filteredMonths[0] === null ? [new Date().getMonth() + 1] : filteredMonths;
    if (filteredMonths[0] === null)
      setFilteredMonths([new Date().getMonth() + 1]);
    fetch(
      `${API_URL}tours/list-canceled.php?months=${months.join(
        ","
      )}&year=${year}`,
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

        //Seleciona todos os filtros possíveis
        let filters = [];

        columnsNames.forEach((attribute) => {
          response.forEach((tour) => {
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
  }, [filteredMonths.length, filteredYear]);

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
    setLoading(false);
  }, [selectedFilters, reset, tours, dateFilters]);

  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()} min-padding="true">
        <SubTitle>Tours Cancelados</SubTitle>
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
            onChange={(e) => setFilteredYear(e.target.value)}
          />
          {months.map((month) => (
            <FormGroup key={month.name}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filteredMonths.includes(month.value)}
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
                    className={selectedLine === tour.id ? "selected" : ""}
                    onClick={() =>
                      selectedLine === tour.id
                        ? setSelectedLine(null)
                        : setSelectedLine(tour.id)
                    }
                  >
                    <td>
                      {tour.comments !== "" && (
                        <Tooltip title="Possui Observações" placement="top">
                          <HaveCommentsIcon />
                        </Tooltip>
                      )}
                      {tour.status}
                    </td>
                    <td>{tour.formatedTourDate}</td>
                    <td>{tour.weekDay}</td>
                    <td>{tour.tourHour}</td>
                    <td>{tour.activity}</td>
                    <td>{tour.paxAdult}</td>
                    <td>{tour.paxNet}</td>
                    <td>{tour.paxBrazilian}</td>
                    <td>{tour.paxHalf}</td>
                    <td>{tour.paxFree}</td>
                    <td>{tour.totalPax}</td>
                    <td>{tour.numberOfGroups}</td>
                    <td>{tour.language}</td>
                    <td>{tour.client}</td>
                    <td>{tour.orderRef}</td>
                    <td>{tour.ceGuide}</td>
                    <td>{tour.currency}</td>
                    <td>{tour.type === "privativo" ? tour.totalValue : "-"}</td>
                    <td>{tour.paymentMethod}</td>
                    <td>{tour.clientName}</td>
                    <td>{tour.clientContact}</td>
                    <td>{tour.companionName}</td>
                    <td>{tour.companionContact}</td>
                    <td>{tour.local}</td>
                    <td>{tour.platform}</td>
                    <td>{tour.emailSubject}</td>
                    <td>{tour.comissioned}</td>
                    <td>{tour.comments}</td>
                    <td>{tour.conversationHistory}</td>
                    <td>{tour.country}</td>
                    <td>{tour.dateOfRegistrationFormated}</td>
                    <td>{tour.cancelReason}</td>
                    <td>{tour.createdBy}</td>
                    <td>{tour.lastEditBy}</td>
                    <td>
                      <Tooltip title="Edit" placement="top">
                        <EditButton onClick={() => editTour(tour.id)} />
                      </Tooltip>
                      <Tooltip title="Delete" placement="top">
                        <ReplayButton
                          onClick={() => undeleteTour(tour.id, tour.orderRef)}
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
      </Content>
    </Main>
  );
};

export default CanceledList;
