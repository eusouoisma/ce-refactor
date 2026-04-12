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

import CheckBoxIcon from "@mui/icons-material/CheckBox";

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
  DeleteButton,
  EditButton,
  Main,
  RemoveLateButton,
  SelectMonths,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./financialtourlist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  Indicators,
  DownloadExcelWrapper,
  HaveCommentsIcon,
  HaveChangeRequestsIcon,
  PageHeader,
  Logo,
} from "../../utils/stylesbase";

import LogoImg from "../../assets/logo-ce.png";

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

const FinancialTourList = () => {
  const navigate = useNavigate();

  const MySwal = withReactContent(Swal);

  const {
    sidebarClosed,
    userName,
    setSidebarClosed,
    financialIsFiltered,
    setFinancialIsFiltered,
    selectedFiltersFinancial,
    setSelectedFiltersFinancial,
    filteredMonthsFinancial,
    setFilteredMonthsFinancial,
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

  const filteredMonths = filteredMonthsFinancial;
  const setFilteredMonths = setFilteredMonthsFinancial;

  const columnsNames = [
    {
      code: "actions",
      name: "",
    },
    {
      code: "company",
      name: "Empresa",
    },
    {
      code: "invoiceNumber",
      name: "NF Nº",
    },
    {
      code: "status",
      name: "Status Reserva",
    },
    {
      code: "paymentStatus",
      name: "Status Pagamento",
    },
    {
      code: "accountNumber",
      name: "Número de Conta",
    },
    {
      code: "formatedPaymentDate",
      name: "Pago Em",
    },
    {
      code: "tourDate",
      name: "Data",
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
      code: "client",
      name: "Cliente",
    },
    {
      code: "platform",
      name: "Plataforma",
    },
    {
      code: "orderRef",
      name: "Nº Reserva",
    },
    {
      code: "paymentMethod",
      name: "Pagamento",
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
      code: "netValue",
      name: "Valor NET",
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
      code: "comments",
      name: "Obs Escritório",
    },
    {
      code: "conversationHistory",
      name: "Histórico da Conversa",
    },
    {
      code: "financialComments",
      name: "Obs Financeiro",
    },
    {
      code: "comissioned",
      name: "Comissão",
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
                  filteredMonths[0] === null ? [new Date().getMonth() + 1] : filteredMonths;
                fetch(
                  `${API_URL}tours/list-all-financial.php?months=${months.join(
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
                        parseInt(tour.paxAdult) +
                        parseInt(tour.paxHalf) +
                        parseInt(tour.paxNet) +
                        parseInt(tour.paxFree) +
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
    [userName, userPermissions, selectedLines, filteredTours, filteredYear, filteredMonths]
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
                  filteredMonths[0] === null ? [new Date().getMonth() + 1] : filteredMonths;
                fetch(
                  `${API_URL}tours/list-all-financial.php?months=${months.join(
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
                        parseInt(tour.paxAdult) +
                        parseInt(tour.paxHalf) +
                        parseInt(tour.paxNet) +
                        parseInt(tour.paxFree) +
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
    [userName, userPermissions, filteredYear, filteredMonths]
  );

  const editTour = useCallback((tourId) => {
    navigate(`/editar-tour-financeiro?id=${tourId}`);
  }, []);

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      tours.forEach((tour) => {
        if (options.indexOf(tour[filter]) === -1) {
          let valid = true;
          selectedFiltersFinancial.forEach((selectedFilter) => {
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
    [tours, setActiveFilter, selectedFiltersFinancial]
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
        a?.toLowerCase().includes(search?.toLowerCase())
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
      let newFilters = selectedFiltersFinancial;
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

      setSelectedFiltersFinancial(newFilters);
      setReset(Math.random());
    },
    [selectedFiltersFinancial, activeFilter]
  );

  const checkFilterIsActive = useCallback(
    (option) => {
      if (
        selectedFiltersFinancial.find(
          (item) => item.attributeName === activeFilter
        ) &&
        selectedFiltersFinancial
          .find((item) => item.attributeName === activeFilter)
          .selecteds.indexOf(option) !== -1
      )
        return true;
      else return false;
    },
    [activeFilter, selectedFiltersFinancial, reset]
  );

  const checkIfColumnIsFiltered = useCallback(
    (column) => {
      let filters = [];

      tours.forEach((tour) => {
        if (filters.indexOf(tour[column]) === -1) filters.push(tour[column]);
      });

      const total = filters.length;

      if (
        !selectedFiltersFinancial.find(
          (filter) => filter.attributeName === column
        ) ||
        !selectedFiltersFinancial.find(
          (filter) => filter.attributeName === column
        ).selecteds
      )
        return false;

      return (
        selectedFiltersFinancial.find(
          (filter) => filter.attributeName === column
        ).selecteds.length !== total
      );
    },
    [selectedFiltersFinancial, tours]
  );

  const selectAll = useCallback(() => {
    let newFilters = selectedFiltersFinancial;

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

    setSelectedFiltersFinancial(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFiltersFinancial]);

  const clearAll = useCallback(() => {
    let newFilters = selectedFiltersFinancial;
    newFilters.find(
      (filter) => filter.attributeName === activeFilter
    ).selecteds = [];
    setSelectedFiltersFinancial(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFiltersFinancial]);

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
    setSelectedFiltersFinancial(filters);
  }, [tours]);

  const toggleMonth = useCallback(
    (month) => {
      setFinancialIsFiltered(false);
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

  const changeYear = useCallback((year) => {
    setFilteredYear(year);
    setCurrentYear(year);
    resetFilters();
  }, []);

  const checkInsertedLate = useCallback((tour) => {
    if (tour.lateCheck === "1") return false;
    if (new Date(tour.dateOfRegistration) > new Date(tour.tourDate))
      return true;
    else return false;
  });

  const removeLateCheck = useCallback(
    async (tourId, orderRef) => {
      MySwal.fire({
        title: `Tem certeza que deseja remover a marcação de inserção atrasada para o tour Nº de reserva ${orderRef}`,
        showCancelButton: true,
        confirmButtonText: "Sim",
      }).then(({ ...params }) => {
        if (params.isConfirmed) {
          const body = {
            lastEditBy: userName,
          };
          fetch(`${API_URL}tours/mark-as-late-check.php?id=${tourId}`, {
            method: "POST",
            body: JSON.stringify(body),
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire(
                "Marcação de inserção atrasada removida com sucesso!!",
                "",
                "success"
              ).then(() => {
                return navigate(0);
              })
            );
        }
      });
    },
    [userName]
  );

  useEffect(() => {
    setLoading(true);
    let year = filteredYear;
    let months =
      filteredMonths[0] === null ? [new Date().getMonth() + 1] : filteredMonths;
    if (filteredMonths[0] === null)
      setFilteredMonths([new Date().getMonth() + 1]);
    fetch(
      `${API_URL}tours/list-all-financial.php?months=${months.join(
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
            parseInt(tour.paxAdult) +
            parseInt(tour.paxHalf) +
            parseInt(tour.paxNet) +
            parseInt(tour.paxFree) +
            parseInt(tour.paxBrazilian || 0);
        });
        setTours(response);
        setFilteredTours(response);

        if (!financialIsFiltered) {
          setFinancialIsFiltered(true);
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
          setSelectedFiltersFinancial(filters);
        }
        setLoading(false);
      });
  }, [filteredMonths.length, filteredYear]);

  //Atualiza os tours filtrados
  useEffect(() => {
    const filteredItems = tours.filter((tour) => {
      let ok = true;
      selectedFiltersFinancial.forEach((filter) => {
        if (filter.selecteds.indexOf(tour[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });
      return ok;
    });
    setFilteredTours(filteredItems);
  }, [selectedFiltersFinancial, reset, tours]);

  useEffect(() => {
    let dollarTotal = 0;
    let realTotal = 0;
    let paxTotal = 0;
    filteredTours.forEach((tour) => {
      if (tour.currency === "$")
        dollarTotal += parseFloat(tour.totalValue || 0);
      else if (tour.currency === "R$")
        realTotal += parseFloat(tour.totalValue || 0);
      paxTotal += parseInt(tour.totalPax) || 0;
    });
    setIndicators({
      dollarTotal: dollarTotal,
      realTotal: realTotal,
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
                <th>$ Total</th>
                <th>R$ Total</th>
                <th>Pax Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {parseFloat(indicators.dollarTotal)
                    .toFixed(2)
                    .toString()
                    .replace(".", ",")
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </td>
                <td>
                  {parseFloat(indicators.realTotal)
                    .toFixed(2)
                    .toString()
                    .replace(".", ",")
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </td>
                <td>{indicators.paxTotal}</td>
              </tr>
            </tbody>
          </Indicators>
        </PageHeader>
        <SubTitle>Tours - Financeiro</SubTitle>
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
            onChange={(e) => changeYear(e.target.value)}
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
                      <Tooltip title="Editar" placement="top">
                        <EditButton onClick={() => editTour(tour.id)} />
                      </Tooltip>
                      <Tooltip title="Deletar" placement="top">
                        <DeleteButton
                          onClick={() => deleteTour(tour.id, tour.orderRef)}
                        />
                      </Tooltip>
                      {checkInsertedLate(tour) && (
                        <Tooltip
                          title="Remover Marcação de Atraso"
                          placement="top"
                        >
                          <RemoveLateButton
                            onClick={() =>
                              removeLateCheck(tour.id, tour.orderRef)
                            }
                          />
                        </Tooltip>
                      )}
                    </td>
                    <td
                      className={
                        tour.company?.toLowerCase() === "cobrar cliente"
                          ? "cobrarcliente"
                          : ""
                      }
                    >
                      {tour.comments !== "" && (
                        <Tooltip title="Possui Observações" placement="top">
                          <HaveCommentsIcon />
                        </Tooltip>
                      )}
                      {tour.haveChangeRequests && (
                        <Tooltip
                          title="Possui alterações aguardando aprovação"
                          placement="top"
                        >
                          <HaveChangeRequestsIcon />
                        </Tooltip>
                      )}
                      {tour.company}
                    </td>
                    <td>{tour.invoiceNumber}</td>
                    <td>{tour.status}</td>
                    <td>{tour.paymentStatus}</td>
                    <td>{tour.accountNumber}</td>
                    <td>{tour.formatedPaymentDate}</td>
                    <td>{tour.formatedTourDate}</td>
                    <td>{tour.tourHour}</td>
                    <td>{tour.activity}</td>
                    <td>{tour.client}</td>
                    <td>{tour.platform}</td>
                    <td>{tour.orderRef}</td>
                    <td
                      className={
                        tour.paymentMethod?.toLowerCase() === "cobrar cliente"
                          ? "cobrarcliente"
                          : ""
                      }
                    >
                      {tour.paymentMethod}
                    </td>
                    <td>{tour.currency}</td>
                    <td>{tour.totalValue && formatMoney(tour.totalValue)}</td>
                    <td>{tour.netValue && formatMoney(tour.netValue)}</td>
                    <td>{tour.clientName}</td>
                    <td>{tour.clientContact}</td>
                    <td>{tour.comments}</td>
                    <td>{tour.conversationHistory}</td>
                    <td>{tour.financialComments}</td>
                    <td>{tour.comissioned ? <CheckBoxIcon /> : <></>}</td>
                    <td>{tour.dateOfRegistrationFormated}</td>
                    <td>{tour.createdBy}</td>
                    <td>{tour.lastEditBy}</td>
                    <td>
                      <Tooltip title="Editar" placement="top">
                        <EditButton onClick={() => editTour(tour.id)} />
                      </Tooltip>
                      <Tooltip title="Deletar" placement="top">
                        <DeleteButton
                          onClick={() => deleteTour(tour.id, tour.orderRef)}
                        />
                      </Tooltip>
                      {checkInsertedLate(tour) && (
                        <Tooltip
                          title="Remover Marcação de Atraso"
                          placement="top"
                        >
                          <RemoveLateButton
                            onClick={() =>
                              removeLateCheck(tour.id, tour.orderRef)
                            }
                          />
                        </Tooltip>
                      )}
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

export default FinancialTourList;
