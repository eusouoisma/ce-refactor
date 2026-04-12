# ui-inventory.md — Inventário Completo de Páginas do Frontend

> Framework: React 18 | UI: MUI (Material UI) + Joy UI | Router: react-router-dom  
> API base: variável `API_URL` de `utils/env.jsx`

---

## /login
**Componente:** `pages/Login/index.jsx`  
**Permissões:** Pública

### Campos do formulário
| Campo | Tipo | Nome |
|---|---|---|
| Username | text (TextField) | username |
| Senha | password (TextField com toggle visibility) | password |

### Botões e ações
- **Entrar** (submit) → POST `users/login.php` → salva token+permissões no storage → navega para `/`

### Regras de exibição condicional
- Botão de toggle de visibilidade da senha
- Em caso de erro: Swal de erro

---

## /
**Componente:** `pages/Default/index.jsx`  
**Permissões:** Todas autenticadas  
**Descrição:** Página inicial/dashboard padrão (sem funcionalidade específica documentada no código)

---

## /quick-search
**Componente:** `pages/QuickSearch/index.jsx`  
**Rota:** `/quick-search`  
**Permissões:** [1, 2, 4, 5]

### Campos do formulário
| Campo | Tipo | Nome |
|---|---|---|
| Nº de Reserva (autocomplete) | text | reserva |
| Cliente (autocomplete) | text | cliente |

### Botões e ações
- **Pesquisar** → POST `quick-search/search.php` (autocomplete) e POST `quick-search/search-tours.php` (resultados completos)
- **Editar tour** (por ID) → navega para `/editar-tour?id=`
- **Cancelar tour** → POST `tours/cancel.php?id=`

### Endpoints consumidos
- `POST quick-search/search.php` → sugestões de reserva/cliente
- `POST quick-search/search-tours.php` → lista completa de tours encontrados

### Regras de exibição condicional
- Resultados aparecem apenas após busca
- Tabela com dados do tour exibida após pesquisa

---

## /cadastrar-tour
**Componente:** `pages/TourInput/index.jsx`  
**Permissões:** [1, 2, 4, 5]

### Campos do formulário (variam por tipo de tour)

**Campos comuns:**
| Campo | Tipo | Nome |
|---|---|---|
| Tipo | Select | type (regular/privativo/show/evento) |
| Nº da Reserva | text | orderRef |
| Alta Temporada | Checkbox | isHighSeason |
| Plataforma | Autocomplete (freeSolo) | platform |
| Atividade | Autocomplete (freeSolo, filtrado por type) | activity |
| Adicional | Autocomplete (freeSolo, category=adicional) | adicional |
| Data do tour | date | tourDate |
| Hora do Tour | time | tourHour |
| País(es) | Autocomplete (múltiplo) | country |
| Assunto do Email | text (só se platform=Email) | emailSubject |

**Campos tipo Regular:**
| Campo | Tipo | Nome |
|---|---|---|
| Duração | text | duration |
| Idioma | Autocomplete (freeSolo) | language |
| Local | Autocomplete (freeSolo) | local |
| Status de Reserva | Autocomplete (freeSolo) | status |
| Tipo de Ingresso | Select dinâmico (paxAdult/paxHalf/paxFree/paxNet/paxBrazilian) | — |
| Quantidade | number | — |
| Moeda | Autocomplete (freeSolo) | currency |
| Método de Pagamento | Autocomplete (freeSolo) | paymentMethod |
| Status de Pagamento | Autocomplete (freeSolo) | paymentStatus |
| Valor Total | MoneyInput (NumericFormat) | totalValue |
| Cliente | Autocomplete (freeSolo) | client |
| Nome do Cliente | Autocomplete (com contatos do cliente) | clientName |
| Contato do Cliente | text | clientContact |
| Nome do Guia | text | companionName |
| Contato do Guia | text | companionContact |
| Guia do CE | Select (múltiplo com Checkbox) | ceGuide |
| Comissionado | Checkbox | commissioned |
| Observações | Textarea | comments |
| Histórico da Conversa | Textarea | conversationHistory |

**Campos tipo Privativo (adicional ao regular):**
| Campo | Tipo | Nome |
|---|---|---|
| Número de Pax | number | paxAdult |
| Número de Grupos | number | numberOfGroups |

**Campos tipo Show/Evento:** similar ao regular mas sem campos de pax específicos e sem idioma

