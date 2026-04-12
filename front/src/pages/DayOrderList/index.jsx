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
} from "@mui/material";

import Sidebar from "../../components/Sidebar";
import {
  EditButton,
  Main,
  SubTitle,
  Table,
  Tables,
  Title,
} from "./dayorderlist";
import { Content } from "../../utils/stylesbase";

import StoreContext from "../../components/Store/Context";
import DayOrderCalendar from "../DayOrderCalendar";
import { API_URL } from "../../utils/env";

const DayOrderList = () => {
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

  const [dayOrders, setDayOrders] = useState([]);
  const [reset, setReset] = useState(0);

  const tableRef = useRef(null);

  const { sidebarClosed, userName, setSidebarClosed } =
    useContext(StoreContext);

  const columnsNames = [
    {
      code: "day",
      name: "Data",
    },
    {
      code: "weekDay",
      name: "Dia da Semana",
    },
    {
      code: "actions",
      name: "",
    },
  ];

  const editDayOrder = useCallback((id) => {
    navigate(`/editar-ordem-do-dia?id=${id}`);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}day-order/list-active.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        setDayOrders(response);
      });
  }, []);

  useEffect(() => {
    setSidebarClosed(true);
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <SubTitle>Ordens do Dia</SubTitle>
        <Title>Listar</Title>
        <DayOrderCalendar dayOrders={dayOrders} editDayOrder={editDayOrder} />
      </Content>
    </Main>
  );
};

export default DayOrderList;
