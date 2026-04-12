import React, { useState, useCallback, useContext, useMemo } from "react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MuseumIcon from "@mui/icons-material/Museum";
import BookIcon from "@mui/icons-material/Book";
import InventoryIcon from "@mui/icons-material/Inventory";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BarChartIcon from '@mui/icons-material/BarChart';
import AlarmIcon from "@mui/icons-material/Alarm";
import { useNavigate } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';

import StoreContext from "../Store/Context";

import LogoImg from "../../assets/logo-ce.png";
import {
  Main,
  Logo,
  NavigationItem,
  NavigationItemUl,
  Navigation,
  NavigationSubItem,
  NavigationItemTitle,
  CloseSidebarButton,
  ExitButton,
  GoBackButton,
  OpenSidebarButton,
  StickySidebar,
  DayOrderCountDown,
} from "./sidebar";
import { Tooltip } from "@mui/material";
import { CalendarMonth, SettingsSuggestRounded } from "@mui/icons-material";
import { useEffect } from "react";

const Sidebar = () => {
  const [navItemsOpened, setNavItemsOpened] = useState([]);
  const [dayOrderCountdownMessage, setDayOrderCountdonwMessage] =
    useState(null);

  const { sidebarClosed, toggleSidebar, setToken, userPermissions } =
    useContext(StoreContext);

  const navigate = useNavigate();

  const toggleNavItem = useCallback(
    (name) => {
      if (navItemsOpened.includes(name)) {
        let aux = navItemsOpened;
        aux = aux.filter((item) => item !== name);
        setNavItemsOpened(aux);
      } else {
        setNavItemsOpened([...navItemsOpened, name]);
      }
    },
    [navItemsOpened]
  );

  const logout = useCallback(() => {
    setToken();
  }, []);

  // useEffect(() => {
  //   setInterval(() => {
  //     const date = new Date();
  //     const hours = date.getHours();
  //     const minutes = date.getMinutes();
  //     const seconds = date.getSeconds();
  //     if (hours >= 8 && hours < 12) {
  //       const yesterday = new Date();
  //       yesterday.setDate(yesterday.getDate() - 1);

  //       setDayOrderCountdonwMessage({
  //         yesterday: yesterday.toLocaleDateString(),
  //         hours: (11 - hours).toString().padStart(2, "0"),
  //         minutes: (59 - minutes).toString().padStart(2, "0"),
  //         seconds: (59 - seconds).toString().padStart(2, "0"),
  //       });
  //     } else {
  //       setDayOrderCountdonwMessage(null);
  //     }
  //   }, 1000);
  // });

  return (
    <Main sidebarclosed={sidebarClosed.toString()}>
      <StickySidebar>
        <ExitButton onClick={logout}>Logout</ExitButton>
        <Logo src={LogoImg} sidebarclosed={sidebarClosed.toString()} />
        {sidebarClosed ? (
          <Tooltip title="Open Sidebar" placement="right">
            <OpenSidebarButton onClick={() => toggleSidebar()} />
          </Tooltip>
        ) : (
          <Tooltip title="Close Sidebar" placement="right">
            <CloseSidebarButton onClick={() => toggleSidebar()} />
          </Tooltip>
        )}
        <Tooltip title="Back Page" placement="right">
          <GoBackButton
            sidebarclosed={sidebarClosed.toString()}
            onClick={() => navigate(-1)}
          />
        </Tooltip>

        <Navigation sidebarclosed={sidebarClosed.toString()}>
          <NavigationItem
            hide={([1, 2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle>
              <a href="/quick-search">
                <SearchIcon />
                BUSCA RÁPIDA
              </a>
            </NavigationItemTitle>
          </NavigationItem>
          <NavigationItem
            hide={([1, 2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("tours")}
              opened={navItemsOpened.includes("tours").toString()}
            >
              <MuseumIcon />
              TOURS
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("tours").toString()}
            >
              <NavigationSubItem>
                <a href="/cadastrar-tour">Cadastrar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-tours">Listar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-tours-resumido">Lista Resumida</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/tours-cancelados">Cancelados</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-comissoes">Comissões</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/imprimir-lista">Imprimir Lista</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([3].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("tours")}
              opened={navItemsOpened.includes("tours").toString()}
            >
              <MuseumIcon />
              TOURS
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("tours").toString()}
            >
              <NavigationSubItem>
                <a href="/listar-tours-resumido">Lista Resumida</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("financeiro")}
              opened={navItemsOpened.includes("financeiro").toString()}
            >
              <AttachMoneyIcon />
              FINANCEIRO
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("financeiro").toString()}
            >
              <NavigationSubItem>
                <a href="/cadastrar-tour-financeiro">Cadastrar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-tours-financeiro">Listar</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([1, 2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("clientes")}
              opened={navItemsOpened.includes("clientes").toString()}
            >
              <BookIcon />
              CLIENTES
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("clientes").toString()}
            >
              <NavigationSubItem>
                <a href="/cadastrar-cliente">Cadastrar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-clientes">Listar</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([1, 2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("produtos")}
              opened={navItemsOpened.includes("produtos").toString()}
            >
              <InventoryIcon />
              PRODUTOS
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("produtos").toString()}
            >
              <NavigationSubItem>
                <a href="/cadastrar-produto">Cadastrar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-produtos">Listar</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/cadastrar-produto?category=adicional">Cadastrar Adicional</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/listar-produtos?category=adicional">Listar Adicionais</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([6].indexOf(userPermissions) !== -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("ordem-do-dia")}
              opened={navItemsOpened.includes("ordem-do-dia").toString()}
            >
              <CalendarMonth />
              ORDEM DO DIA
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("ordem-do-dia").toString()}
            >
              <NavigationSubItem>
                <a href="/ordem-do-dia">Calendário</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/opcoes-ordem-do-dia">Configurações</a>
              </NavigationSubItem>
              <NavigationSubItem
                hide={([2, 4, 5].indexOf(userPermissions) === -1).toString()}
              >
                <a href="/pagamentos-ordem-do-dia">Pagamentos</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([2, 4, 5, 6].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle
              subitems="true"
              onClick={() => toggleNavItem("relatorios")}
              opened={navItemsOpened.includes("relatorios").toString()}
            >
              <BarChartIcon />
              RELATÓRIOS
            </NavigationItemTitle>
            <NavigationItemUl
              opened={navItemsOpened.includes("relatorios").toString()}
            >
              <NavigationSubItem>
                <a href="/analises-por-cliente">Por Cliente</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/analises-por-pais">Por País</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/analises-por-hora">Por Dia</a>
              </NavigationSubItem>
              <NavigationSubItem>
                <a href="/analises-por-produto">Por Produto</a>
              </NavigationSubItem>
            </NavigationItemUl>
          </NavigationItem>
          <NavigationItem
            hide={([1, 2, 4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle>
              <a href="/configuracoes">
                <SettingsSuggestRounded /> CONFIGURACOES
              </a>
            </NavigationItemTitle>
          </NavigationItem>
          <NavigationItem
            hide={([4, 5].indexOf(userPermissions) === -1).toString()}
          >
            <NavigationItemTitle>
              <a href="/usuarios">
                <PersonRoundedIcon />
                USUÁRIOS
              </a>
            </NavigationItemTitle>
          </NavigationItem>
          <NavigationItem>
            <NavigationItemTitle>
              <a href="/meu-usuario">
                <PersonRoundedIcon />
                MEU USUÁRIO
              </a>
            </NavigationItemTitle>
          </NavigationItem>
        </Navigation>
        {/* {!!dayOrderCountdownMessage && (
          <DayOrderCountDown sidebarclosed={sidebarClosed.toString()}>
            <span className="title">
              Ordem do dia {dayOrderCountdownMessage.yesterday} fechando em
            </span>
            <span className="hours">{dayOrderCountdownMessage.hours}</span>
            <span className="minutes">{dayOrderCountdownMessage.minutes}</span>
            <span className="seconds">{dayOrderCountdownMessage.seconds}</span>
          </DayOrderCountDown>
        )} */}
      </StickySidebar>
    </Main>
  );
};

export default Sidebar;