**Modal de Comissão:**
| Campo | Tipo | Nome |
|---|---|---|
| Nome do Comissionado | text | comissionersName |
| Contato do Comissionado | text | comissionersContact |
| Moeda | Select | comissionCurrency |
| Valor da Comissão | text | comissionPrice |
| Pago? | Checkbox | comissionPaid |
| Calcular por porcentagem? | Checkbox | comissionByPercentage |
| Percentual | number (condicional) | comissionPercentage |

### Botões e ações
- **Salvar** → POST `tours/create.php` → navega para `/listar-tours`
- **Salvar e Criar Outra** → POST `tours/create.php` → reload (navigate(0))
- **OK (modal comissão)** → fecha modal

### Endpoints consumidos (carregamento inicial)
- `GET settings/platforms.php`
- `GET products/list-all.php`
- `GET settings/languages.php`
- `GET settings/status.php`
- `GET settings/currencies.php`
- `GET settings/payment-methods.php`
- `GET settings/payment-status.php`
- `GET settings/locals.php`
- `GET settings/guides.php`
- `GET customers/list-grouped.php`
- `GET settings/countries.php`

### Regras de exibição condicional
- Campos específicos aparecem apenas para o tipo selecionado (regular/privativo/show/evento)
- Campo `emailSubject` visível apenas se `platform === 'Email'`
- Campo `comissionPercentage` visível apenas se `comissionByPercentage === true`
- Modal de comissão abre automaticamente ao marcar "Comissionado"
- Se cliente não existir, exibe Swal para selecionar tipo (Agência/Guia/Cliente Final)
- Novo tipo de pax é adicionado dinamicamente ao informar quantidade > 0 na última linha

---

## /listar-tours
**Componente:** `pages/TourList/index.jsx`  
**Permissões:** [1, 2, 4, 5]

### Campos de filtro/controle
| Campo | Tipo | Descrição |
|---|---|---|
| Ano | number | Filtro de ano |
| Meses (Switch por mês) | Switch x 12 | Seleciona meses a exibir |
| Pesquisa por coluna | text | Dentro do painel de filtro |

### Colunas da tabela
Status, Data, Dia, Horário, Atividade, Adicional, Adulto, NET, Brasileiro, Meia, Free, Total, Nº Grupos, Idioma, Cliente, Nº Reserva, Guia CE, Moeda, Valor, Pagamento, Status de Pagamento, Nome Cliente, Contato Cliente, Nome Guia, Contato Guia, Local, Plataforma, Nome Email, Comissão, Obs, Histórico da Conversa, País, Data do Registro, Criado por, Editado por

### Botões e ações
- **Exportar para Excel** → `react-export-table-to-excel`
- **Resetar Filtros** → reseta filtros para todos
- **Cancelar Selecionadas (N)** → aparece quando >1 linha selecionada → POST `tours/cancel-multiple.php`
- **Editar** (por linha) → navega para `/editar-tour?id=`
- **Cancelar** (por linha) → Swal com input de motivo → POST `tours/cancel.php`
- Clique em linha → seleciona/deseleciona para cancelamento em lote

### Endpoints consumidos
- `GET tours/list-all.php?months=...&year=...`

### Regras de exibição condicional
- Linhas selecionadas ficam com fundo amarelo
- Botão "Cancelar Selecionadas" só aparece com >1 linha selecionada
- Coluna Valor exibe `formatMoney(totalValue)` apenas para regulares; exibe "-" para demais
- Coluna Nº Grupos: vazia para regulares; valor para demais
- Tooltip com comentário na coluna Status se `comments !== ""`
- Permissão 5 bloqueia cancelamento

---

