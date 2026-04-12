import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";

import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Modal,
  Tooltip,
  Autocomplete,
} from "@mui/material";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  Main,
  SubTitle,
  Table,
  TableActions,
  Tables,
  Title,
  FormBox,
  FormRow,
  SettingGroup,
  ContentInner,
  EditButton,
  EditFunctionModalBox,
  FormBoxEdit,
  TableButtons,
  EmployeesListFilter,
} from "./dayordersettings";

import { Content } from "../../utils/stylesbase";
import { formatMoney } from "../../utils/functions";
import { API_URL } from "../../utils/env";

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

const DayOrderSettings = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [formsStatus, setFormsStatus] = useState(0);
  const [functions, setFunctions] = useState([]);
  const [newFunction, setNewFunction] = useState({
    name: "",
    orderNumber: "",
  });
  const [editingFunction, setEditingFunction] = useState({
    name: "",
    orderNumber: "",
  });
  const [editFunctionModalOpen, setEditFunctionModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [remunerations, setRemunerations] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    function: "",
    type: "",
    name: "",
    phone: "",
  });
  const [editingEmployee, setEditingEmployee] = useState({
    function: "",
    type: "",
    name: "",
    phone: "",
  });
  const [filteringEmployees, setFilteringEmployees] = useState({
    function: "",
    type: "",
    name: "",
  });
  const [newRemuneration, setNewRemuneration] = useState({
    functionId: "",
    paymentType: "",
    activity: "",
    hourlyValue1: 0,
    hourlyValue2: 0,
    hourlyValue3: 0,
  });
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);

  const paymentTypeNamesDictionary = {
    hour: "Hora",
    tour: "Tour",
    day: "Dia",
    special: "Especial",
  };

  const { sidebarClosed, userPermissions } = useContext(StoreContext);

  const deleteFunction = useCallback(
    (functionId) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: "Tem certeza que deseja excluir?",
        showCancelButton: true,
        confirmButtonText: "Sim",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}day-order/delete-function.php?id=${functionId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) => {
              if (!response.error)
                Swal.fire("Função removida com sucesso!", "", "success").then(
                  () => {
                    return navigate(0);
                  }
                );
            });
        }
      });
    },
    [userPermissions]
  );

  const deleteRemuneration = useCallback(
    (remunerationId) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: "Tem certeza que deseja excluir?",
        showCancelButton: true,
        confirmButtonText: "Sim",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(
            `${API_URL}day-order/delete-remuneration.php?id=${remunerationId}`,
            {
              method: "POST",
            }
          )
            .then((response) => response.json())
            .then((response) => {
              if (!response.error)
                Swal.fire("Removido com sucesso!", "", "success").then(() => {
                  return navigate(0);
                });
            });
        }
      });
    },
    [userPermissions]
  );

  const openEditingFunctionModal = useCallback((func) => {
    setEditingFunction({ ...func });
    setEditFunctionModalOpen(true);
    setFormsStatus(Math.random());
  }, []);

  const openEditingEmployeeModal = useCallback((employee) => {
    setEditingEmployee({ ...employee });
    setEditEmployeeModalOpen(true);
    setFormsStatus(Math.random());
  }, []);

  const editFunction = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/edit-function.php`, {
        method: "POST",
        body: JSON.stringify(editingFunction),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            setEditFunctionModalOpen(false);
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Função editada com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [editingFunction, userPermissions]
  );

  const editEmployee = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/edit-employee-option.php`, {
        method: "POST",
        body: JSON.stringify(editingEmployee),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            setEditEmployeeModalOpen(false);
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Colaborador editado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [editingEmployee, userPermissions]
  );

  const onChangeEditEmployee = useCallback(
    (e) => {
      let employee = editingEmployee;
      employee[e.target.name] = e.target.value;
      setEditingEmployee(employee);
      setFormsStatus(Math.random());
    },
    [editingEmployee]
  );

  const onChangeEditFunction = useCallback(
    (e) => {
      let func = editingFunction;
      func[e.target.name] = e.target.value;
      setEditingFunction(func);
      setFormsStatus(Math.random());
    },
    [editingFunction]
  );

  const onChangeFilter = useCallback(
    (e) => {
      let employee = filteringEmployees;
      employee[e.target.name] = e.target.value;
      setFilteringEmployees(employee);
      setFormsStatus(Math.random());
    },
    [filteringEmployees]
  );

  const deleteEmployee = useCallback(
    (employeeId) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: "Tem certeza que deseja excluir?",
        showCancelButton: true,
        confirmButtonText: "Sim",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}day-order/delete-employee.php?id=${employeeId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) => {
              if (!response.error)
                Swal.fire(
                  "Colaborador removido com sucesso!",
                  "",
                  "success"
                ).then(() => {
                  return navigate(0);
                });
            });
        }
      });
    },
    [userPermissions]
  );

  const onChangeNewFunction = useCallback(
    (e) => {
      let func = newFunction;
      func[e.target.name] = e.target.value;
      setNewFunction(func);
      setFormsStatus(Math.random());
    },
    [newFunction]
  );

  const onChangeNewEmployee = useCallback(
    (e) => {
      let employee = newEmployee;
      employee[e.target.name] = e.target.value;
      setNewEmployee(employee);
      setFormsStatus(Math.random());
    },
    [newEmployee]
  );

  const onChangeNewRemuneration = useCallback(
    (e) => {
      let remuneration = newRemuneration;
      remuneration[e.target.name] = e.target.value;
      if (
        e.target.name === "functionId" &&
        functions.find((func) => func.id === e.target.value)?.name === "Guia"
      )
        remuneration.paymentType = "tour";
      setNewRemuneration(remuneration);
      setFormsStatus(Math.random());
    },
    [newRemuneration, functions]
  );

  const createFunction = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/create-function.php`, {
        method: "POST",
        body: JSON.stringify(newFunction),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Configuração cadastrada com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [newFunction, userPermissions]
  );

  const createEmployee = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/create-employee-option.php`, {
        method: "POST",
        body: JSON.stringify(newEmployee),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Colaborador cadastrado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: response.message,
            });
          }
        });
    },
    [newFunction, userPermissions]
  );

  const createRemuneration = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;
      fetch(`${API_URL}day-order/create-remuneration.php`, {
        method: "POST",
        body: JSON.stringify(newRemuneration),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Salário cadastrado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [newRemuneration, userPermissions]
  );

  useEffect(() => {
    fetch(`${API_URL}day-order/list-functions.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        setFunctions(response);
      });

    fetch(`${API_URL}day-order/list-employees-options.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        response = response.sort((a, b) => a.function - b.function);
        setEmployees(response);
        setFilteredEmployees(response);
      });

    fetch(`${API_URL}day-order/list-remunerations.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        response = response.sort((a, b) => a.function - b.function);
        setRemunerations(response);
      });

    fetch(`${API_URL}day-order/list-activities.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        setActivities(response);
      });
  }, []);

  useEffect(() => {
    let filteredEmployees = employees;
    let newFilteredemployees = [];
    filteredEmployees.forEach((employee) => {
      let check = true;
      for (const property in filteringEmployees) {
        if (
          filteringEmployees[property] !== "" &&
          filteringEmployees[property] !== null &&
          employee[property]
            ?.toLowerCase()
            .indexOf(filteringEmployees[property]?.toLowerCase()) === -1
        ) {
          check = false;
          break;
        }
      }
      if (check) newFilteredemployees.push(employee);
    });
    newFilteredemployees = newFilteredemployees.sort(
      (a, b) => a.function - b.function
    );
    setFilteredEmployees(newFilteredemployees);
  }, [employees, filteringEmployees, formsStatus]);
  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <Title>Configurações</Title>
        <ContentInner>
          <SettingGroup>
            <SubTitle>Funções</SubTitle>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Ordem</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {functions.map((data) => {
                    return (
                      <tr key={data.id}>
                        <td>{data.name}</td>
                        <td>{data.orderNumber}</td>
                        <TableButtons>
                          <Tooltip title="Excluir" placement="right">
                            <DeleteButton
                              onClick={() => deleteFunction(data.id)}
                            />
                          </Tooltip>
                          <Tooltip title="Editar" placement="right">
                            <EditButton
                              onClick={() => openEditingFunctionModal(data)}
                            />
                          </Tooltip>
                        </TableButtons>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>Nova Função</SubTitle>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={createFunction}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newFunction"
                  label="Função"
                  variant="outlined"
                  name="name"
                  onChange={onChangeNewFunction}
                  value={newFunction.name}
                  type="text"
                  placeholder=""
                />
                <TextField
                  id="newFunctionOrderNumber"
                  label="Ordem"
                  variant="outlined"
                  name="orderNumber"
                  onChange={onChangeNewFunction}
                  value={newFunction.orderNumber}
                  type="number"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Salários guias</SubTitle>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th>Salário por tour</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {remunerations
                    .filter(
                      (rem) =>
                        functions.find((func) => func.id === rem.functionId)
                          ?.name === "Guia"
                    )
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.activity}</td>
                          <td>R$ {formatMoney(data.hourlyValue1)}</td>
                          <TableButtons>
                            <Tooltip title="Excluir" placement="right">
                              <DeleteButton
                                onClick={() => deleteRemuneration(data.id)}
                              />
                            </Tooltip>
                          </TableButtons>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>
              Salários das demais funções que recebem por diária
            </SubTitle>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Função</th>
                    <th>Tipo de Remuneração</th>
                    <th>Entre 0h e 8h</th>
                    <th>Entre 8h1min e 10h</th>
                    <th>Entre 10h1min e 12h</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {remunerations
                    .filter(
                      (rem) =>
                        functions.find((func) => func.id === rem.functionId)
                          ?.name !== "Guia" && rem.paymentType === "day"
                    )
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            {
                              functions.find(
                                (func) => func.id === data.functionId
                              )?.name
                            }
                          </td>
                          <td>
                            Por {paymentTypeNamesDictionary[data.paymentType]}
                          </td>
                          <td>R$ {formatMoney(data.hourlyValue1)}</td>
                          <td>R$ {formatMoney(data.hourlyValue2)}</td>
                          <td>R$ {formatMoney(data.hourlyValue3)}</td>
                          <TableButtons>
                            <Tooltip title="Excluir" placement="right">
                              <DeleteButton
                                onClick={() => deleteRemuneration(data.id)}
                              />
                            </Tooltip>
                          </TableButtons>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>
              Salários das demais funções que recebem por hora
            </SubTitle>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Função</th>
                    <th>Tipo de Remuneração</th>
                    <th>Valor/hora</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {remunerations
                    .filter(
                      (rem) =>
                        functions.find((func) => func.id === rem.functionId)
                          ?.name !== "Guia" && rem.paymentType === "hour"
                    )
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            {
                              functions.find(
                                (func) => func.id === data.functionId
                              )?.name
                            }
                          </td>
                          <td>
                            Por {paymentTypeNamesDictionary[data.paymentType]}
                          </td>
                          <td>R$ {formatMoney(data.hourlyValue1)}</td>
                          <TableButtons>
                            <Tooltip title="Excluir" placement="right">
                              <DeleteButton
                                onClick={() => deleteRemuneration(data.id)}
                              />
                            </Tooltip>
                          </TableButtons>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>
              Salários das demais funções que tem salário especial
            </SubTitle>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Função</th>
                    <th>Tipo de Remuneração</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {remunerations
                    .filter(
                      (rem) =>
                        functions.find((func) => func.id === rem.functionId)
                          ?.name !== "Guia" && rem.paymentType === "special"
                    )
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            {
                              functions.find(
                                (func) => func.id === data.functionId
                              )?.name
                            }
                          </td>
                          <td>
                            {paymentTypeNamesDictionary[data.paymentType]}
                          </td>
                          <TableButtons>
                            <Tooltip title="Excluir" placement="right">
                              <DeleteButton
                                onClick={() => deleteRemuneration(data.id)}
                              />
                            </Tooltip>
                          </TableButtons>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>Novo Salário</SubTitle>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={createRemuneration}
              status={formsStatus}
            >
              <FormRow>
                <FormControl fullWidth>
                  <InputLabel id="new-employee-remuneration-function-label">
                    Função
                  </InputLabel>
                  <Select
                    labelId="new-employee-remuneration-function-label"
                    id="new-employee-remuneration-function"
                    name="functionId"
                    label="Função"
                    value={newRemuneration.functionId}
                    onChange={onChangeNewRemuneration}
                  >
                    {functions.map((func) => (
                      <MenuItem value={func.id}>{func.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {functions.find(
                  (func) => func.id === newRemuneration.functionId
                )?.name !== "Guia" && (
                  <FormControl fullWidth>
                    <InputLabel id="new-employee-remuneration-type-label">
                      Tipo
                    </InputLabel>
                    <Select
                      labelId="new-employee-remuneration-type"
                      id="new-employee-remuneration-type"
                      name="paymentType"
                      label="Tipo"
                      value={newRemuneration.paymentType}
                      onChange={onChangeNewRemuneration}
                    >
                      <MenuItem value="hour">Por Hora</MenuItem>
                      <MenuItem value="day">Por Dia</MenuItem>
                      <MenuItem value="tour">Por Tour</MenuItem>
                      <MenuItem value="special">Especial</MenuItem>
                    </Select>
                  </FormControl>
                )}
                {functions.find(
                  (func) => func.id === newRemuneration.functionId
                )?.name === "Guia" && (
                  <FormControl fullWidth>
                    <InputLabel id="new-employee-remuneration-activity-label">
                      Atividade
                    </InputLabel>
                    <Select
                      labelId="new-employee-remuneration-activity"
                      id="new-employee-remuneration-activity"
                      name="activity"
                      label="Atividade"
                      value={newRemuneration.activity}
                      onChange={onChangeNewRemuneration}
                    >
                      {activities.map((activity) => (
                        <MenuItem value={activity.name} key={activity.name}>
                          {activity.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {newRemuneration.paymentType === "hour" && (
                  <>
                    <TextField
                      id="new-employee-remuneration-hourlyValue1"
                      label="Valor por hora"
                      variant="outlined"
                      name="hourlyValue1"
                      onChange={onChangeNewRemuneration}
                      value={newRemuneration.hourlyValue1}
                      InputProps={{
                        inputComponent: MoneyInput,
                      }}
                      inputProps={{
                        prefix: "R$ ",
                      }}
                    />
                  </>
                )}
                {newRemuneration.paymentType === "day" && (
                  <>
                    <TextField
                      id="new-employee-remuneration-hourlyValue1"
                      label="0h - 8h"
                      variant="outlined"
                      name="hourlyValue1"
                      onChange={onChangeNewRemuneration}
                      value={newRemuneration.hourlyValue1}
                      InputProps={{
                        inputComponent: MoneyInput,
                      }}
                      inputProps={{
                        prefix: "R$ ",
                      }}
                    />
                    <TextField
                      id="new-employee-remuneration-hourlyValue2"
                      label="8h1min - 10h"
                      variant="outlined"
                      name="hourlyValue2"
                      onChange={onChangeNewRemuneration}
                      value={newRemuneration.hourlyValue2}
                      InputProps={{
                        inputComponent: MoneyInput,
                      }}
                      inputProps={{
                        prefix: "R$ ",
                      }}
                    />
                    <TextField
                      id="new-employee-remuneration-hourlyValue3"
                      label="10h1min - 12h"
                      variant="outlined"
                      name="hourlyValue3"
                      onChange={onChangeNewRemuneration}
                      value={newRemuneration.hourlyValue3}
                      InputProps={{
                        inputComponent: MoneyInput,
                      }}
                      inputProps={{
                        prefix: "R$ ",
                      }}
                    />
                  </>
                )}
                {newRemuneration.paymentType === "tour" && (
                  <>
                    <TextField
                      id="new-employee-remuneration-hourlyValue1"
                      label="Valor por tour"
                      variant="outlined"
                      name="hourlyValue1"
                      onChange={onChangeNewRemuneration}
                      value={newRemuneration.hourlyValue1}
                      InputProps={{
                        inputComponent: MoneyInput,
                      }}
                      inputProps={{
                        prefix: "R$ ",
                      }}
                    />
                  </>
                )}
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Colaboradores</SubTitle>
            <EmployeesListFilter>
              <Autocomplete
                id={`employee-filter-function`}
                freeSolo
                options={functions.map((func) => func.name)}
                name="function"
                value={filteringEmployees.function}
                onChange={(event, newValue) => {
                  onChangeFilter({
                    target: { name: "function", value: newValue },
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="function"
                    onChange={onChangeFilter}
                    placeholder="Função"
                  />
                )}
              />
              <Autocomplete
                id={`employee-filter-type`}
                freeSolo
                options={["Fixo", "Extra", "Evento"]}
                name="type"
                value={filteringEmployees.type}
                onChange={(event, newValue) => {
                  onChangeFilter({
                    target: { name: "type", value: newValue },
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="type"
                    onChange={onChangeFilter}
                    placeholder="Tipo"
                  />
                )}
              />
              <TextField
                id="employee-filter-name"
                placeholder="Nome"
                variant="outlined"
                name="name"
                onChange={onChangeFilter}
                value={filteringEmployees.name}
                type="text"
              />
            </EmployeesListFilter>
            <Tables>
              <Table>
                <tbody>
                  {filteredEmployees.map((data) => {
                    return (
                      <tr key={data.id}>
                        <td>
                          {data.name} - {data.function} - {data.type} -{" "}
                          {data.phone}
                        </td>
                        <TableButtons>
                          <Tooltip title="Excluir" placement="right">
                            <DeleteButton
                              onClick={() => deleteEmployee(data.id)}
                            />
                          </Tooltip>
                          <Tooltip title="Editar" placement="right">
                            <EditButton
                              onClick={() => openEditingEmployeeModal(data)}
                            />
                          </Tooltip>
                        </TableButtons>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Tables>
            <SubTitle style={{ marginTop: 20 }}>Novo Colaborador</SubTitle>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={createEmployee}
              status={formsStatus}
            >
              <FormRow>
                <FormControl fullWidth>
                  <InputLabel id="new-employee-function-label">
                    Função
                  </InputLabel>
                  <Select
                    labelId="new-employee-function-label"
                    id="new-employee-function"
                    name="function"
                    label="Função"
                    value={newEmployee.function}
                    onChange={onChangeNewEmployee}
                  >
                    {functions
                      .filter((func) => func.name !== "Guia")
                      .map((func) => (
                        <MenuItem value={func.name}>{func.name}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="new-employee-type-label">Tipo</InputLabel>
                  <Select
                    labelId="new-employee-type-label"
                    id="new-employee-type"
                    name="type"
                    label="Tipo"
                    value={newEmployee.type}
                    onChange={onChangeNewEmployee}
                  >
                    <MenuItem value="Fixo">Fixo</MenuItem>
                    <MenuItem value="Extra">Extra</MenuItem>
                    <MenuItem value="Evento">Evento</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  id="new-employee-name"
                  label="Nome"
                  variant="outlined"
                  name="name"
                  onChange={onChangeNewEmployee}
                  value={newEmployee.name}
                  type="text"
                  placeholder=""
                />
                <TextField
                  id="new-employee-phone"
                  label="Telefone"
                  variant="outlined"
                  name="phone"
                  onChange={onChangeNewEmployee}
                  value={newEmployee.phone}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>
        </ContentInner>
      </Content>
      <Modal
        open={editEmployeeModalOpen}
        onClose={() => setEditEmployeeModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <EditFunctionModalBox>
          <SubTitle>Editar Colaborador</SubTitle>
          <FormBoxEdit
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={editEmployee}
            status={formsStatus}
          >
            <FormRow>
              <FormControl fullWidth>
                <InputLabel id="editing-employee-function-label">
                  Função
                </InputLabel>
                <Select
                  labelId="editing-employee-function-label"
                  id="editing-employee-function"
                  name="function"
                  label="Função"
                  value={editingEmployee.function}
                  onChange={onChangeEditEmployee}
                >
                  {functions.map((func) => (
                    <MenuItem value={func.name}>{func.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="editing-employee-type-label">Tipo</InputLabel>
                <Select
                  labelId="editing-employee-type-label"
                  id="editing-employee-type"
                  name="type"
                  label="Tipo"
                  value={editingEmployee.type}
                  onChange={onChangeEditEmployee}
                >
                  <MenuItem value="Fixo">Fixo</MenuItem>
                  <MenuItem value="Extra">Extra</MenuItem>
                  <MenuItem value="Evento">Evento</MenuItem>
                </Select>
              </FormControl>
              <TextField
                id="editing-employee-name"
                label="Nome"
                variant="outlined"
                name="name"
                onChange={onChangeEditEmployee}
                value={editingEmployee.name}
                type="text"
                placeholder=""
              />
              <TextField
                id="editing-employee-phone"
                label="Telefone"
                variant="outlined"
                name="phone"
                onChange={onChangeEditEmployee}
                value={editingEmployee.phone}
                type="text"
                placeholder=""
              />
              <Button variant="outlined" type="submit">
                Salvar
              </Button>
            </FormRow>
          </FormBoxEdit>
        </EditFunctionModalBox>
      </Modal>
      <Modal
        open={editFunctionModalOpen}
        onClose={() => setEditFunctionModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <EditFunctionModalBox>
          <SubTitle>Editar Função</SubTitle>
          <FormBoxEdit
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={editFunction}
            status={formsStatus}
          >
            <FormRow>
              <TextField
                id="newFunction"
                label="Função"
                variant="outlined"
                name="name"
                onChange={onChangeEditFunction}
                value={editingFunction.name}
                type="text"
                placeholder=""
              />
              <TextField
                id="newFunctionOrderNumber"
                label="Ordem"
                variant="outlined"
                name="orderNumber"
                onChange={onChangeEditFunction}
                value={editingFunction.orderNumber}
                type="number"
                placeholder=""
              />
              <Button variant="outlined" type="submit">
                Salvar
              </Button>
            </FormRow>
          </FormBoxEdit>
        </EditFunctionModalBox>
      </Modal>
    </Main>
  );
};

export default DayOrderSettings;
