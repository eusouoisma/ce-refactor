import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import LogoImg from "../../assets/logo-ce.png";

import {
  TextField,
  Checkbox,
  Button,
  Autocomplete,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
} from "@mui/material";

import Textarea from "@mui/joy/Textarea";

import Sidebar from "../../components/Sidebar";
import {
  AddEmployeeIcon,
  Blocked,
  ButtonArea,
  DonwloadDoc,
  EditButton,
  EmployeeLine,
  HeaderText,
  LastEdit,
  Main,
  ModalBox,
  PrintDoc,
  PrintDocMark,
  SubTitle,
  Table,
  Tables,
  Title,
  TourListTooltip,
  ToursList,
} from "./dayorderedit";
import { Content, Logo } from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import { API_URL } from "../../utils/env";
import { DownloadTableExcel } from "react-export-table-to-excel";

const DayOrderEdit = () => {
  const weekDays = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const dayOrderId = params.get("id");

  const [dayOrder, setDayOrder] = useState([]);
  const [tours, setTours] = useState([]);
  const [reset, setReset] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [functionsOptions, setFunctionsOptions] = useState([]);
  const [employeesOptions, setEmployeesOptions] = useState([]);
  const [associateGuideModalOpened, setAssociateGuideModalOpened] =
    useState(false);
  const [tourToAssociateGuide, setTourToAssociateGuide] = useState({});
  const [guideToAssociateToTour, setGuideToAssociateToTour] = useState([]);
  const [selectGuideSelectIsOpened, setSelectGuideSelectIsOpened] =
    useState(false);
  const [invalidEmployees, setInvalidEmployees] = useState([]);
  const [invalidTours, setInvalidTours] = useState([]);

  const printRef = useRef();
  const downloadRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const { sidebarClosed, userName, setSidebarClosed, userPermissions } =
    useContext(StoreContext);

  const columnsNames = useMemo(() => {
    return [
      {
        code: "function",
        name: "Função",
      },
      {
        code: "name",
        name: "Nome",
      },
      {
        code: "toursNumber",
        name: "Tours",
      },
      {
        code: "prevision",
        name: "Previsão",
      },
      {
        code: "arrival",
        name: "Chegada",
      },
      {
        code: "departure",
        name: "Saída",
      },
      {
        code: "phone",
        name: dayOrder.name === "Tour Principal" ? "Telefone" : "Documento",
      },
      {
        code: "comments",
        name: "Observações",
      },
    ];
  }, [dayOrder]);

  const newEmployee = useCallback(
    (employee) => {
      let employeeData = {
        function: employee ? employee.function : "",
        name: employee ? employee.name : "",
        prevision: "",
        arrival: "",
        departure: "",
        phone: employee ? employee.phone : "",
        comments: "",
        namesOptions: [],
        deleted: false,
      };
      fetch(`${API_URL}day-order/create-employee.php`, {
        method: "POST",
        body: JSON.stringify({
          dayOrderId: dayOrderId,
          employee: employeeData,
          editedBy: userName,
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            let newEmployees = employees;
            employeeData.id = response.data;
            newEmployees.push(employeeData);
            setEmployees(newEmployees);
            setReset(Math.random());
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [employees, dayOrderId, userName]
  );

  const onchange = useCallback(
    (employeeId, e) => {
      if (!e) return;
      let newEmployees = employees;
      newEmployees.find((employee) => employee.id === employeeId)[
        e.target.name
      ] = e.target.value;

      if (e.target.name === "function" && e.target.value === null) {
        newEmployees.find(
          (employee) => employee.id === employeeId
        ).deleted = true;
      }

      if (e.target.name === "function") {
        if (functionsOptions.find((func) => func.name === e.target.value)) {
          let newAvaialableEmployees = employeesOptions;
          newAvaialableEmployees = newAvaialableEmployees.filter(
            (employee) => employee.function === e.target.value
          );
          newEmployees.find(
            (employee) => employee.id === employeeId
          ).namesOptions = newAvaialableEmployees;
        }
      }

      if (e.target.name === "name") {
        let editingEmployee = newEmployees.find(
          (employee) => employee.id === employeeId
        );
        let phone = editingEmployee.namesOptions?.find(
          (emp) => emp.name === e.target.value
        )?.phone;
        newEmployees.find((employee) => employee.id === employeeId).phone =
          phone;
        let type = editingEmployee.namesOptions?.find(
          (emp) => emp.name === e.target.value
        )?.type;
        newEmployees.find((employee) => employee.id === employeeId).type = type;
      }

      let newInvalidEmployees = invalidEmployees;
      newInvalidEmployees = newInvalidEmployees.filter(
        (emp) => emp != employeeId
      );
      setInvalidEmployees(newInvalidEmployees);

      setEmployees(newEmployees);
      setReset(Math.random());
    },
    [employees, employeesOptions, functionsOptions, dayOrder, invalidEmployees]
  );

  const onchangeComments = useCallback(
    (e) => {
      let newDayOrder = dayOrder;
      newDayOrder.comments = e.target.value;
      setDayOrder(newDayOrder);
      setReset(Math.random());
    },
    [dayOrder]
  );

  const saveEmployees = useCallback(() => {
    let body = employees;
    body.forEach((item) => {
      let deleted = true;
      for (const property in item) {
        if (
          property !== "id" &&
          property !== "dayOrderId" &&
          property !== "deleted" &&
          item[property] !== "" &&
          item[property]
        )
          deleted = false;
      }
      item.deleted = deleted;
    });

    fetch(`${API_URL}day-order/update-employees.php`, {
      method: "POST",
      body: JSON.stringify({
        employees: employees,
        dayOrderId: dayOrder.id,
        comments: dayOrder.comments,
        lastEditBy: userName,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.error) {
          MySwal.fire({
            title: <p>Sucesso</p>,
            html: <i>Ordem do dia atualizada</i>,
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
  }, [employees, dayOrder, userName]);

  const openFunctionsTour = useCallback(
    (tour) => {
      Swal.fire({
        title: `O que você deseja fazer?`,
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: `${
          dayOrder.name === "Tour Principal"
            ? "Separar tour"
            : "Retornar para o tour principal"
        }`,
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          dayOrder.name === "Tour Principal"
            ? splitTourToAnotherDayOrder(tour)
            : returnToOriginalDayOrder(tour);
        }
      });
    },
    [dayOrder]
  );

  const splitTourToAnotherDayOrder = useCallback(
    (tour) => {
      Swal.fire({
        title: `Tem certeza que deseja separar o tour ${tour.activity} do dia ${dayOrder.formatedDate} às ${tour.tourHour} no idioma ${tour.language}? `,
        showDenyButton: true,
        confirmButtonText: "Sim",
        denyButtonText: `Não`,
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}day-order/split-tours-to-another-day-order.php`, {
            method: "POST",
            body: JSON.stringify({
              activity: tour.activity,
              date: tour.tourDate,
              hour: tour.tourHour,
              language: tour.language,
              dayOrderId: dayOrder.id,
              editedBy: userName,
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
                Swal.fire("Tour separado com sucesso!!", "", "success").then(
                  () => {
                    return navigate(0);
                  }
                );
              }
            });
        }
      });
    },
    [dayOrder, userName]
  );

  const returnToOriginalDayOrder = useCallback(
    (tour) => {
      Swal.fire({
        title: `Tem certeza que deseja retornar o tour ${tour.activity} do dia ${dayOrder.formatedDate} às ${tour.tourHour} no idioma ${tour.language} para a ordem do dia principal?`,
        showDenyButton: true,
        confirmButtonText: "Sim",
        denyButtonText: `Não`,
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}day-order/return-tour-to-original-day-order.php`, {
            method: "POST",
            body: JSON.stringify({
              activity: tour.activity,
              date: tour.tourDate,
              hour: tour.tourHour,
              language: tour.language,
              dayOrderId: dayOrder.id,
            }),
          })
            .then((response) => response.json())
            .then((response) => {
              if (response.error) {
                Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: response.message,
                });
              } else {
                Swal.fire("Tour retornado com sucesso!!", "", "success").then(
                  () => {
                    return navigate(
                      `/editar-ordem-do-dia?id=${response.original}`
                    );
                  }
                );
              }
            });
        }
      });
    },
    [dayOrder]
  );

  const openAssociateGuideModal = useCallback((tour) => {
    setTourToAssociateGuide(tour);
    if (tour.guide != "" && tour.guide != null) {
      let tourGuides = tour.guide.split(",");
      setGuideToAssociateToTour(tourGuides);
    } else setGuideToAssociateToTour([]);
    setAssociateGuideModalOpened(true);
  }, []);

  const handleSetGuideToAssociateToTour = useCallback((e) => {
    setGuideToAssociateToTour(e.target.value);
    setSelectGuideSelectIsOpened(false);
  }, []);

  const getToursByGuide = useCallback(
    (guideName) => {
      if (guideName === "" || !guideName) return "";
      let toursNumbers = [];
      tours.forEach((item, index) => {
        if (item.guides) {
          let guides = item.guides.split(",");
          let trimedGuides = [];
          guides.forEach((guideName) => {
            trimedGuides.push(guideName.trim());
          });
          guides = trimedGuides;
          if (guides.indexOf(guideName) !== -1) toursNumbers.push(index + 1);
        }
      });
      return toursNumbers.join(",");
    },
    [tours]
  );

  const validateInfosToPayment = useCallback(() => {
    let isValid = true;
    let newInvalidEmployees = [];
    let newInvalidTours = [];

    employees.forEach((employee) => {
      if (
        employee.type !== "Fixo" &&
        employee.function !== "Guia" &&
        employee.comments === "" &&
        (employee.arrival === "" || employee.departure === "")
      )
        newInvalidEmployees.push(employee.id);
      else if (
        employee.function === "Guia" &&
        getToursByGuide(employee.name) === ""
      ) {
        newInvalidEmployees.push(employee.id);
      }
    });

    if (newInvalidEmployees.length !== 0) {
      isValid = false;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Há colaboradores com dados incompletos nessa ordem do dia",
      });
    }
    setInvalidEmployees(newInvalidEmployees);

    tours.forEach((tour, index) => {
      if (tour.status !== "No Show" && tour.type !== "show/evento" && (!tour.guides || tour.guides === "")) {
        newInvalidTours.push(index);
      }
    });

    if (newInvalidTours.length > 0) {
      isValid = false;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Todos os tours precisam ter guias associados",
      });
    }
    setInvalidTours(newInvalidTours);
    return isValid;
  }, [employees, getToursByGuide, tours]);

  const submitDayOrderPayments = useCallback(async () => {
    if (!validateInfosToPayment()) return;

    //Save content first
    let body = employees;
    body.forEach((item) => {
      let deleted = true;
      for (const property in item) {
        if (
          property !== "id" &&
          property !== "dayOrderId" &&
          property !== "deleted" &&
          item[property] !== "" &&
          item[property]
        )
          deleted = false;
      }
      item.deleted = deleted;
    });

    fetch(`${API_URL}day-order/update-employees.php`, {
      method: "POST",
      body: JSON.stringify({
        employees: employees,
        dayOrderId: dayOrder.id,
        comments: dayOrder.comments,
        lastEditBy: userName,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.error) {
          //Calculate day order payments
          fetch(`${API_URL}day-order/calculate-payments.php`, {
            method: "POST",
            body: JSON.stringify({
              dayOrderId: dayOrder.id,
              lastEditBy: userName,
            }),
          })
            .then((response) => response.json())
            .then((response) => {
              if (!response.error) {
                MySwal.fire({
                  title: <p>Sucesso</p>,
                  html: (
                    <i>
                      Ordem do dia finalizada e pagamentos inseridos na lista
                    </i>
                  ),
                  icon: "success",
                }).then(() => {
                  return navigate(0);
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Algo deu errado!",
                  text: response.message,
                });
              }
            });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Algo deu errado!",
          });
        }
      });
  }, [employees, dayOrder, userName, validateInfosToPayment]);

  const associateGuideToTour = useCallback(() => {
    setAssociateGuideModalOpened(false);
    fetch(`${API_URL}day-order/associate-guide-to-tour.php`, {
      method: "POST",
      body: JSON.stringify({
        guide: guideToAssociateToTour,
        tourHour: tourToAssociateGuide.tourHour,
        activity: tourToAssociateGuide.activity,
        language: tourToAssociateGuide.language,
        dayOrderId: dayOrder.id,
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
          Swal.fire("Guia associado com sucesso!!", "", "success").then(() => {
            return navigate(0);
          });
        }
      });
  }, [tourToAssociateGuide, guideToAssociateToTour, dayOrder]);

  const getFunctionIndex = useCallback(
    (employeeFunction, employeeId) => {
      return employeeFunction
        ? ` - ${
            employees
              .filter((employee) => employee.function === employeeFunction)
              .indexOf(employees.find((emp) => emp.id === employeeId)) + 1
          }`
        : "";
    },
    [employees]
  );

  const moveTo = useCallback((id) => {
    return navigate(`/editar-ordem-do-dia?id=${id}`);
  }, []);

  const isBlocked = useMemo(() => {
    let blocked = false;
    let dayOrderDay = new Date(dayOrder.date);
    let now = new Date();
    if (
      userPermissions === 5 ||
      (userPermissions !== 4 &&
        userPermissions !== 2 &&
        now - dayOrderDay > 39 * 3600000)
    )
      blocked = true;
    return blocked;
  }, [dayOrder, userPermissions]);

  useEffect(() => {
    fetch(`${API_URL}day-order/list-by-id.php?day_order_id=${dayOrderId}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.error) {
          setDayOrder(response.infos);
          let transformedEmployees = response.employees;
          transformedEmployees.forEach((emp) => {
            if (functionsOptions.find((func) => func.name === emp.function)) {
              let newAvaialableEmployees = employeesOptions;
              newAvaialableEmployees = newAvaialableEmployees.filter(
                (employee) => employee.function === emp.function
              );
              emp.namesOptions = newAvaialableEmployees;
            }
            emp.deleted = emp.deleted === "1" ? true : false;
          });
          setEmployees(transformedEmployees);
        }
      });
  }, [dayOrderId, functionsOptions.length]);

  useEffect(() => {
    if (dayOrder && dayOrder.id) {
      fetch(
        `${API_URL}day-order/list-tours-by-dayorder-id.php?id=${dayOrder.id}`,
        {
          method: "GET",
        }
      )
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            setTours(response.data);
          }
        });

      fetch(`${API_URL}day-order/list-functions.php`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          setFunctionsOptions(response);
        });

      fetch(`${API_URL}day-order/list-employees-options.php`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          setEmployeesOptions(response);
        });
    }
  }, [dayOrder]);


  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()} reset={reset}>
        <PrintDocMark>
          {isBlocked && (
            <Blocked>
              <span>Edição permitida apenas para o financeiro</span>
            </Blocked>
          )}
          <LastEdit>
            {dayOrder.lastEditBy
              ? `Editado por último por ${dayOrder.lastEditBy}`
              : ""}
          </LastEdit>
          <PrintDoc ref={printRef}>
            <Logo
              src={LogoImg}
              sidebarclosed={sidebarClosed.toString()}
              style={{ marginBottom: 10 }}
            />
            <HeaderText>carnavalexperience.com.br</HeaderText>
            <HeaderText>Reservas:(21)967659549</HeaderText>
            <SubTitle>
              Ordem do Dia {dayOrder?.formatedDate}{" "}
              {weekDays[dayOrder?.weekDay]}
            </SubTitle>
            <Tables>
              <Table className="tours-list">
                <thead>
                  <tr>
                    <th></th>
                    <th>Duração</th>
                    <th>Início</th>
                    <th>Atividade</th>
                    <th>Grupo</th>
                    <th>Pax</th>
                    <th>Idioma</th>
                    <th>Guia</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((item, index) => (
                    <TourListTooltip title="Abrir Funções" placement="right">
                      <tr
                        onClick={() => openFunctionsTour(item)}
                        className={
                          invalidTours.indexOf(index) !== -1
                            ? "invalid pointer"
                            : "pointer"
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{item.duration}</td>
                        <td>{item.tourHour}</td>
                        <td>{item.activity}</td>
                        <td>{item.numberOfGroups || 1}</td>
                        <td>{item.paxTotal}</td>
                        <td>{item.language}</td>
                        <td>{item.guides}</td>
                      </tr>
                    </TourListTooltip>
                  ))}
                </tbody>
              </Table>
              <Table>
                <thead>
                  <tr>
                    {columnsNames.map((column) => {
                      return <th key={column.code}>{column.name}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employees
                    .filter((emp) => !emp.deleted)
                    .map((employee, index) => (
                      <EmployeeLine
                        key={`employee-line-${employee.id || index}`}
                        className={
                          employee.comments.toLowerCase() === "bloqueio"
                            ? "bloqueio"
                            : employee.comments !== ""
                            ? "dayoff"
                            : invalidEmployees.indexOf(employee.id) !== -1
                            ? "invalid"
                            : ""
                        }
                      >
                        <td>
                          {employee.function === "Guia" ? (
                            <TextField
                              id={`employee-input-${employee.id}-function`}
                              variant="outlined"
                              name="function"
                              type="text"
                              value={`${employee.function} ${getFunctionIndex(
                                employee.function,
                                employee.id
                              )}`}
                              inputProps={{ readOnly: true }}
                            />
                          ) : (
                            <Autocomplete
                              id={`employee-input-${employee.id}-function`}
                              freeSolo
                              options={functionsOptions
                                .filter((func) => func.name !== "Guia")
                                .map((func) => func.name)}
                              name="function"
                              value={`${employee.function}${getFunctionIndex(
                                employee.function,
                                employee.id
                              )}`}
                              onChange={(event, newValue) => {
                                onchange(employee.id, {
                                  target: { name: "function", value: newValue },
                                });
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  name="function"
                                  onChange={onchange}
                                  placeholder="Função"
                                />
                              )}
                            />
                          )}
                        </td>

                        <td>
                          {employee.function === "Guia" ? (
                            <TextField
                              id={`employee-input-${employee.id}-name`}
                              variant="outlined"
                              name="name"
                              type="text"
                              value={employee.name}
                              inputProps={{ readOnly: true }}
                            />
                          ) : (
                            <Autocomplete
                              id={`employee-input-${employee.id}-name`}
                              freeSolo
                              options={
                                employee.namesOptions
                                  ? employee.namesOptions.map(
                                      (employee) => employee.name
                                    )
                                  : []
                              }
                              name="name"
                              value={employee.name}
                              onChange={(event, newValue) => {
                                onchange(employee.id, {
                                  target: { name: "name", value: newValue },
                                });
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  name="name"
                                  onChange={onchange}
                                  placeholder="Nome"
                                />
                              )}
                            />
                          )}
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-tours`}
                            variant="outlined"
                            name="tours"
                            type="text"
                            value={getToursByGuide(employee.name)}
                            inputProps={{ readOnly: true }}
                            className="guide-tours"
                          />
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-prevision`}
                            variant="outlined"
                            name="prevision"
                            type="time"
                            value={employee.prevision}
                            onChange={(e) => {
                              onchange(employee.id, e);
                            }}
                          />
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-arrival`}
                            variant="outlined"
                            name="arrival"
                            type="time"
                            value={employee.arrival}
                            onChange={(e) => {
                              onchange(employee.id, e);
                            }}
                          />
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-departure`}
                            variant="outlined"
                            name="departure"
                            type="time"
                            value={employee.departure}
                            onChange={(e) => {
                              onchange(employee.id, e);
                            }}
                          />
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-phone`}
                            variant="outlined"
                            name="phone"
                            type="text"
                            value={employee.phone}
                            onChange={(e) => {
                              onchange(employee.id, e);
                            }}
                          />
                        </td>
                        <td>
                          <TextField
                            id={`employee-input-${employee.id}-comments`}
                            variant="outlined"
                            name="comments"
                            type="text"
                            value={employee.comments}
                            onChange={(e) => {
                              onchange(employee.id, e);
                            }}
                          />
                        </td>
                      </EmployeeLine>
                    ))}
                </tbody>
              </Table>
              <Textarea
                minRows={4}
                placeholder="Observações"
                id="dayOrderComments"
                name="dayOrderComments"
                onChange={(e) => onchangeComments(e)}
                value={dayOrder?.comments}
              />
            </Tables>
          </PrintDoc>
          <DonwloadDoc ref={downloadRef}>
            <table>
              <tr>carnavalexperience.com.br</tr>
              <tr>Reservas:(21)967659549</tr>
              <tr>
                Ordem do Dia {dayOrder?.formatedDate} -
                {weekDays[dayOrder?.weekDay]}
              </tr>
            </table>
            <Tables>
              <Table className="tours-list">
                <thead>
                  <tr>
                    <th></th>
                    <th>Duração</th>
                    <th>Início</th>
                    <th>Atividade</th>
                    <th>Grupo</th>
                    <th>Pax</th>
                    <th>Idioma</th>
                    <th>Guia</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((item, index) => (
                    <TourListTooltip title="Abrir Funções" placement="right">
                      <tr
                        onClick={() => openFunctionsTour(item)}
                        className={
                          invalidTours.indexOf(index) !== -1
                            ? "invalid pointer"
                            : "pointer"
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{item.duration}</td>
                        <td>{item.tourHour}</td>
                        <td>{item.activity}</td>
                        <td>{item.numberOfGroups || 1}</td>
                        <td>{item.paxTotal}</td>
                        <td>{item.language}</td>
                        <td>{item.guides}</td>
                      </tr>
                    </TourListTooltip>
                  ))}
                  <tr></tr>
                  <tr></tr>
                  <tr></tr>
                </tbody>
              </Table>
              <Table>
                <thead>
                  <tr>
                    {columnsNames.map((column) => {
                      return <th key={column.code}>{column.name}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employees
                    .filter((emp) => !emp.deleted)
                    .map((employee, index) => (
                      <EmployeeLine
                        key={`download-employee-line-${employee.id || index}`}
                        className={
                          employee.comments.toLowerCase() === "bloqueio"
                            ? "bloqueio"
                            : employee.comments !== ""
                            ? "dayoff"
                            : invalidEmployees.indexOf(employee.id) !== -1
                            ? "invalid"
                            : ""
                        }
                      >
                        <td>{employee.function}</td>

                        <td>{employee.name}</td>
                        <td>{getToursByGuide(employee.name)}</td>
                        <td>{employee.prevision}</td>
                        <td>{employee.arrival}</td>
                        <td>{employee.departure}</td>
                        <td>{employee.phone}</td>
                        <td>{employee.comments}</td>
                      </EmployeeLine>
                    ))}
                </tbody>
              </Table>
              <Textarea
                minRows={4}
                placeholder="Observações"
                id="dayOrderComments"
                name="dayOrderComments"
                onChange={(e) => onchangeComments(e)}
                value={dayOrder?.comments}
              />
            </Tables>
          </DonwloadDoc>
        </PrintDocMark>
        <ButtonArea>
          <div>
            {dayOrder.prev && (
              <Button variant="outlined" onClick={() => moveTo(dayOrder.prev)}>
                Dia anterior
              </Button>
            )}
          </div>
          <div>
            {!isBlocked && <AddEmployeeIcon onClick={() => newEmployee()} />}
            {!isBlocked && (
              <Button variant="outlined" onClick={() => saveEmployees()}>
                Salvar
              </Button>
            )}
            <Button variant="outlined" onClick={() => handlePrint()}>
              Imprimir
            </Button>
            <DownloadTableExcel
              filename={`Ordem-do-dia-${dayOrder?.formatedDate}`}
              sheet="tours-list"
              currentTableRef={downloadRef.current}
            >
              <Button variant="outlined">Exportar para Excel</Button>
            </DownloadTableExcel>
            {!isBlocked && [2, 4].indexOf(userPermissions) !== -1 && (
              <Button
                variant="outlined"
                onClick={() => submitDayOrderPayments()}
              >
                Finalizar e gerar pagamentos
              </Button>
            )}
          </div>
          <div>
            {dayOrder.next && (
              <Button variant="outlined" onClick={() => moveTo(dayOrder.next)}>
                Próximo dia
              </Button>
            )}
          </div>
        </ButtonArea>
      </Content>
      <Modal
        open={associateGuideModalOpened}
        onClose={() => setAssociateGuideModalOpened(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <ModalBox>
          <FormControl fullWidth>
            <InputLabel id="guide-to-associate-to-tour-label">Guia</InputLabel>
            <Select
              labelId="guide-to-associate-to-tour-label"
              id="guide-to-associate-to-tour"
              name="guide-to-associate-to-tour"
              label="Guia"
              open={selectGuideSelectIsOpened}
              onOpen={() => setSelectGuideSelectIsOpened(true)}
              onClose={() => setSelectGuideSelectIsOpened(false)}
              multiple
              renderValue={(selected) => selected.join(", ")}
              value={guideToAssociateToTour}
              onChange={handleSetGuideToAssociateToTour}
            >
              {employees
                .filter((emp) => emp.function === "Guia")
                .map((guide) => (
                  <MenuItem key={guide.name} value={guide.name}>
                    <Checkbox
                      checked={guideToAssociateToTour.indexOf(guide.name) > -1}
                    />
                    <ListItemText primary={guide.name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => associateGuideToTour()}
            style={{ marginTop: 20 }}
          >
            Salvar
          </Button>
        </ModalBox>
      </Modal>
    </Main>
  );
};

export default DayOrderEdit;