## /editar-tour
**Componente:** `pages/TourUpdate/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [1, 2, 4, 5]

### Campos (similares ao TourInput mais)
- Todos os campos do TourInput
- Tabela de Change Requests com colunas: tipo, nome, valor antigo, valor novo, aprovar, reprovar

### Botões e ações
- **Salvar** → POST `tours/update.php?id=` → navega para `/listar-tours` ou reload
- **Salvar Financeiro** → redireciona para `/listar-tours-financeiro` (para tours financeiros)
- **Excluir Comissão** → GET `comissions/delete.php?id=`
- **Aprovar/Reprovar Change Request** (por linha da tabela)

### Endpoints consumidos (carregamento inicial)
- Todos os mesmos do TourInput
- `GET tours/list-by-id.php?tour_id=`

### Regras de exibição condicional
- Tabela de change requests visível se existirem
- Se tour for financeiro (origin='financial') → redireciona para `/listar-tours-financeiro`
- Campos habilitados/desabilitados conforme permissão e tipo de tour

---

## /cadastrar-tour-financeiro
**Componente:** `pages/FinancialTourInput/index.jsx`  
**Permissões:** [2, 4, 5]

### Campos do formulário
| Campo | Tipo | Nome |
|---|---|---|
| Tipo | Select | type |
| Empresa | Autocomplete | company |
| Nº Fatura | text | invoiceNumber |
| Status | Autocomplete | status |
| Status Pgto | Autocomplete | paymentStatus |
| Nº Conta | Autocomplete | accountNumber |
| Data Pgto | date | paymentDate |
| Data Tour | date | tourDate |
| Hora Tour | time | tourHour |
| Atividade | Autocomplete | activity |
| Adicional | text | adicional |
| Alta Temporada | Checkbox | isHighSeason |
| Cliente | text | client |
| Nome Cliente | text | clientName |
| Contato Cliente | text | clientContact |
| Nº Reserva | text | orderRef |
| Método Pagamento | Autocomplete | paymentMethod |
| Moeda | Autocomplete | currency |
| Valor Total | MoneyInput | totalValue |
| Valor Líquido | MoneyInput | netValue |
| Comentários Financeiros | Textarea | financialComments |
| Comissionado | Checkbox | commissioned |
| Observações | Textarea | comments |
| Histórico | Textarea | conversationHistory |

### Botões e ações
- **Salvar** → POST `tours/create-financial.php` → navega para `/listar-tours-financeiro`
- **Salvar e Criar Outra** → reload

### Endpoints consumidos (carregamento)
- `GET products/list-all.php`
- `GET settings/status.php`
- `GET settings/currencies.php`
- `GET settings/payment-methods.php`
- `GET settings/payment-status.php`
- `GET settings/companies.php`
- `GET settings/account-numbers.php`

---

## /listar-tours-financeiro
**Componente:** `pages/FinancialTourList/index.jsx`  
**Permissões:** [2, 4, 5]

### Controles
- Filtro de ano (number)
- Switches de meses
- Filtro por coluna

### Colunas
Similar ao TourList + campos financeiros: lateCheck, empresa, fatura, conta, data pgto, valor líquido, comentários financeiros

### Botões e ações
- **Exportar Excel**
- **Editar** → `/editar-tour-financeiro?id=`
- **Cancelar** (individual e em lote)
- **Marcar Late Check** → POST `tours/mark-as-late-check.php?id=`

### Endpoints consumidos
- `GET tours/list-all-financial.php?months=...&year=...`
- `POST tours/mark-as-late-check.php?id=`

---

## /editar-tour-financeiro
**Componente:** `pages/FinancialTourUpdate/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [2, 4, 5]

### Campos
Todos os campos do FinancialTourInput + tabela de Change Requests (com aprovar/reprovar)

### Botões e ações
- **Salvar** → POST `tours/update-financial.php?id=`
- **Excluir Comissão** → GET `comissions/delete.php?id=`

### Endpoints consumidos
- Todos os do FinancialTourInput
- `GET tours/list-by-id.php?tour_id=`
- `GET changeRequests/get-by-tour-id.php?tour_id=`

---

## /listar-tours-resumido
**Componente:** `pages/SummaryTourList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos de controle
- Filtro ano (number)
- Switches de meses

### Colunas
Data, Horário, Tipo, Atividade, Duração, Idioma, Guias, Pax Total, Nº Grupos

### Botões e ações
- **Editar Nº Grupos** (inline) → POST `numberOfGroups/create.php`
- Clique em linha de regular → modal com lista de clientes (GET `tours/list-clients-by-date-and-hour.php`)

### Endpoints consumidos
- `GET tours/list-all-summary.php?months=...&year=...`
- `GET tours/list-clients-by-date-and-hour.php?date=&hour=`
- `POST numberOfGroups/create.php`

---

## /tours-cancelados
**Componente:** `pages/CanceledList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Controles
- Filtro ano, switches de meses, filtro por coluna

### Botões e ações
- **Editar** → `/editar-tour?id=`
- **Descancelar** → POST `tours/uncancel.php?id=` → navega para `/listar-tours`

### Endpoints consumidos
- `GET tours/list-canceled.php?months=...&year=...`

---

