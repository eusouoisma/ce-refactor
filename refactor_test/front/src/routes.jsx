import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/Routes/Private';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Default from './pages/Default';
import TourInput from './pages/TourInput';
import TourList from './pages/TourList';
import TourUpdate from './pages/TourUpdate';
import CanceledList from './pages/CanceledList';
import SummaryTourList from './pages/SummaryTourList';
import PrintList from './pages/PrintList';
import FinancialTourInput from './pages/FinancialTourInput';
import FinancialTourList from './pages/FinancialTourList';
import FinancialTourUpdate from './pages/FinancialTourUpdate';
import CustomerInput from './pages/CustomerInput';
import CustomerUpdate from './pages/CustomerUpdate';
import CustomersList from './pages/CustomersList';
import ComissionList from './pages/ComissionList';
import ComissionUpdate from './pages/ComissionUpdate';
import DayOrderList from './pages/DayOrderList';
import DayOrderEdit from './pages/DayOrderEdit';
import DayOrderCalendar from './pages/DayOrderCalendar';
import DayOrderPayments from './pages/DayOrderPayments';
import DayOrderSettings from './pages/DayOrderSettings';
import ProductInput from './pages/ProductInput';
import ProductList from './pages/ProductList';
import ProductUpdate from './pages/ProductUpdate';
import Settings from './pages/Settings';
import Users from './pages/Users';
import MyUser from './pages/MyUser';
import QuickSearch from './pages/QuickSearch';
import AnalysisByCountry from './pages/AnalysisByCountry';
import AnalysisByCustomers from './pages/AnalysisByCustomers';
import AnalysisByHour from './pages/AnalysisByHour';
import AnalysisByProduct from './pages/AnalysisByProduct';
import PlanneTourImport from './pages/PlanneTourImport';

const P = (perms, Child) => (
  <PrivateRoute permissions={perms}><Child /></PrivateRoute>
);

const PE = (perms, Child) => (
  <ErrorBoundary>
    <PrivateRoute permissions={perms}><Child /></PrivateRoute>
  </ErrorBoundary>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Default /></PrivateRoute>} />
      <Route path="/quick-search" element={P([1,2,4,5,7], QuickSearch)} />
      <Route path="/cadastrar-tour" element={P([1,2,4,5,7], TourInput)} />
      <Route path="/importar-planne" element={P([1,2,4,5,7], PlanneTourImport)} />
      <Route path="/listar-tours" element={P([1,2,4,5,7], TourList)} />
      <Route path="/editar-tour" element={P([1,2,4,5,7], TourUpdate)} />
      <Route path="/tours-cancelados" element={P([1,2,3,4,5,7], CanceledList)} />
      <Route path="/listar-tours-resumido" element={P([1,2,3,4,5,7], SummaryTourList)} />
      <Route path="/imprimir-lista" element={P([1,2,4,5,7], PrintList)} />
      <Route path="/cadastrar-tour-financeiro" element={P([2,4,5], FinancialTourInput)} />
      <Route path="/listar-tours-financeiro" element={P([2,4,5], FinancialTourList)} />
      <Route path="/editar-tour-financeiro" element={P([2,4,5], FinancialTourUpdate)} />
      <Route path="/cadastrar-cliente" element={P([1,2,3,4,5,7], CustomerInput)} />
      <Route path="/listar-clientes" element={P([1,2,3,4,5,7], CustomersList)} />
      <Route path="/editar-cliente" element={P([1,2,3,4,5,7], CustomerUpdate)} />
      <Route path="/listar-comissoes" element={P([1,2,3,4,5,7], ComissionList)} />
      <Route path="/editar-comissao" element={P([1,2,3,4,5,7], ComissionUpdate)} />
      <Route path="/ordem-do-dia" element={P([1,2,3,4,5,7], DayOrderList)} />
      <Route path="/editar-ordem-do-dia" element={P([1,2,3,4,5,7], DayOrderEdit)} />
      <Route path="/calendario-ordem-do-dia" element={P([1,2,3,4,5,7], DayOrderCalendar)} />
      <Route path="/pagamentos-ordem-do-dia" element={P([2,4,5], DayOrderPayments)} />
      <Route path="/opcoes-ordem-do-dia" element={P([1,2,3,4,5,7], DayOrderSettings)} />
      <Route path="/cadastrar-produto" element={P([1,2,3,4,5,7], ProductInput)} />
      <Route path="/cadastrar-adicional" element={P([1,2,3,4,5,7], ProductInput)} />
      <Route path="/listar-produtos" element={P([1,2,3,4,5,7], ProductList)} />
      <Route path="/listar-adicionais" element={P([1,2,3,4,5,7], ProductList)} />
      <Route path="/editar-produto" element={P([1,2,3,4,5,7], ProductUpdate)} />
      <Route path="/configuracoes" element={P([1,2,4,5,7], Settings)} />
      <Route path="/usuarios" element={P([4,5], Users)} />
      <Route path="/meu-usuario" element={P([1,2,3,4,5,6,7], MyUser)} />
      <Route path="/analises-por-pais" element={PE([2,4,5,6,7], AnalysisByCountry)} />
      <Route path="/analises-por-cliente" element={PE([2,4,5,6,7], AnalysisByCustomers)} />
      <Route path="/analises-por-hora" element={PE([2,4,5,6,7], AnalysisByHour)} />
      <Route path="/analises-por-produto" element={PE([2,4,5,6,7], AnalysisByProduct)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
