import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { COLORS } from './colors';

export const sectionColors = {
  Tours:          '#ff642e',
  Financeiro:     '#00c875',
  Clientes:       '#a25ddc',
  Produtos:       '#0086c0',
  'Ordem do Dia': '#fdab3d',
  Análises:       '#e2445c',
  Admin:          '#676879',
};

export const menuItems = [
  { label: 'Início',        path: '/',              icon: HomeRoundedIcon,                 permissions: [1,2,3,4,5,6,7] },
  { label: 'Busca Rápida',  path: '/quick-search',  icon: SearchRoundedIcon,               permissions: [1,2,4,5,7] },
  { label: 'Tours', icon: ConfirmationNumberRoundedIcon, color: sectionColors['Tours'], children: [
    { label: 'Cadastrar Tour',       path: '/cadastrar-tour',            permissions: [1,2,4,5,7] },
    { label: 'Importar da Planne',   path: '/importar-planne',           permissions: [1,2,4,5,7] },
    { label: 'Planne Webhook',       path: '/planne-webhook',            permissions: [1,2,4,5,7] },
    { label: 'Listar Tours',         path: '/listar-tours',              permissions: [1,2,4,5,7] },
    { label: 'Lista Resumida',        path: '/listar-tours-resumido',     permissions: [1,2,3,4,5,7] },
    { label: 'Cancelados',           path: '/tours-cancelados',          permissions: [1,2,4,5,7] },
    { label: 'Imprimir Lista',       path: '/imprimir-lista',            permissions: [1,2,4,5,7] },
    { label: 'Comissões',            path: '/listar-comissoes',          permissions: [1,2,4,5,7] },
  ]},
  { label: 'Financeiro', icon: AccountBalanceWalletRoundedIcon, color: sectionColors['Financeiro'], children: [
    { label: 'Novo Tour Financeiro', path: '/cadastrar-tour-financeiro', permissions: [2,4,5] },
    { label: 'Listar Financeiro',    path: '/listar-tours-financeiro',   permissions: [2,4,5] },
  ]},
  { label: 'Clientes', icon: GroupsRoundedIcon, color: sectionColors['Clientes'], children: [
    { label: 'CRM', path: '/listar-clientes', permissions: [1,2,4,5,7] },
  ]},
  { label: 'Produtos', icon: CategoryRoundedIcon, color: sectionColors['Produtos'], children: [
    { label: 'Novo Produto',      path: '/cadastrar-produto',   permissions: [1,2,4,5,7] },
    { label: 'Listar Produtos',   path: '/listar-produtos',     permissions: [1,2,4,5,7] },
    { label: 'Novo Adicional',    path: '/cadastrar-adicional', permissions: [1,2,4,5,7] },
    { label: 'Listar Adicionais', path: '/listar-adicionais',   permissions: [1,2,4,5,7] },
  ]},
  { label: 'Ordem do Dia', icon: EventNoteRoundedIcon, color: sectionColors['Ordem do Dia'], children: [
    { label: 'Calendário',     path: '/ordem-do-dia',            permissions: [1,2,3,4,5,7] },
    { label: 'Configurações',  path: '/opcoes-ordem-do-dia',     permissions: [1,2,3,4,5,7] },
    { label: 'Pagamentos',     path: '/pagamentos-ordem-do-dia', permissions: [2,4,5] },
  ]},
  { label: 'Análises', icon: InsightsRoundedIcon, color: sectionColors['Análises'], children: [
    { label: 'Por Cliente', path: '/analises-por-cliente',   permissions: [2,4,5,6,7] },
    { label: 'Por País',    path: '/analises-por-pais',      permissions: [2,4,5,6,7] },
    { label: 'Por Hora',    path: '/analises-por-hora',      permissions: [2,4,5,6,7] },
    { label: 'Por Produto', path: '/analises-por-produto',   permissions: [2,4,5,6,7] },
  ]},
  { label: 'Meu Usuário', path: '/meu-usuario', icon: AccountCircleRoundedIcon, permissions: [1,2,3,4,5,6,7] },
  { label: 'Admin', icon: ManageAccountsRoundedIcon, color: sectionColors['Admin'], children: [
    { label: 'Configurações', path: '/configuracoes', permissions: [1,2,4,5,7] },
    { label: 'Usuários',      path: '/usuarios',      permissions: [4,5] },
  ]},
];

export const ALL_MENU_PATHS = (() => {
  const paths = new Set();
  for (const item of menuItems) {
    if (item.path) paths.add(item.path);
    if (item.children) item.children.forEach(c => paths.add(c.path));
  }
  return [...paths];
})();

export function hasMenuAccess(item, perm) {
  return !item.permissions || item.permissions.includes(perm);
}

/** Todos os destinos do sidebar que o perfil pode acessar */
export function getAccessibleMenuDestinations(perm) {
  const p = parseInt(perm, 10);
  const result = [];

  for (const item of menuItems) {
    if (item.path && hasMenuAccess(item, p)) {
      result.push({
        path: item.path,
        label: item.label,
        section: null,
        icon: item.icon,
        color: item.color || COLORS.primary,
      });
    }
    if (item.children) {
      for (const child of item.children) {
        if (hasMenuAccess(child, p)) {
          result.push({
            path: child.path,
            label: child.label,
            section: item.label,
            icon: item.icon,
            color: item.color || COLORS.primary,
          });
        }
      }
    }
  }
  return result;
}

export function getDestinationByPath(perm) {
  const map = {};
  getAccessibleMenuDestinations(perm).forEach(d => { map[d.path] = d; });
  return map;
}

export function resolveShortcutPaths(paths, perm) {
  const byPath = getDestinationByPath(perm);
  return (Array.isArray(paths) ? paths : [])
    .filter(path => byPath[path])
    .map(path => byPath[path]);
}

const DEFAULT_ORDER = [
  '/listar-tours',
  '/quick-search',
  '/listar-tours-financeiro',
  '/listar-clientes',
  '/ordem-do-dia',
  '/analises-por-cliente',
  '/listar-produtos',
  '/listar-tours-resumido',
  '/meu-usuario',
];

export function getDefaultShortcutPaths(perm) {
  const accessible = new Set(getAccessibleMenuDestinations(perm).map(d => d.path));
  const picked = DEFAULT_ORDER.filter(p => accessible.has(p));
  if (picked.length > 0) return picked;
  return [...accessible].slice(0, 6);
}
