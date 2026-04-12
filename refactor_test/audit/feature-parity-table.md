# feature-parity-table.md — Tabela de Paridade de Funcionalidades

| # | Funcionalidade | Arquivo Backend | Arquivo Frontend | Observações |
|---|---|---|---|---|
| 1 | Login de usuário | back/users/login.php | pages/Login/index.jsx | Token de 40 chars, apaga tokens anteriores |
| 2 | Verificação e renovação de token | back/users/getUser.php | components/Store/Provider.jsx | Sliding window 4h, timezone SP |
| 3 | Logout de todos os usuários | back/users/logout-all.php | pages/Settings/index.jsx | Admin only |
| 4 | Criar usuário | back/users/create.php | pages/Users/index.jsx | Verifica username duplicado; password_hash |
| 5 | Listar usuários | back/users/list-all.php | pages/Users/index.jsx | Filtro deleted=0 |
| 6 | Excluir usuário | back/users/delete.php | pages/Users/index.jsx | Hard delete |
| 7 | Atualizar dados do usuário (próprio) | back/users/update.php | pages/MyUser/index.jsx | Usa token para identificar userId |
| 8 | Criar tour (office) | back/tours/create.php | pages/TourInput/index.jsx | Auto-orderRef, auto-dayOrder, auto-customer, auto-comission |
| 9 | Listar tours (office) | back/tours/list-all.php | pages/TourList/index.jsx | Filtro por mês/ano; paginação de filtros no frontend |
| 10 | Editar tour (office) | back/tours/update.php | pages/TourUpdate/index.jsx | Lógica condicional de campos financeiros (RN-003) |
| 11 | Cancelar tour (individual) | back/tours/cancel.php | pages/TourList/index.jsx, pages/QuickSearch/index.jsx | Soft delete com motivo |
| 12 | Cancelar tours em lote | back/tours/cancel-multiple.php | pages/TourList/index.jsx | Prepared statement com IN() |
| 13 | Descancelar tour | back/tours/uncancel.php | pages/CanceledList/index.jsx | Retorna canceled=0 |
| 14 | Listar tours cancelados | back/tours/list-canceled.php | pages/CanceledList/index.jsx | Filtro canceled=1 |
| 15 | Criar tour (financeiro) | back/tours/create-financial.php | pages/FinancialTourInput/index.jsx | origin='financial'; campos company/invoice/account/netValue |
| 16 | Listar tours financeiros | back/tours/list-all-financial.php | pages/FinancialTourList/index.jsx | Sem filtro por origin |
| 17 | Editar tour financeiro | back/tours/update-financial.php | pages/FinancialTourUpdate/index.jsx | Lida com change requests (approve/reprove) |
| 18 | Marcar tour como Late Check | back/tours/mark-as-late-check.php | pages/FinancialTourList/index.jsx | Campo lateCheck=1 |
| 19 | Buscar tour por ID | back/tours/list-by-id.php | pages/TourUpdate/index.jsx, pages/FinancialTourUpdate/index.jsx | Retorna comissão e changeRequests |
| 20 | Lista resumida de tours | back/tours/list-all-summary.php | pages/SummaryTourList/index.jsx | UNION regulares(agrupados) + demais(por ID) |
| 21 | Buscar horários disponíveis (regular) | back/tours/available-hours.php | pages/PrintList/index.jsx | Filtra por date+type+status |
| 22 | Buscar clientes por data e hora | back/tours/list-clients-by-date-and-hour.php | pages/SummaryTourList/index.jsx | Modal na lista resumida |
| 23 | Lista regular para impressão | back/tours/regular-list.php | pages/PrintList/index.jsx | Formata dados para impressão física |
| 24 | Imprimir lista do dia | back/tours/available-hours.php + regular-list.php | pages/PrintList/index.jsx | Seleção de data → horários → tabela de impressão |
| 25 | Busca rápida (autocomplete) | back/quick-search/search.php | pages/QuickSearch/index.jsx | Sugestões de reserva e cliente |
| 26 | Busca rápida (resultados completos) | back/quick-search/search-tours.php | pages/QuickSearch/index.jsx | Retorna tour completo + weekDay + totalPax |
| 27 | Criar cliente | back/customers/create.php | pages/CustomerInput/index.jsx | Cria customer + múltiplos contacts |
| 28 | Listar clientes | back/customers/list-all.php | pages/CustomersList/index.jsx | JOIN customers+customerContacts |
| 29 | Listar clientes agrupados (para seleção) | back/customers/list-grouped.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | Lista clientes com contacts array para autocomplete |
| 30 | Editar cliente | back/customers/update.php | pages/CustomerUpdate/index.jsx | Replace completo dos contatos |
| 31 | Buscar cliente por ID | back/customers/list-by-id.php | pages/CustomerUpdate/index.jsx | Retorna customer + todos os contacts |
| 32 | Excluir contato de cliente | back/customers/delete.php | pages/CustomersList/index.jsx | Exclui customerContacts por id |
| 33 | Criar produto/atividade | back/products/create.php | pages/ProductInput/index.jsx | Cria product + múltiplas variants com preços |
| 34 | Listar produtos | back/products/list-all.php | pages/ProductList/index.jsx, pages/TourInput/index.jsx | LEFT JOIN com variant; filtrado por category no frontend |
| 35 | Buscar produto por ID | back/products/list-by-id.php | pages/ProductUpdate/index.jsx | INNER JOIN product+variant |
| 36 | Editar produto | back/products/update.php | pages/ProductUpdate/index.jsx | Replace completo das variantes |
| 37 | Excluir produto | back/products/delete.php | pages/ProductList/index.jsx | Hard delete |
| 38 | Listar comissões | back/comissions/list-all.php | pages/ComissionList/index.jsx | JOIN com tour; filtro deleted=0, canceled=0 |
| 39 | Buscar comissão por ID | back/comissions/list-by-id.php | pages/ComissionUpdate/index.jsx | |
| 40 | Editar comissão | back/comissions/update.php | pages/ComissionUpdate/index.jsx | |
| 41 | Excluir comissão (soft) | back/comissions/delete.php | pages/ComissionList/index.jsx, pages/TourUpdate/index.jsx | Marca deleted=1 e commissioned=0 no tour |
| 42 | Marcar comissão como paga | back/comissions/pay.php | pages/ComissionList/index.jsx | comissionPaid=1 |
| 43 | Marcar comissão como não paga | back/comissions/unpay.php | pages/ComissionList/index.jsx | comissionPaid=0 |
| 44 | Listar dayOrders ativos | back/day-order/list-active.php | pages/DayOrderList/index.jsx | Apenas com tours ativos (não cancelado/bloqueio) |
| 45 | Editar dayOrder (funcionários) | back/day-order/list-by-id.php + update-employees.php | pages/DayOrderEdit/index.jsx | Auto-insere guias e funcionários fixos |
| 46 | Listar tours do dayOrder | back/day-order/list-tours-by-dayorder-id.php | pages/DayOrderEdit/index.jsx | UNION regulares+demais |
| 47 | Adicionar funcionário ao dayOrder | back/day-order/create-employee.php | pages/DayOrderEdit/index.jsx | |
| 48 | Calcular pagamentos do dia | back/day-order/calculate-payments.php | pages/DayOrderEdit/index.jsx | Lógica diferente para guias vs outros |
| 49 | Separar tours em outro dayOrder | back/day-order/split-tours-to-another-day-order.php | pages/DayOrderEdit/index.jsx | Cria novo dayOrder com originalDayOrder ref |
| 50 | Retornar tour ao dayOrder original | back/day-order/return-tour-to-original-day-order.php | pages/DayOrderEdit/index.jsx | Usa campo originalDayOrder |
| 51 | Associar guia específico a slot de tour | back/day-order/associate-guide-to-tour.php | pages/DayOrderEdit/index.jsx | DELETE+INSERT em dayOrderAssociateGuidesInTours |
| 52 | Listar funções de funcionários | back/day-order/list-functions.php | pages/DayOrderEdit/index.jsx, pages/DayOrderSettings/index.jsx | Ordenado por orderNumber |
| 53 | Listar opções de funcionários | back/day-order/list-employees-options.php | pages/DayOrderEdit/index.jsx, pages/DayOrderSettings/index.jsx | |
| 54 | Listar remunerações | back/day-order/list-remunerations.php | pages/DayOrderSettings/index.jsx | |
| 55 | Criar função | back/day-order/create-function.php | pages/DayOrderSettings/index.jsx | |
| 56 | Editar função | back/day-order/edit-function.php | pages/DayOrderSettings/index.jsx | |
| 57 | Excluir função | back/day-order/delete-function.php | pages/DayOrderSettings/index.jsx | Hard delete |
| 58 | Criar opção de funcionário | back/day-order/create-employee-option.php | pages/DayOrderSettings/index.jsx | Verifica nome+função duplicado |
| 59 | Editar opção de funcionário | back/day-order/edit-employee-option.php | pages/DayOrderSettings/index.jsx | |
| 60 | Excluir opção de funcionário | back/day-order/delete-employee.php | pages/DayOrderSettings/index.jsx | Hard delete em dayOrderEmployeesList |
| 61 | Criar remuneração | back/day-order/create-remuneration.php | pages/DayOrderSettings/index.jsx | |
| 62 | Excluir remuneração | back/day-order/delete-remuneration.php | pages/DayOrderSettings/index.jsx | Hard delete |
| 63 | Listar pagamentos (por mês) | back/day-order/list-all-payments.php | pages/DayOrderPayments/index.jsx | JOIN dayOrder+dayOrderEmployeesFunctions |
| 64 | Alterar valor de pagamento individual | back/day-order/change-individual-payment.php | pages/DayOrderPayments/index.jsx | |
| 65 | Alterar comentário de pagamento individual | back/day-order/change-individual-comments.php | pages/DayOrderPayments/index.jsx | |
| 66 | Listar tours por data (dayOrder) | back/day-order/list-tours-by-date.php | pages/DayOrderCalendar/index.jsx | Componente sem rota registrada |
| 67 | Listar atividades disponíveis (dayOrder) | back/day-order/list-activities.php | pages/DayOrderSettings/index.jsx | Retorna tabela product |
| 68 | Criar/atualizar numberOfGroups (regular) | back/numberOfGroups/create.php | pages/SummaryTourList/index.jsx | DELETE+INSERT para regulares; UPDATE tour para demais |
| 69 | Listar todos numberOfGroups | back/numberOfGroups/list-all.php | (não consumido diretamente pelo front) | Endpoint disponível |
| 70 | Listar change requests de um tour | back/changeRequests/get-by-tour-id.php | pages/FinancialTourUpdate/index.jsx | |
| 71 | Criar configuração (settings) | back/settings/create.php | pages/Settings/index.jsx | |
| 72 | Listar todas as configurações | back/settings/list-all.php | pages/Settings/index.jsx | |
| 73 | Excluir configuração | back/settings/delete.php | pages/Settings/index.jsx | Hard delete |
| 74 | Obter ano atual do sistema | back/settings/current-year.php | components/Store/Provider.jsx | Lê settings WHERE type='CurrentYear' |
| 75 | Atualizar ano atual do sistema | back/settings/update-current-year.php | pages/Settings/index.jsx | |
| 76 | Listar plataformas | back/settings/platforms.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 77 | Listar atividades (settings) | back/settings/activities.php | (usado indiretamente via products) | |
| 78 | Listar idiomas | back/settings/languages.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 79 | Listar status de reserva | back/settings/status.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx, pages/FinancialTourInput/index.jsx | |
| 80 | Listar moedas | back/settings/currencies.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx, pages/ComissionUpdate/index.jsx | |
| 81 | Listar métodos de pagamento | back/settings/payment-methods.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 82 | Listar status de pagamento | back/settings/payment-status.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 83 | Listar locais | back/settings/locals.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 84 | Listar guias | back/settings/guides.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 85 | Listar empresas | back/settings/companies.php | pages/FinancialTourInput/index.jsx, pages/FinancialTourUpdate/index.jsx | |
| 86 | Listar números de conta | back/settings/account-numbers.php | pages/FinancialTourInput/index.jsx, pages/FinancialTourUpdate/index.jsx | |
| 87 | Listar países | back/settings/countries.php | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | |
| 88 | Análise por cliente | back/reports/analysis-by-customers.php | pages/AnalysisByCustomers/index.jsx | Paginação; % pax e valor |
| 89 | Análise por país | back/reports/analysis-by-country.php | pages/AnalysisByCountry/index.jsx | Paginação; % pax e valor |
| 90 | Análise por produto/atividade | back/reports/analysis-by-product.php | pages/AnalysisByProduct/index.jsx | Paginação; % pax e valor |
| 91 | Análise de tour regular (pax/valor por tipo) | back/reports/analysis-regular-tour.php | pages/AnalysisByProduct/index.jsx | Busca preços na tabela variant; ajuste proporcional |
| 92 | Análise por hora do dia | back/reports/analysis-by-hour.php | pages/AnalysisByHour/index.jsx | Agrupamento por hora cheia (exceto Regular) |
| 93 | Análise por dia da semana | back/reports/analysis-by-weekday.php | pages/AnalysisByHour/index.jsx | Retorna DOM/SEG/TER/QUA/QUI/SEX/SAB |
| 94 | Listar atividades disponíveis (reports) | back/reports/available-activities.php | pages/AnalysisByHour/index.jsx | Hardcoded: ["Regular", "Tour 1", "Mix Tour 1"] |
| 95 | Geração automática de orderRef | back/order-ref/create.php | pages/TourInput/index.jsx (orderRef vazio) | Incluído como módulo em create.php |
| 96 | Cálculo automático de preço no formulário | (frontend only) | pages/TourInput/index.jsx, pages/TourUpdate/index.jsx | Baseado em product variants; high season support |
| 97 | Filtros de coluna na tabela de tours | (frontend only) | pages/TourList/index.jsx | Multi-filtro; seleção/deselação; select all/clear all |
| 98 | Exportar lista de tours para Excel | (frontend only) | pages/TourList/index.jsx, pages/FinancialTourList/index.jsx | react-export-table-to-excel |
| 99 | Navegação entre dayOrders anterior/próximo | back/day-order/list-by-id.php | pages/DayOrderEdit/index.jsx | Campos prev/next retornados pelo backend |
| 100 | Rota protegida por permissão | (frontend only) | components/Routes/Private/Private.jsx | Verifica permissions array |
