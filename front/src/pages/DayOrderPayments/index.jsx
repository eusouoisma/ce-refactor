import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";

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
} from "./dayorderpayments";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  DownloadExcelWrapper,
  Overlay,
  ClientsModal,
  ClientsModalTitle,
  CloseClientsModal,
  ClientsModalList,
  PageHeader,
  Logo,
  Indicators,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { DownloadTableExcel } from "react-export-table-to-excel";

import LogoImg from "../../assets/logo-ce.png";
import { formatMoney } from "../../utils/functions";
import { API_URL } from "../../utils/env";
import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";

const convertDate = (date) => {
  if (!date) return "";
  date = date.split("/");
  const day = date[0];
  const month = date[1];
  const year = date[2];

  return new Date(`${year}-${month}-${day}`);
};

const MoneyInput = forwardRef((props, ref) => {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      onValueChange={(values) => {
        onChange({
          target: { name: other.name, value: values.value },
        });
      }}
      getInputRef={ref}
      value={other.value}
      allowLeadingZeros={false}
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale={true}
      decimalSeparator=","
      allowedDecimalSeparators={["."]}
      thousandSeparator="."
      isAllowed={(values) => {
        if (values.value.length > 9) return false;
        return true;
      }}
    />
  );
});

function convertHoursToMinutes(hora) {
  let [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function subHours(hora1, hora2) {
  let minutos1 = convertHoursToMinutes(hora1);
  let minutos2 = convertHoursToMinutes(hora2);

  if (!minutos1 || !minutos2) return "";

  let diferencaMinutos = minutos1 - minutos2;

  let horas = Math.floor(diferencaMinutos / 60);
  let minutos = diferencaMinutos % 60;

  let resultado = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0"
  )}`;
  return resultado;
}

const DayOrderPayments = () => {
  const {
    sidebarClosed,
    setSidebarClosed,
    currentYear,
    setCurrentYear,
    filteredMonthsPayments: filteredMonthsTours,
    setFilteredMonthsPayments: setFilteredMonthsTours,
    paymentsIsFiltered: isFiltered,
    setPaymentsIsFiltered: setIsFiltered,
    selectedFiltersPayments: selectedFilters,
    setSelectedFiltersPayments: setSelectedFilters,
    userPermissions,
  } = useContext(StoreContext);

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filteredYear, setFilteredYear] = useState(currentYear);
  const [selectedLines, setSelectedLines] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingComments, setEditingComments] = useState(null);
  const [indicatorsValues, setIndicatorsValues] = useState({});

  const tableRef = useRef(null);

  const [dateFilters, setDateFilters] = useState({
    dateOfRegistrationFormated: {
      start: "0001-01-02",
      end: "9999-12-08",
    },
  });

  const columnsNames = [
    {
      code: "formatedDate",
      name: "Data",
    },
    {
      code: "function",
      name: "Função",
    },
    {
      code: "employeeName",
      name: "Nome",
    },
    {
      code: "activity",
      name: "Atividade",
    },
    {
      code: "workedTime",
      name: "Tempo trabalhado",
    },
    {
      code: "value",
      name: "Valor",
    },
    {
      code: "paymentComments",
      name: "OBS",
    },
    {
      code: "paymentDateFormated",
      name: "Data do Pagamento",
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
      payments.forEach((payment) => {
        console.log("payment: ", payment);
        console.log("filter: ", filter);
        if (options.indexOf(payment[filter]) === -1)
          options.push(payment[filter]);
      });
      console.log("options: ", options);
      if (filter === "value")
        options = options.sort((a, b) => parseFloat(a) - parseFloat(b));
      else options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [payments, setActiveFilter]
  );

  const searchFilters = useCallback(
    (e) => {
      const search = e.target.value;
      const filter = activeFilter;
      setSearch(search);
      let options = [];
      payments.forEach((payment) => {
        if (options.indexOf(payment[filter]) === -1)
          options.push(payment[filter]);
      });
      options = options.filter((a) =>
        a.toLowerCase().includes(search.toLowerCase())
      );
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [activeFilter, payments]
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

      payments.forEach((payment) => {
        if (filters.indexOf(payment[column]) === -1)
          filters.push(payment[column]);
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
    [selectedFilters, payments]
  );

  const selectAll = useCallback(() => {
    let newFilters = selectedFilters;

    let filter = newFilters.find(
      (filter) => filter.attributeName === activeFilter
    );

    payments.forEach((payment) => {
      if (filter.selecteds.indexOf(payment[activeFilter]) === -1)
        filter.selecteds.push(payment[activeFilter]);
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
      payments.forEach((payment) => {
        if (filters.find((item) => item.attributeName === attribute.code)) {
          if (
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.indexOf(payment[attribute.code]) === -1
          )
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.push(payment[attribute.code]);
        } else {
          filters.push({
            attributeName: attribute.code,
            selecteds: [payment[attribute.code]],
          });
        }
      });
    });
    setSelectedFilters(filters);
  }, [payments]);

  const toggleMonth = useCallback(
    (month) => {
      setIsFiltered(false);
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

  const toggleSelectedLine = useCallback(
    (paymentId) => {
      let newSelectedLines = selectedLines;
      if (newSelectedLines.indexOf(paymentId) === -1)
        newSelectedLines.push(paymentId);
      else newSelectedLines.splice(newSelectedLines.indexOf(paymentId), 1);
      setSelectedLines(newSelectedLines);
      setReset(Math.random());
    },
    [selectedLines]
  );

  const openEditPayment = useCallback((id) => {
    setEditingPayment(id);
  });

  const openEditComments = useCallback((id) => {
    setEditingComments(id);
  });

  const onchangePaymentNewValue = useCallback(
    (paymentId, value) => {
      let newPayments = filteredPayments;
      newPayments.find((payment) => payment.paymentId === paymentId).value =
        value;
    },
    [filteredPayments]
  );

  const submitChangePayment = useCallback(
    (id, value) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/change-individual-payment.php`, {
        method: "POST",
        body: JSON.stringify({
          paymentId: id,
          paymentNewValue: value,
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.error) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          } else {
            Swal.fire("Valor atualizado!", "", "success");
            setEditingPayment(false);
          }
        });
    },
    [userPermissions]
  );

  const onchangePaymentNewComments = useCallback(
    (paymentId, value) => {
      let newPayments = filteredPayments;
      newPayments.find(
        (payment) => payment.paymentId === paymentId
      ).paymentComments = value;
    },
    [filteredPayments]
  );

  const submitChangeComments = useCallback(
    (id, value) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/change-individual-comments.php`, {
        method: "POST",
        body: JSON.stringify({
          paymentId: id,
          commentsNewValue: value,
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.error) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          } else {
            Swal.fire("Comentário atualizado!", "", "success");
            setEditingComments(false);
          }
        });
    },
    [userPermissions]
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
      `${API_URL}day-order/list-all-payments.php?months=${months.join(
        ","
      )}&year=${year}`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((response) => {
        let transformedData = response;
        setLoading(true);
        setPayments(transformedData);
        setFilteredPayments(transformedData);

        let totalPaymentsValues = transformedData.reduce(
          (acumulador, objetoAtual) => {
            return acumulador + parseFloat(objetoAtual.value);
          },
          0
        );

        setIndicatorsValues({ value: totalPaymentsValues });

        if (!isFiltered) {
          setIsFiltered(true);

          //Seleciona todos os filtros possíveis
          let filters = [];

          columnsNames.forEach((attribute) => {
            transformedData.forEach((payment) => {
              if (
                filters.find((item) => item.attributeName === attribute.code)
              ) {
                if (
                  filters
                    .find((item) => item.attributeName === attribute.code)
                    .selecteds.indexOf(payment[attribute.code]) === -1
                )
                  filters
                    .find((item) => item.attributeName === attribute.code)
                    .selecteds.push(payment[attribute.code]);
              } else {
                filters.push({
                  attributeName: attribute.code,
                  selecteds: [payment[attribute.code]],
                });
              }
            });
          });
          setSelectedFilters(filters);
        }
      });
  }, [filteredMonthsTours.length, filteredYear]);

  //Atualiza os pagamentos filtrados
  useEffect(() => {
    const filteredItems = payments.filter((payment) => {
      let ok = true;
      selectedFilters.forEach((filter) => {
        if (filter.selecteds.indexOf(payment[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });
      return ok;
    });

    let totalPaymentsValues = filteredItems.reduce(
      (acumulador, objetoAtual) => {
        return acumulador + parseFloat(objetoAtual.value);
      },
      0
    );

    setIndicatorsValues({ value: totalPaymentsValues });

    setFilteredPayments(filteredItems);
    setLoading(false);
  }, [selectedFilters, reset, payments, dateFilters]);

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
                <th>Pagamento Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R$ {indicatorsValues.value?.toFixed(2)}</td>
              </tr>
            </tbody>
          </Indicators>
        </PageHeader>
        <SubTitle>Pagamentos</SubTitle>
        <Title>Listar</Title>
        <DownloadExcelWrapper>
          <DownloadTableExcel
            filename="Lista-de-Pagamentos"
            sheet="payments-list"
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
              {filteredPayments.map((payment) => {
                return (
                  <tr
                    key={payment.paymentId}
                    className={`${
                      selectedLines.indexOf(payment.paymentId) !== -1
                        ? "selected"
                        : ""
                    } `}
                    onClick={() => toggleSelectedLine(payment.paymentId)}
                  >
                    <td>{payment.formatedDate}</td>
                    <td>{payment.function}</td>
                    <td>{payment.employeeName}</td>
                    <td>
                      {payment.activity}
                      {payment.tourHour != null ? ` - ${payment.tourHour}` : ""}
                    </td>
                    <td>{subHours(payment.departure, payment.arrival)}</td>
                    <td onClick={() => openEditPayment(payment.paymentId)}>
                      {editingPayment === payment.paymentId ? (
                        <TextField
                          id={`edit-payment-${payment.paymentId}`}
                          variant="outlined"
                          name={`edit-payment-${payment.paymentId}`}
                          type="text"
                          defaultValue={payment.value}
                          onKeyPress={(event) => {
                            if (event.key === "Enter") {
                              submitChangePayment(
                                payment.paymentId,
                                payment.value
                              );
                            }
                          }}
                          onBlur={() => {
                            submitChangePayment(
                              payment.paymentId,
                              payment.value
                            );
                          }}
                          onChange={(e) =>
                            onchangePaymentNewValue(
                              payment.paymentId,
                              e.target.value
                            )
                          }
                          InputProps={{
                            inputComponent: MoneyInput,
                          }}
                          inputProps={{
                            prefix: "R$ ",
                          }}
                        />
                      ) : (
                        `R$ ${formatMoney(payment.value)}`
                      )}
                    </td>
                    <td onClick={() => openEditComments(payment.paymentId)}>
                      {editingComments === payment.paymentId ? (
                        <TextField
                          id={`edit-paymentComments-${payment.paymentId}`}
                          variant="outlined"
                          name={`edit-paymentComments-${payment.paymentId}`}
                          type="text"
                          defaultValue={payment.paymentComments}
                          onKeyPress={(event) => {
                            if (event.key === "Enter") {
                              submitChangeComments(
                                payment.paymentId,
                                payment.paymentComments
                              );
                            }
                          }}
                          onBlur={() => {
                            submitChangeComments(
                              payment.paymentId,
                              payment.paymentComments
                            );
                          }}
                          onChange={(e) =>
                            onchangePaymentNewComments(
                              payment.paymentId,
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        payment.paymentComments
                      )}
                    </td>
                    <td>{payment.paymentDateFormated}</td>
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
                            activeFilter === "value"
                              ? `R$ ${formatMoney(option)}`
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

export default DayOrderPayments;