## /listar-comissoes
**Componente:** `pages/ComissionList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Controles
- Filtro ano, switches de meses, filtro por coluna

### Colunas
Data Tour, Nº Reserva, Nome Comissionado, Contato, Moeda, Valor, Pago

### Botões e ações
- **Editar** → `/editar-comissao?id=`
- **Excluir** → GET `comissions/delete.php?id=`
- **Marcar Pago** → GET `comissions/pay.php?id=&lastEditBy=`
- **Marcar Não Pago** → GET `comissions/unpay.php?id=&lastEditBy=`

### Endpoints consumidos
- `GET comissions/list-all.php?months=...&year=...`

---

## /editar-comissao
**Componente:** `pages/ComissionUpdate/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos
| Campo | Tipo | Nome |
|---|---|---|
| Nº Reserva | text | orderRef |
| Nome Comissionado | text | comissionersName |
| Contato | text | comissionersContact |
| Moeda | Select | comissionCurrency |
| Valor | text | comissionPrice |
| Pago | Checkbox | comissionPaid |

### Botões e ações
- **Salvar** → POST `comissions/update.php?id=` → navega para `/listar-comissoes`

### Endpoints consumidos
- `GET comissions/list-by-id.php?comission_id=`
- `GET settings/currencies.php`

---

## /cadastrar-cliente
**Componente:** `pages/CustomerInput/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos
| Campo | Tipo | Nome |
|---|---|---|
| Tipo de Cliente | Select | customerType (Agencia/Guia/ClienteFinal) |
| Nome do Cliente | text | customerName |
| **Seção Contatos (repetível):** | | |
| Nome do Contato | text | contacts[i].name |
| Telefone/Contato | text | contacts[i].contact |
| Cargo/Função | text | contacts[i].office |
| Email | text | contacts[i].email |

### Botões e ações
- **Adicionar Contato** (+) → adiciona novo bloco de contato
- **Salvar** → POST `customers/create.php`
- **Salvar e Criar Outro** → reload

### Endpoints consumidos
- `POST customers/create.php`

---

## /listar-clientes
**Componente:** `pages/CustomersList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Colunas
ID Cliente, Nome Cliente, Tipo, ID Contato, Nome Contato, Telefone, Cargo, Email

### Botões e ações
- **Editar** (cliente) → `/editar-cliente?id=`
- **Excluir contato** (por ID do contato) → GET `customers/delete.php?id=`

### Endpoints consumidos
- `GET customers/list-all.php`

---

## /editar-cliente
**Componente:** `pages/CustomerUpdate/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos
Mesmos do CustomerInput (pré-preenchidos)

### Botões e ações
- **Salvar** → POST `customers/update.php`
- **Cancelar** → navega para `/listar-clientes`

### Endpoints consumidos
- `GET customers/list-by-id.php?customer_id=`
- `POST customers/update.php`

---

## /cadastrar-produto
**Componente:** `pages/ProductInput/index.jsx`  
**Parâmetro (opcional):** `?category=adicional`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos
| Campo | Tipo | Nome |
|---|---|---|
| Tipo | Select | type (regular/privativo/show/evento) |
| Categoria | hidden/auto | category (atividade/adicional) |
| Nome do Produto | text | productName |
| Duração | text | duration |
| **Variantes (repetível):** | | |
| Tipo de Preço | Select | pricingType (person/group) |
| Preço Adulto | number | priceAdult |
| Preço Meia | number | priceHalf |
| Preço NET | number | priceNet |
| Preço Brasileiro | number | priceBrazilian |
| Preço Cortesia | number | priceFree |
| Preço Grupo | number | priceGroup |
| Limite Pax | number | paxLimit |
| (mesmos campos HighSeason) | number | price*HighSeason |

### Botões e ações
- **Adicionar Variante** (+) → adiciona nova variante
- **Salvar** → POST `products/create.php`
- **Salvar e Criar Outro** → reload

---

## /listar-produtos
**Componente:** `pages/ProductList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Colunas
Nome, Tipo, Categoria, Duração, Variante, Tipo Preço, Preços (adulto, meia, net, brasileiro, cortesia, grupo, HighSeason)

### Botões e ações
- **Editar** → `/editar-produto?id=`
- **Excluir** → GET `products/delete.php?id=`

### Endpoints consumidos
- `GET products/list-all.php`

---

## /editar-produto
**Componente:** `pages/ProductUpdate/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [1, 2, 3, 4, 5]

### Campos
Mesmos do ProductInput

### Endpoints consumidos
- `GET products/list-by-id.php?product_id=`
- `POST products/update.php`

---

## /ordem-do-dia
**Componente:** `pages/DayOrderList/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Colunas
Data, Dia da Semana, Nome, Comentários

### Botões e ações
- **Editar** → `/editar-ordem-do-dia?id=`

