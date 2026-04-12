import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

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
  TableActions,
  Tables,
  Title,
} from "./productlist";
import {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  DownloadExcelWrapper,
} from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { API_URL } from "../../utils/env";

const ProductList = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  const location = useLocation();
  const categoryParam = new URLSearchParams(location.search).get("category");
  const isAdicionais = categoryParam === "adicional";

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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
      code: "type",
      name: "Tipo",
    },
    {
      code: "name",
      name: "Nome",
    },
  ];

  const deleteProduct = useCallback(
    (productId, productName) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: `Tem certeza que deseja remover o produto ${productName}?`,
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}products/delete.php?id=${productId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Produto removido com sucesso!!", "", "success").then(
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

  const editProduct = useCallback((productId) => {
    navigate(`/editar-produto?id=${productId}`);
  }, []);

  const openFilter = useCallback(
    (filter) => {
      setSearch("");
      setActiveFilter(filter);
      let options = [];
      products.forEach((product) => {
        if (options.indexOf(product[filter]) === -1)
          options.push(product[filter]);
      });
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [products, setActiveFilter]
  );

  const searchFilters = useCallback(
    (e) => {
      const search = e.target.value;
      const filter = activeFilter;
      setSearch(search);
      let options = [];
      products.forEach((product) => {
        if (options.indexOf(product[filter]) === -1)
          options.push(product[filter]);
      });
      options = options.filter(
        (a) => a && a.toLowerCase().includes(search.toLowerCase())
      );
      options = options.sort((a, b) => (a > b ? 1 : -1));
      setFiltersOptions(options);
    },
    [activeFilter, products]
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

      products.forEach((product) => {
        if (filters.indexOf(product[column]) === -1)
          filters.push(product[column]);
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

    products.forEach((product) => {
      if (filter.selecteds.indexOf(product[activeFilter]) === -1)
        filter.selecteds.push(product[activeFilter]);
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
      products.forEach((product) => {
        if (filters.find((item) => item.attributeName === attribute.code)) {
          if (
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.indexOf(product[attribute.code]) === -1
          )
            filters
              .find((item) => item.attributeName === attribute.code)
              .selecteds.push(product[attribute.code]);
        } else {
          filters.push({
            attributeName: attribute.code,
            selecteds: [product[attribute.code]],
          });
        }
      });
    });
    setSelectedFilters(filters);
  }, [products]);

  useEffect(() => {
    fetch(`${API_URL}products/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        let currentProductId = null;
        response.forEach((product) => {
          if (product.productId !== currentProductId) {
            transformedData.push({
              productId: product.productId,
              name: product.name,
              type: product.type,
              category: product.category || "atividade",
            });
            currentProductId = product.productId;
          }
        });

        // Filtrar pela category da URL, se houver
        if (categoryParam) {
          transformedData = transformedData.filter((p) => p.category === categoryParam);
        } else {
          transformedData = transformedData.filter((p) => p.category !== "adicional");
        }

        setProducts(transformedData);
        setFilteredProducts(transformedData);

        //Seleciona todos os filtros possíveis
        let filters = [];

        columnsNames.forEach((attribute) => {
          transformedData.forEach((product) => {
            if (filters.find((item) => item.attributeName === attribute.code)) {
              if (
                filters
                  .find((item) => item.attributeName === attribute.code)
                  .selecteds.indexOf(product[attribute.code]) === -1
              )
                filters
                  .find((item) => item.attributeName === attribute.code)
                  .selecteds.push(product[attribute.code]);
            } else {
              filters.push({
                attributeName: attribute.code,
                selecteds: [product[attribute.code]],
              });
            }
          });
        });
        setSelectedFilters(filters);
      });
  }, []);

  //Atualiza os produtos filtrados
  useEffect(() => {
    const filteredItems = products.filter((product) => {
      let ok = true;
      selectedFilters.forEach((filter) => {
        if (filter.selecteds.indexOf(product[filter.attributeName]) === -1) {
          ok = false;
          return;
        }
      });
      return ok;
    });
    setFilteredProducts(filteredItems);
  }, [selectedFilters, reset, products]);

  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <SubTitle>{isAdicionais ? "Adicionais" : "Produtos"}</SubTitle>
        <Title>Listar</Title>
        <DownloadExcelWrapper>
          <Button
            variant="outlined"
            style={{ marginBottom: "20px", marginLeft: "20px" }}
            onClick={resetFilters}
          >
            Resetar Filtros
          </Button>
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
              {filteredProducts.map((product) => {
                return (
                  <tr key={product.productId}>
                    <td>{product.type}</td>
                    <td>{product.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <TableActions>
            <thead>
              <tr></tr>
              <tr></tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                return (
                  <tr key={product.productId}>
                    <td>
                      <Tooltip title="Editar" placement="top">
                        <EditButton
                          onClick={() => editProduct(product.productId)}
                        />
                      </Tooltip>
                    </td>
                    <td>
                      <Tooltip title="Deletar" placement="top">
                        <DeleteButton
                          onClick={() =>
                            deleteProduct(product.productId, product.name)
                          }
                        />
                      </Tooltip>
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
          <ul status={reset}>
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
        </Filter>
      </Content>
    </Main>
  );
};

export default ProductList;
