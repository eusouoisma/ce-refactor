import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import { DownloadTableExcel } from "react-export-table-to-excel";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import {
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Button,
} from "@mui/material";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  EditButton,
  Main,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./customerslist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  DownloadExcelWrapper,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { API_URL } from "../../utils/env";

const CustomersList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filtersOptions, setFiltersOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(0);

  const tableRef = useRef(null);

  const { sidebarClosed, userName, setSidebarClosed, userPermissions } =
    useContext(StoreContext);

  const columnsNames = [
    {
      code: "customerName",
      name: "Nome do Cliente",
    },
    {
      code: "customerType",
      name: "Tipo",
    },
    {
      code: "contactName",
      name: "Nome do Contato",
    },
    {
      code: "contactContact",
      name: "Telefone do Contato",
    },
    {
      code: "contactOffice",
      name: "Cargo do Contato",
    },
    {
      code: "contactEmail",
      name: "Email do Contato",
    },
    {
      code: "actions",
      name: "",
    },
  ];

  const deleteCustomer = useCallback(
    (customerId, customerName) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: `Tem certeza que deseja remover o contato ${customerName}?`,
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}customers/delete.php?id=${customerId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Cliente removido com sucesso!!", "", "success").then(
                () => {
                  return navigate(0);
                }
              )
            );
        }
      });
    },
    [userName, userPermissions]
  );

  const editCustomer = useCallback((customerId) => {
    navigate(`/editar-cliente?id=${customerId}`);
  }, []);

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      customers.forEach((customer) => {
        if (options.indexOf(customer[filter]) === -1) {
          let valid = true;
          selectedFilters.forEach((selectedFilter) => {
            if (
              selectedFilter.selecteds.indexOf(
                customer[selectedFilter.attributeName]
              ) === -1 &&
              selectedFilter.attributeName !== filter
            )
              valid = false;
          });
          if (valid) options.push(customer[filter]);
        }
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [customers, setActiveFilter]
  );

  const searchFilters = useCallback(
    (e) => {
      const search = e.target.value;
      const filter = activeFilter;
      setSearch(search);
      let options = [];
      customers.forEach((customer) => {
        if (options.indexOf(customer[filter]) === -1)
          options.push(customer[filter]);
      });
      options = options.filter(
        (a) => a && a.toLowerCase().includes(search.toLowerCase())
      );
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [activeFilter, customers]
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

      customers.forEach((customer) => {
        if (filters.indexOf(customer[column]) === -1)
          filters.push(customer[column]);
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

    customers.forEach((customer) => {
      if (filter.selecteds.indexOf(customer[activeFilter]) === -1)
        filter.selecteds.push(customer[activeFilter]);
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

  useEffect(() => {
    fetch(`${API_URL}customers/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];

        response.forEach((customer) => {
          if (true) {
            transformedData.push({
              customerId: customer.customerId,
              customerName: customer.customerName,
              customerType: customer.customerType,
              contactName: customer.contactName,
              contactContact: customer.contactContact,
              contactOffice: customer.contactOffice,
              contactEmail: customer.contactEmail,
              id: customer.id,
            });
          }
        });

        transformedData.sort((a, b) => a.customerId - b.customerId);

        setCustomers(transformedData);
        setFilteredCustomers(transformedData);

        //Seleciona todos os filtros possíveis
        let filters = [];

        columnsNames.forEach((attribute) => {
          response.forEach((customer) => {
            if (filters.find((item) => item.attributeName === attribute.code)) {
              if (
                filters
                  .find((item) => item.attributeName === attribute.code)
                  .selecteds.indexOf(customer[attribute.code]) === -1
              )
                filters
                  .find((item) => item.attributeName === attribute.code)
                  .selecteds.push(customer[attribute.code]);
            } else {
              filters.push({
                attributeName: attribute.code,
                selecteds: [customer[attribute.code]],
              });
            }
          });
        });
        setSelectedFilters(filters);
      });
  }, []);

  //Atualiza os produtos filtrados
  useEffect(() => {
    const filteredItems = customers.filter((customer) => {
      let ok = true;
      selectedFilters.forEach((filter) => {
        if (filter.selecteds.indexOf(customer[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });
      return ok;
    });
    setFilteredCustomers(filteredItems);
  }, [selectedFilters, reset, customers]);

  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <SubTitle>Clientes</SubTitle>
        <Title>Listar</Title>
        <DownloadExcelWrapper>
          <DownloadTableExcel
            filename="Clientes"
            sheet="clientes"
            currentTableRef={tableRef.current}
          >
            <Button variant="outlined" style={{ marginBottom: "20px" }}>
              Exportar para Excel
            </Button>
          </DownloadTableExcel>
        </DownloadExcelWrapper>
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
              {filteredCustomers.map((customer, index) => {
                return (
                  <tr
                    key={customer.id}
                    className={
                      index > 0 &&
                      customer.customerName !==
                        filteredCustomers[index - 1].customerName
                        ? "separate"
                        : ""
                    }
                  >
                    <td>{customer.customerName}</td>
                    <td>{customer.customerType}</td>
                    <td>{customer.contactName}</td>
                    <td>{customer.contactContact}</td>
                    <td>{customer.contactOffice}</td>
                    <td>{customer.contactEmail}</td>
                    <td>
                      <Tooltip title="Edit" placement="top">
                        <EditButton
                          onClick={() => editCustomer(customer.customerId)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete" placement="top">
                        <DeleteButton
                          onClick={() =>
                            deleteCustomer(customer.id, customer.contactName)
                          }
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

export default CustomersList;