### Endpoints consumidos
- `POST day-order/list-active.php`

---

## /editar-ordem-do-dia
**Componente:** `pages/DayOrderEdit/index.jsx`  
**Parâmetro:** `?id=`  
**Permissões:** [1, 2, 3, 4, 5]

### Seções
1. **Informações da Ordem do Dia** (data, nome, comentários)
2. **Tours do Dia** (tabela com horário, atividade, duração, idioma, guias, pax)
3. **Funcionários escalados** (função, nome, previsão, chegada, saída, telefone, obs)

### Campos de funcionários
| Campo | Tipo | Nome |
|---|---|---|
| Função | Select (dayOrderEmployeesFunctions) | function |
| Nome | Autocomplete (dayOrderEmployeesList) | name |
| Previsão | time | prevision |
| Chegada | time | arrival |
| Saída | time | departure |
| Telefone | text | phone |
| Observações | text | comments |

### Botões e ações
- **Adicionar Funcionário** → POST `day-order/create-employee.php`
- **Salvar** → POST `day-order/update-employees.php`
- **Calcular Pagamentos** → (salva primeiro) → POST `day-order/calculate-payments.php`
- **Separar em outra Ordem do Dia** (por slot de tour) → POST `day-order/split-tours-to-another-day-order.php`
- **Retornar ao Original** (por slot de tour) → POST `day-order/return-tour-to-original-day-order.php`
- **Associar Guia** (por slot de tour) → POST `day-order/associate-guide-to-tour.php`
- **Anterior / Próximo** (navegação entre datas) → navega para `/editar-ordem-do-dia?id=prev/next`
- **Excluir** funcionário (por linha)

### Endpoints consumidos
- `GET day-order/list-by-id.php?day_order_id=`
- `GET day-order/list-tours-by-dayorder-id.php?id=`
- `GET day-order/list-functions.php`
- `GET day-order/list-employees-options.php`
- `POST day-order/create-employee.php`
- `POST day-order/update-employees.php`
- `POST day-order/calculate-payments.php`
- `POST day-order/split-tours-to-another-day-order.php`
- `POST day-order/return-tour-to-original-day-order.php`
- `POST day-order/associate-guide-to-tour.php`

---

