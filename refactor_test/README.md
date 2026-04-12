# CE System — Refatoração Node.js + React

Refatoração completa do sistema legado PHP + MySQL para **Node.js + Express + PostgreSQL** (backend) e **React + Vite + MUI** (frontend).

---

## Estrutura

```
/workspaces/ce-refactor/refactor_test/
├── back/          ← Backend Node.js + Express + PostgreSQL
├── front/         ← Frontend React + Vite + MUI
└── audit/         ← Auditoria do sistema legado
```

---

## Backend

### Tecnologias
- Node.js + Express.js
- PostgreSQL (via `pg` / node-postgres)
- JWT-compatible auth (token de 40 chars em DB, sliding window 4h)
- bcryptjs para hashes de senha

### Setup

1. **Criar banco PostgreSQL:**
   ```bash
   createdb ce_system
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cd back
   cp .env.example .env
   # Edite .env com suas credenciais
   ```

   Exemplo de `.env`:
   ```
   DATABASE_URL=postgresql://postgres:senha@localhost:5432/ce_system
   PORT=3001
   NODE_ENV=development
   ```

3. **Instalar dependências:**
   ```bash
   cd back
   npm install
   ```

4. **Rodar migrations (criar tabelas):**
   ```bash
   cd back
   node -e "require('./src/db').runMigrations().then(() => process.exit(0))"
   ```
   Ou use psql diretamente:
   ```bash
   psql -d ce_system -f migrations/001_initial_schema.sql
   ```

5. **Iniciar servidor:**
   ```bash
   cd back
   npm start       # produção
   npm run dev     # desenvolvimento (nodemon)
   ```

   Backend disponível em: `http://localhost:3001`

---

## Frontend

### Tecnologias
- React 18 + Vite
- MUI (Material UI) v5
- React Router v6
- SweetAlert2
- react-number-format (campos monetários)

### Setup

1. **Configurar API URL:**

   Crie um arquivo `.env` em `front/`:
   ```
   VITE_API_URL=http://localhost:3001
   ```

   Por padrão usa `http://localhost:3001` se não configurado.

2. **Instalar dependências:**
   ```bash
   cd front
   npm install
   ```

3. **Iniciar em desenvolvimento:**
   ```bash
   cd front
   npm run dev
   ```

   Frontend disponível em: `http://localhost:3000`

4. **Build para produção:**
   ```bash
   cd front
   npm run build
   ```

---

## Criar primeiro usuário admin

Após rodar as migrations, crie um usuário admin via API:

```bash
curl -X POST http://localhost:3001/users/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","name":"Administrador","permissions":"4","password":"suasenha"}'
```

---

## Arquitetura do Backend

```
back/src/
├── app.js                    ← Express app, CORS, registro de rotas
├── db.js                     ← Pool pg, helpers formatDate, getTodaySP
├── middleware/
│   ├── auth.js               ← Verificação de token (sliding window 4h)
│   └── errorHandler.js       ← Handler global de erros
└── routes/
    ├── tours.js              ← CRUD completo de tours (office + financial)
    ├── customers.js          ← CRUD de clientes e contatos
    ├── comissions.js         ← CRUD de comissões
    ├── products.js           ← CRUD de produtos e variantes
    ├── settings.js           ← Configurações do sistema
    ├── dayOrder.js           ← Ordem do dia (funcionários, pagamentos, etc.)
    ├── reports.js            ← Análises e relatórios
    ├── quickSearch.js        ← Busca rápida
    ├── changeRequests.js     ← Change requests de tours
    ├── numberOfGroups.js     ← Número de grupos
    └── users.js              ← Autenticação e gestão de usuários
```

---

## Páginas do Frontend (30+1)

