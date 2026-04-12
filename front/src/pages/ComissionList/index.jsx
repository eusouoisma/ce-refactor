import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import LogoImg from "../../assets/logo-ce.png";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  EditButton,
  Main,
  SubTitle,
  Table,
  TableActions,
  Tables,
  Title,
  ComissionRow,
  SelectMonths,
  UnPayButton,
  PayButton,
} from "./comissionlist";

import {
  CloseFilter,
  Content,
  DownloadExcelWrapper,
  Filter,
  FilterTitle,
  Indicators,
  Logo,
  PageHeader,
} from "../../utils/stylesbase";
import {
  FormGroup,
  FormControlLabel,
  Tooltip,
  Button,
  Switch,
  TextField,
  Checkbox,
} from "@mui/material";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { API_URL } from "../../utils/env";

const columnsNames = [
  {
    code: "orderRef",
    name: "Nº Pedido",
  },
  {
    code: "tourDateFormated",
    name: "Data do Tour",
  },
  {
    code: "comissionersName",
    name: "Nome do comissionado",
  },
  {
    code: "comissionersContact",
    name: "Contato do comissionado",
  },
  {
    code: "comissionCurrency",
    name: "Moeda",
  },
  {
    code: "comissionPrice",
    name: "Valor",
  },
  {
    code: "comissionPaid",
    name: "Pago?",
  },
  {
    code: "createdBy",
    name: "Criado por",
  },
  {
    code: "lastEditBy",
    name: "Editado por último por",
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

const ComissionsList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [comissions, setComissions] = useState([]);
  const [filteredComissions, setFilteredComissions] = useState([]);
  const [reset, setReset] = useState(0);
  const [filteredYear, setFilteredYear] = useState("");
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLines, setSelectedLines] = useState([]);
  const [indicators, setIndicators] = useState([]);

  const {
    sidebarClosed,
    setSidebarClosed,
    userName,
    comissionsIsFiltered,
    setComissionsIsFiltered,
    selectedFiltersComissions,
    setSelectedFiltersComissions,
    filteredMonthsComissions: filteredMonths,
    setFilteredMonthsComissions: setFilteredMonths,
    setResetProvider,
    userPermissions,
  } = useContext(StoreContext);

  const tableRef = useRef(null);

  const deleteComission = useCallback(
    (comissionId, orderRef) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: `Tem certeza que deseja remover a comissão relacionada ao pedido ${orderRef}?`,
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}comissions/delete.php?id=${comissionId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Comissão removida com sucesso!!", "", "success").then(
                () => {
                  return navigate(0);
                }
              )
            );
        }
      });
    },
    [userPermissions]
  );

  const editComission = useCallback((comissionId) => {
    navigate(`/editar-comissao?id=${comissionId}`);
  }, []);

  const payComission = useCallback(
    async (comissionId, option) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      if (option === "pay") {
        fetch(
          `${API_URL}comissions/pay.php?id=${comissionId}&lastEditBy=${userName}`,
          {
            method: "POST",
          }
        )
          .then((response) => response.json())
          .then((response) =>
            Swal.fire("Comissão marcada como paga!!", "", "success").then(
              () => {
                return navigate(0);
              }
            )
          );
      } else if (option === "unpay") {
        fetch(
          `${API_URL}comissions/unpay.php?id=${comissionId}&lastEditBy=${userName}`,
          {
            method: "POST",
          }
        )
          .then((response) => response.json())
          .then((response) =>
            Swal.fire("Comissão marcada como não paga!!", "", "success").then(
              () => {
                return navigate(0);
              }
            )
          );
      }
    },
    [userName, userPermissions]
  );

  const toggleMonth = useCallback(
    (month) => {
      let newFilteredMonths = filteredMonths;
      if (filteredMonths.includes(month)) {
        newFilteredMonths.splice(newFilteredMonths.indexOf(month), 1);
        setFilteredMonths(newFilteredMonths);
      } else {
        newFilteredMonths.push(month);
        setFilteredMonths(newFilteredMonths);
      }
      setReset(Math.random());
      setResetProvider(Math.random());
    },
    [filteredMonths]
  );

  useEffect(() => {
    setSidebarClosed(true);
    let year = filteredYear || new Date().getFullYear();
    if (filteredYear === "") setFilteredYear(year);
    let months =
      filteredMonths[0] === null ? [new Date().getMonth() + 1] : filteredMonths;
    if (filteredMonths[0] === null)
      setFilteredMonths([new Date().getMonth() + 1]);
    fetch(
      `${API_URL}comissions/list-all.php?months=${months.join(
        ","
      )}&year=${year}`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((response) => {
        setComissions(response);
        setFilteredComissions(response);

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

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      comissions.forEach((comission) => {
        if (options.indexOf(comission[filter]) === -1)
          options.push(comission[filter]);
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [comissions, setActiveFilter]
  );

  const searchFilters = useCallback(
    (e) => {
      const search = e.target.value;
      const filter = activeFilter;
      setSearch(search);
      let options = [];
      comissions.forEach((comission) => {
        if (options.indexOf(comission[filter]) === -1)
          options.push(comission[filter]);
      });
      options = options.filter((a) =>
        a.toLowerCase().includes(search.toLowerCase())
      );
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [activeFilter, comissions]
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

      comissions.forEach((comission) => {
        if (filters.indexOf(comission[column]) === -1)
          filters.push(comission[column]);
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
    [selectedFilters, comissions]
  );

  const selectAll = useCallback(() => {
    let newFilters = selectedFilters;

    let filter = newFilters.find(
      (filter) => filter.attributeName === activeFilter
    );

    comissions.forEach((comission) => {
      if (filter.selecteds.indexOf(comission[activeFilter]) === -1)
        filter.selecteds.push(comission[activeFilter]);
    });

    newFilters.find(
      (filter) => filter.attributeName === activeFilter
    ).selecteds = filter.selecteds;

    setSelectedFilters(newFilters);
    setReset(Math.random());
  }, [activeFilter, selectedFilters, comissions]);

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
      comissions.forEach((comissions) => {
        if (filters.find((item) => item.attributeName === attribute.code)) {
          if (
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.indexOf(comissions[attribute.code]) === -1
          )
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.push(comissions[attribute.code]);
        } else {
          filters.push({
            attributeName: attribute.code,
            selecteds: [comissions[attribute.code]],
          });
        }
      });
    });
    setSelectedFilters(filters);
  }, [comissions]);

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

  //Atualiza as comissions filtradas
  useEffect(() => {
    const filteredItems = comissions.filter((comission) => {
      let ok = true;
      selectedFilters.forEach((filter) => {
        if (filter.selecteds.indexOf(comission[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });

      return ok;
    });
    setFilteredComissions(filteredItems);
  }, [selectedFilters, reset, comissions]);

  useEffect(() => {
    let totalReal = 0;
    let totalDollar = 0;
    filteredComissions.forEach((comission) => {
      if (comission.comissionCurrency === "R$") {
        totalReal += parseFloat(comission.comissionPrice || 0);
      } else if (comission.comissionCurrency === "$") {
        totalDollar += parseFloat(comission.comissionPrice || 0);
      }
    });
    setIndicators({
      totalReal: totalReal,
      totalDollar: totalDollar,
    });
  }, [filteredComissions]);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <PageHeader>
          <div>
            <Logo src={LogoImg} />
          </div>
          <Indicators>
            <thead>
              <tr>
                <th>R$ Total</th>
                <th>$ Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{indicators.totalReal}</td>
                <td>{indicators.totalDollar}</td>
              </tr>
            </tbody>
          </Indicators>
        </PageHeader>
        <SubTitle>Comissões</SubTitle>
        <Title>Listar</Title>
        <DownloadExcelWrapper>
          <DownloadTableExcel
            filename="Comission-List"
            sheet="comission-list"
            currentTableRef={tableRef.current}
          >
            <Button variant="outlined" style={{ marginBottom: "20px" }}>
              Exportar para excel
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
          <Table ref={tableRef}>
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
              {filteredComissions.map((comission) => {
                return (
                  <ComissionRow
                    key={comission.id}
                    paid={(comission.comissionPaid === "1").toString()}
                    className={`${
                      selectedLines.indexOf(comission.id) !== -1
                        ? "selected"
                        : ""
                    } `}
                    onClick={() => toggleSelectedLine(comission.id)}
                  >
                    <td>{comission.orderRef}</td>
                    <td>{comission.tourDateFormated}</td>
                    <td>{comission.comissionersName}</td>
                    <td>{comission.comissionersContact}</td>
                    <td>{comission.comissionCurrency}</td>
                    <td>{comission.comissionPrice}</td>
                    <td>
                      {comission.comissionPaid === "1" ? (
                        <CheckBoxIcon />
                      ) : (
                        <CheckBoxOutlineBlankIcon />
                      )}
                    </td>
                    <td>{comission.createdBy}</td>
                    <td>{comission.lastEditBy}</td>
                  </ComissionRow>
                );
              })}
            </tbody>
          </Table>
          <TableActions>
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredComissions.map((comission) => {
                return (
                  <tr key={comission.id}>
                    <td>
                      <Tooltip placement="top" title="Edit">
                        <EditButton
                          onClick={() => editComission(comission.id)}
                        />
                      </Tooltip>
                    </td>
                    <td>
                      <Tooltip placement="top" title="Delete">
                        <DeleteButton
                          onClick={() =>
                            deleteComission(comission.id, comission.orderRef)
                          }
                        />
                      </Tooltip>
                    </td>
                    <td>
                      {comission.comissionPaid === "1" ? (
                        <Tooltip title="Marcar como Não Pago" placement="top">
                          <UnPayButton
                            onClick={() => payComission(comission.id, "unpay")}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Marcar como Pago" placement="top">
                          <PayButton
                            onClick={() => payComission(comission.id, "pay")}
                          />
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableActions>
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
        </Filter>
      </Content>
    </Main>
  );
};

export default ComissionsList;