## /opcoes-ordem-do-dia
**Componente:** `pages/DayOrderSettings/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5]

### Seções
1. **Funções** (CRUD de funções de funcionários)
2. **Opções de Funcionários** (CRUD de funcionários no catálogo)
3. **Remunerações** (CRUD de remunerações por função/atividade)

### Campos Função
| Campo | Tipo |
|---|---|
| Nome | text |
| Número de Ordem | number |

### Campos Opção de Funcionário
| Campo | Tipo |
|---|---|
| Nome | text |
| Função | Select |
| Tipo | text (Fixo/etc) |
| Telefone | text |

### Campos Remuneração
| Campo | Tipo |
|---|---|
| Função (functionId) | Select |
| Tipo Pagamento | Select (day/hour/special) |
| Atividade | Select |
| Valor 1 (≤8h ou base) | number |
| Valor 2 (≤10h) | number |
| Valor 3 (>10h) | number |

### Endpoints consumidos
- `GET day-order/list-functions.php`
- `GET day-order/list-employees-options.php`
- `GET day-order/list-remunerations.php`
- `GET day-order/list-activities.php`
- `POST day-order/create-function.php`
- `POST day-order/edit-function.php`
- `GET day-order/delete-function.php?id=`
- `POST day-order/create-employee-option.php`
- `POST day-order/edit-employee-option.php`
- `GET day-order/delete-employee.php?id=`
- `POST day-order/create-remuneration.php`
- `GET day-order/delete-remuneration.php?id=`

---

## /pagamentos-ordem-do-dia
**Componente:** `pages/DayOrderPayments/index.jsx`  
**Permissões:** [2, 4, 5]

### Controles
- Filtro ano, switches de meses

### Colunas
Data, Função, Funcionário, Chegada, Saída, Atividade, Hora Tour, Valor, Comentários

### Botões e ações
- **Editar Valor** (inline) → POST `day-order/change-individual-payment.php`
- **Editar Comentário** (inline) → POST `day-order/change-individual-comments.php`

### Endpoints consumidos
- `GET day-order/list-all-payments.php?months=...&year=...`
- `POST day-order/change-individual-payment.php`
- `POST day-order/change-individual-comments.php`

---

## /analises-por-cliente
**Componente:** `pages/AnalysisByCustomers/index.jsx`  
**Permissões:** [2, 4, 5, 6]

### Campos de filtro
| Campo | Tipo |
|---|---|
| Data Inicial | date |
| Data Final | date |
| Pesquisar Cliente | text |
| Ordenar por | Select (pax/valor) |
| De (paginação) | number |
| Até (paginação) | number |

### Endpoint consumido
- `POST reports/analysis-by-customers.php`

### Retorno exibido
Tabela: #, Cliente, Moeda, Pax, % Pax, Valor Total, % Valor

---

## /analises-por-pais
**Componente:** `pages/AnalysisByCountry/index.jsx`  
**Permissões:** [2, 4, 5, 6]

### Campos de filtro
| Campo | Tipo |
|---|---|
| Data Inicial | date |
| Data Final | date |
| Ordenar por | Select |
| De / Até | number |

### Endpoint consumido
- `POST reports/analysis-by-country.php`

### Retorno exibido
Tabela: #, País, Moeda, Pax, % Pax, Valor Total, % Valor

---

## /analises-por-hora
**Componente:** `pages/AnalysisByHour/index.jsx`  
**Permissões:** [2, 4, 5, 6]

### Campos de filtro
| Campo | Tipo |
|---|---|
| Data Inicial | date |
| Data Final | date |
| Dia da Semana | Select (DOM/SEG/TER/QUA/QUI/SEX/SAB/ALL) |
| Atividades | Checkbox múltiplo |

### Endpoints consumidos
- `GET reports/available-activities.php`
- `POST reports/analysis-by-hour.php`
- `POST reports/analysis-by-weekday.php`

### Retorno exibido
- Gráfico/tabela de pax por hora do dia
- Gráfico/tabela de pax por dia da semana

---

## /analises-por-produto
**Componente:** `pages/AnalysisByProduct/index.jsx`  
**Permissões:** [2, 4, 5, 6]

### Campos de filtro
| Campo | Tipo |
|---|---|
| Data Inicial | date |
| Data Final | date |
| Ordenar por | Select |
| De / Até | number |

### Endpoints consumidos
- `POST reports/analysis-by-product.php` (paginado)
- `POST reports/analysis-by-product.php` (totais)
- `POST reports/analysis-regular-tour.php`

### Retorno exibido
- Tabela por produto: atividade, moeda, pax, % pax, valor, % valor
- Análise detalhada do tour regular (adulto, meia, cortesia, net)

---

## /configuracoes
**Componente:** `pages/Settings/index.jsx`  
**Permissões:** [1, 2, 4, 5]

### Campos
| Campo | Tipo | Descrição |
|---|---|---|
| Tipo | Select | Tipo da configuração |
| Valor | text | Valor da configuração |

### Botões e ações
- **Adicionar** → POST `settings/create.php`
- **Excluir** (por linha) → GET `settings/delete.php?id=`
- **Logout All Users** → GET `users/logout-all.php` → navega para `/login`

### Endpoints consumidos
- `GET settings/list-all.php`

---

## /usuarios
**Componente:** `pages/Users/index.jsx`  
**Permissões:** [4, 5]

### Campos para novo usuário
| Campo | Tipo |
|---|---|
| Username | text |
| Nome | text |
| Permissões | Select (1-6) |
| Senha | password |

### Botões e ações
- **Criar Usuário** → POST `users/create.php`
- **Excluir** → GET `users/delete.php?id=`

### Endpoints consumidos
- `GET users/list-all.php`
- `POST users/create.php`
- `GET users/delete.php?id=`

---

## /meu-usuario
**Componente:** `pages/MyUser/index.jsx`  
**Permissões:** [1, 2, 3, 4, 5, 6]

### Campos
| Campo | Tipo |
|---|---|
| Username | text |
| Nome | text |
| Nova Senha | password (opcional) |

### Botões e ações
- **Salvar** → POST `users/update.php`

---

## /imprimir-lista
**Componente:** `pages/PrintList/index.jsx`  
**Permissões:** [1, 2, 4, 5]

### Campos de controle
| Campo | Tipo | Descrição |
|---|---|---|
| Data | date | selectedDate |
| Horário | Select | selectedHour |

### Endpoints consumidos
- `GET tours/available-hours.php?date=&type=regular&status=Confirmado`
- `GET tours/regular-list.php?date=&hour=`

### Retorno exibido
Tabela para impressão com: N, Agência/Guia, Adulto, NET, Brasileiro, Meia, Free, Total, Nome Pax, Guia, Pagamento, Valor Total, Comissão, Status Pgto, Obs