| Rota | Componente | Permissões |
|------|------------|------------|
| `/login` | Login | Pública |
| `/` | Default | Todas |
| `/quick-search` | QuickSearch | 1,2,4,5 |
| `/cadastrar-tour` | TourInput | 1,2,4,5 |
| `/listar-tours` | TourList | 1,2,4,5 |
| `/editar-tour` | TourUpdate | 1,2,4,5 |
| `/tours-cancelados` | CanceledList | 1,2,3,4,5 |
| `/listar-tours-resumido` | SummaryTourList | 1,2,3,4,5 |
| `/imprimir-lista` | PrintList | 1,2,4,5 |
| `/cadastrar-tour-financeiro` | FinancialTourInput | 2,4,5 |
| `/listar-tours-financeiro` | FinancialTourList | 2,4,5 |
| `/editar-tour-financeiro` | FinancialTourUpdate | 2,4,5 |
| `/cadastrar-cliente` | CustomerInput | 1,2,3,4,5 |
| `/listar-clientes` | CustomersList | 1,2,3,4,5 |
| `/editar-cliente` | CustomerUpdate | 1,2,3,4,5 |
| `/listar-comissoes` | ComissionList | 1,2,3,4,5 |
| `/editar-comissao` | ComissionUpdate | 1,2,3,4,5 |
| `/ordem-do-dia` | DayOrderList | 1,2,3,4,5 |
| `/editar-ordem-do-dia` | DayOrderEdit | 1,2,3,4,5 |
| `/calendario-ordem-do-dia` | DayOrderCalendar | 1,2,3,4,5 |
| `/pagamentos-ordem-do-dia` | DayOrderPayments | 2,4,5 |
| `/opcoes-ordem-do-dia` | DayOrderSettings | 1,2,3,4,5 |
| `/cadastrar-produto` | ProductInput | 1,2,3,4,5 |
| `/listar-produtos` | ProductList | 1,2,3,4,5 |
| `/editar-produto` | ProductUpdate | 1,2,3,4,5 |
| `/configuracoes` | Settings | 1,2,4,5 |
| `/usuarios` | Users | 4,5 |
| `/meu-usuario` | MyUser | 1,2,3,4,5,6 |
| `/analises-por-pais` | AnalysisByCountry | 2,4,5,6 |
| `/analises-por-cliente` | AnalysisByCustomers | 2,4,5,6 |
| `/analises-por-hora` | AnalysisByHour | 2,4,5,6 |
| `/analises-por-produto` | AnalysisByProduct | 2,4,5,6 |

---

## Regras de Negócio Implementadas

Todas as 45 regras de negócio (RN-001 a RN-045) foram implementadas conforme o arquivo `audit/business-rules.md`:

- **RN-001:** `orderRef` gerado automaticamente como `CE` + 4 dígitos zero-padded
- **RN-002:** `dayOrder 'Tour Principal'` criado automaticamente ao criar tour
- **RN-003:** Campos financeiros no UPDATE dependem da data (América/São Paulo)
- **RN-005:** Cliente novo criado automaticamente ao criar tour
- **RN-006:** `numberOfGroups = ceil(paxAdult/30)` para privativos
- **RN-007:** Comissão criada automaticamente ao marcar tour como comissionado
- **RN-009:** Token expira após 4h de inatividade (sliding window)
- **RN-010:** Login deleta tokens anteriores, cria novo token de 40 chars
- **RN-016:** `tour.year` = `currentYear` das settings
- **RN-017:** `origin = 'office'` ou `'financial'` conforme tipo de formulário
- **RN-025:** Cancelamento via soft delete
- **RN-026:** Change requests armazenados e processados no update-financial
- **RN-029:** Timezone America/São Paulo para comparação de datas
- **RN-030:** Cálculo automático de preço via variantes no frontend
- **RN-032:** Permissão 5 não pode cancelar ou editar tours
- **RN-037:** Contatos de clientes substituídos integralmente no update
- **RN-038:** Variantes de produto substituídas integralmente no update
- **RN-045:** Sistema de permissões por número 1-6

---

## Diferenças da versão PHP

| Aspecto | PHP (legado) | Node.js (novo) |
|---------|--------------|----------------|
| ORM | PDO/mysqli direto | pg pool direto |
| Auth | Token em BD (40 chars) | Token em BD (40 chars) ✓ |
| Banco | MySQL | PostgreSQL |
| Arrays CSV | `implode(",", array)` | String concatenada |
| Frontend | CRA (Create React App) | Vite (mais rápido) |
| Build | Sem build step | `npm run build` |

---

## Notas Técnicas

- O sistema usa tokens de sessão no banco de dados (não JWT), idêntico ao legado
- CORS totalmente aberto (`*`) para compatibilidade com o legado
- O `ceGuide` é armazenado como string CSV (`"Guia1,Guia2"`) por compatibilidade
- O `country` é armazenado como string (`"Brasil, Argentina"`) por compatibilidade
- Timezone `America/Sao_Paulo` usado para comparações de data (RN-003, RN-029)
