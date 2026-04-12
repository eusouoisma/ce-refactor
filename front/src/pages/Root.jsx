import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import StoreProvider from "../components/Store/Provider";
import RoutesPrivate from "../components/Routes/Private/Private";

import Login from "./Login";
import TourInput from "./TourInput";
import Settings from "./Settings";
import TourList from "./TourList";
import ProductInput from "./ProductInput";
import ProductList from "./ProductList";
import FinancialTourList from "./FinancialTourList";
import FinancialTourUpdate from "./FinancialTourUpdate";
import TourUpdate from "./TourUpdate";
import FinancialTourInput from "./FinancialTourInput";
import CanceledList from "./CanceledList";
import ComissionsList from "./ComissionList";
import ComissionUpdate from "./ComissionUpdate";
import CustomerInput from "./CustomerInput";
import CustomersList from "./CustomersList";
import SummaryTourList from "./SummaryTourList";
import MyUser from "./MyUser";
import Users from "./Users";
import CustomerUpdate from "./CustomerUpdate";
import ProductUpdate from "./ProductUpdate";
import Default from "./Default";
import DayOrderList from "./DayOrderList";
import DayOrderEdit from "./DayOrderEdit";
import DayOrderSettings from "./DayOrderSettings";
import DayOrderPayments from "./DayOrderPayments";
import AnalysisByCustomers from "./AnalysisByCustomers";
import AnalysisByCountries from "./AnalysisByCountry";
import AnalysisByHour from "./AnalysisByHour";
import AnalysisByProduct from "./AnalysisByProduct";
import QuickSearch from "./QuickSearch";
import PrintList from "./PrintList";

const PagesRoot = () => (
  <BrowserRouter>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StoreProvider>
        <Routes>
          <Route path="/" element={<RoutesPrivate component={Default} />} />
          <Route
            path="/quick-search"
            element={
              <RoutesPrivate component={QuickSearch} permissions={[1, 2, 4, 5]} />
            }
          />
          <Route
            path="/cadastrar-tour"
            element={
              <RoutesPrivate component={TourInput} permissions={[1, 2, 4, 5]} />
            }
          />
          <Route
            path="/listar-tours"
            element={
              <RoutesPrivate component={TourList} permissions={[1, 2, 4, 5]} />
            }
          />
          <Route
            path="/editar-tour"
            element={
              <RoutesPrivate
                component={TourUpdate}
                permissions={[1, 2, 4, 5]}
              />
            }
          />
          <Route
            path="/cadastrar-tour-financeiro"
            element={
              <RoutesPrivate
                component={FinancialTourInput}
                permissions={[2, 4, 5]}
              />
            }
          />
          <Route
            path="/listar-tours-financeiro"
            element={
              <RoutesPrivate
                component={FinancialTourList}
                permissions={[2, 4, 5]}
              />
            }
          />
          <Route
            path="/editar-tour-financeiro"
            element={
              <RoutesPrivate
                component={FinancialTourUpdate}
                permissions={[2, 4, 5]}
              />
            }
          />
          <Route
            path="/listar-tours-resumido"
            element={
              <RoutesPrivate
                component={SummaryTourList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/tours-cancelados"
            element={
              <RoutesPrivate
                component={CanceledList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/cadastrar-cliente"
            element={
              <RoutesPrivate
                component={CustomerInput}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/listar-clientes"
            element={
              <RoutesPrivate
                component={CustomersList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/editar-cliente"
            element={
              <RoutesPrivate
                component={CustomerUpdate}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/cadastrar-produto"
            element={
              <RoutesPrivate
                component={ProductInput}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/listar-produtos"
            element={
              <RoutesPrivate
                component={ProductList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/editar-produto"
            element={
              <RoutesPrivate
                component={ProductUpdate}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/listar-comissoes"
            element={
              <RoutesPrivate
                component={ComissionsList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/editar-comissao"
            element={
              <RoutesPrivate
                component={ComissionUpdate}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/configuracoes"
            element={
              <RoutesPrivate component={Settings} permissions={[1, 2, 4, 5]} />
            }
          />
          <Route
            path="/usuarios"
            element={<RoutesPrivate component={Users} permissions={[4, 5]} />}
          />
          <Route
            path="/meu-usuario"
            element={
              <RoutesPrivate component={MyUser} permissions={[1, 2, 3, 4, 5, 6]} />
            }
          />
          <Route
            path="/ordem-do-dia"
            element={
              <RoutesPrivate
                component={DayOrderList}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/opcoes-ordem-do-dia"
            element={
              <RoutesPrivate
                component={DayOrderSettings}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/editar-ordem-do-dia"
            element={
              <RoutesPrivate
                component={DayOrderEdit}
                permissions={[1, 2, 3, 4, 5]}
              />
            }
          />
          <Route
            path="/pagamentos-ordem-do-dia"
            element={
              <RoutesPrivate
                component={DayOrderPayments}
                permissions={[2, 4, 5]}
              />
            }
          />
          <Route
            path="/analises-por-cliente"
            element={
              <RoutesPrivate
                component={AnalysisByCustomers}
                permissions={[2, 4, 5, 6]}
              />
            }
          />
          <Route
            path="/analises-por-pais"
            element={
              <RoutesPrivate
                component={AnalysisByCountries}
                permissions={[2, 4, 5, 6]}
              />
            }
          />
          <Route
            path="/analises-por-hora"
            element={
              <RoutesPrivate
                component={AnalysisByHour}
                permissions={[2, 4, 5, 6]}
              />
            }
          />
          <Route
            path="/analises-por-produto"
            element={
              <RoutesPrivate
                component={AnalysisByProduct}
                permissions={[2, 4, 5, 6]}
              />
            }
          />
          <Route
            path="/imprimir-lista"
            element={
              <RoutesPrivate
                component={PrintList}
                permissions={[1, 2, 4, 5]}
              />
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </StoreProvider>
    </LocalizationProvider>
  </BrowserRouter>
);

export default PagesRoot;
