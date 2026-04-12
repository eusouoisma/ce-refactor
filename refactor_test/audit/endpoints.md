# endpoints.md — Mapeamento Completo de Endpoints PHP

> Banco de dados: `u658162899_sistemace` | Host: `localhost`  
> Todos os endpoints retornam JSON. CORS: `Access-Control-Allow-Origin: *`

---

## Tours

### back/tours/create.php
- **Método HTTP:** POST (JSON body via `php://input`)
- **Parâmetros de entrada:**
  - `type` — tipo do tour (regular | privativo | show/evento)
  - `orderRef` — nº de reserva (se vazio, gera automaticamente via order-ref/create.php → "CE" + 4 dígitos)
  - `platform` — plataforma de origem
  - `tourDate` — data do tour (YYYY-MM-DD)
  - `tourHour` — hora do tour (HH:MM)
  - `activity` — atividade/produto
  - `duration` — duração
  - `local` — local
  - `language` — idioma
  - `client` — nome do cliente/agência
  - `newCustomerType` — tipo do novo cliente (se cliente não existir)
  - `status` — status de reserva
  - `paxAdult`, `paxHalf`, `paxFree`, `paxNet`, `paxBrazilian` — quantidades de pax
  - `currency` — moeda
  - `paymentMethod` — método de pagamento
  - `paymentStatus` — status de pagamento
  - `totalValue` — valor total
  - `numberOfGroups` — número de grupos
  - `ceGuide` — array de guias CE (serializado como string separada por vírgula)
  - `clientName` — nome do contato do cliente
  - `clientContact` — email/contato do cliente
  - `country` — país(es)
  - `emailSubject` — assunto do email
  - `companionName` — nome do guia acompanhante
  - `companionContact` — contato do guia
  - `isHighSeason` — bool (alta temporada)
  - `adicional` — produto adicional
  - `commissioned` — bool
  - `comissionersName`, `comissionersContact`, `comissionCurrency`, `comissionPrice`, `comissionPaid` — dados de comissão
  - `comments` — observações
  - `dateOfRegistration` — data do registro
  - `createdBy`, `lastEditBy` — usuário
  - `conversationHistory` — histórico de conversa
- **Retorno:** `{ error: false }` ou `{ error: true, message: "..." }`
- **Tabelas acessadas:** `settings` (orderRefCount), `dayOrder` (SELECT/INSERT), `tour` (INSERT), `comissions` (INSERT condicional), `customers` (SELECT/INSERT), `customerContacts` (SELECT/INSERT)

---

### back/tours/update.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - `id` (GET) — ID do tour
  - Todos os campos de create.php exceto `newCustomerType`
  - `commissionId` — ID da comissão existente
  - `comissionByPercentage`, `comissionPercentage` — cálculo por %
  - `changeRequests` — array de change requests a processar
- **Retorno:** `{ error: false }` ou `{ error: true, message: "..." }`
- **Tabelas acessadas:** `tour` (SELECT, UPDATE), `dayOrder` (SELECT, INSERT), `changeRequests` (DELETE, INSERT), `comissions` (SELECT, INSERT, UPDATE)

---

### back/tours/list-all.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months` — meses separados por vírgula (ex: "1,2,3")
  - `year` — ano (ex: "2025")
- **Retorno:** Array de tours com campos completos, incluindo:
  - `groups` — se regular, usa `numberOfGroups.groups`; senão usa `tour.numberOfGroups`
  - `dateOfRegistrationFormated`, `formatedTourDate`, `formatedPaymentDate` — datas formatadas dd/mm/yyyy
  - `haveChangeRequests` — bool
  - `comissioned` — bool
- **Tabelas acessadas:** `tour`, `numberOfGroups` (LEFT JOIN), `changeRequests`, `comissions`
- **Filtros:** `year = currentYear AND MONTH IN months AND YEAR = year AND canceled = 0 AND origin = 'office'`

---

### back/tours/list-all-financial.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months`, `year`
- **Retorno:** Array de tours financeiros (todos os campos + `numberOfGroups.groups`)
- **Tabelas acessadas:** `tour`, `numberOfGroups` (LEFT JOIN), `changeRequests`, `comissions`
- **Filtros:** `year = currentYear AND MONTH IN months AND YEAR = year AND canceled = 0` (sem filtro origin)

---

### back/tours/list-all-summary.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months`, `year`
- **Retorno:** Array agrupado por (tourDate, tourHour, activity) com:
  - `id`, `status`, `tourDate`, `formatedTourDate`, `tourHour`, `type`, `activity`, `duration`, `language`, `guides`, `paxTotal`, `paxTotalInitial`, `client`, `groups`
  - União de tours não-regulares (agrupados por tour.id) e regulares (agrupados por date/hour/activity)
- **Tabelas acessadas:** `tour`, `numberOfGroups` (LEFT JOIN para regulares)
- **Filtros:** `canceled = 0 AND origin = 'office' AND tourHour != ''`

---

### back/tours/list-by-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `tour_id` — ID do tour
- **Retorno:** Objeto do tour com dados de comissão (LEFT JOIN) e array `changeRequests`
- **Tabelas acessadas:** `tour`, `comissions` (LEFT JOIN com `deleted = 0`), `changeRequests`

---

### back/tours/list-canceled.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months`, `year`
- **Retorno:** Array de tours cancelados (`canceled = 1`) com `haveChangeRequests`
- **Tabelas acessadas:** `tour`, `changeRequests`

---

### back/tours/cancel.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - `id` (GET) — ID do tour
  - `cancelReason` — motivo do cancelamento
  - `lastEditBy` — usuário
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `tour` (UPDATE: `canceled = 1, cancelReason, lastEditBy`)

---

### back/tours/cancel-multiple.php
- **Método HTTP:** POST (JSON body) + `?ids=` via GET
- **Parâmetros de entrada:**
  - `ids` (GET) — IDs separados por vírgula
  - `cancelReason`, `lastEditBy`
- **Retorno:** `{ error, message, affectedRows, canceledIds }`
- **Tabelas acessadas:** `tour` (UPDATE em batch com prepared statement)

---

### back/tours/uncancel.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - `id` (GET), `lastEditBy`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `tour` (UPDATE: `canceled = 0`)

---

### back/tours/create-financial.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `type`, `company`, `invoiceNumber`, `status`, `paymentStatus`, `accountNumber`, `paymentDate`
  - `tourDate`, `tourHour`, `activity`, `adicional`, `isHighSeason`
  - `client`, `clientName`, `clientContact`, `orderRef`
  - `paymentMethod`, `currency`, `totalValue`, `netValue`, `financialComments`
  - `commissioned`, `dateOfRegistration`, `createdBy`, `lastEditBy`, `conversationHistory`
- **Retorno:** `{ error: false }` ou `{ error: true, message: "..." }`
- **Tabelas acessadas:** `dayOrder` (SELECT/INSERT), `tour` (INSERT com `origin = 'financial'`)

---

### back/tours/update-financial.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - Todos os campos de create-financial, mais: `platform`, `comments`, `commissionId`, dados de comissão, `changeRequests`, `lastEditBy`, `conversationHistory`
- **Retorno:** `{ error: false }` ou `{ error: true, message: "..." }`
- **Tabelas acessadas:** `tour` (SELECT, UPDATE), `dayOrder` (SELECT/INSERT), `changeRequests` (lógica approve/reprove), `comissions` (SELECT/INSERT/UPDATE)

---

### back/tours/available-hours.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `date` — data
  - `type` — tipo do tour
  - `status` — status
- **Retorno:** Array de strings `["HH:MM", ...]` com horários distintos
- **Tabelas acessadas:** `tour`

---

### back/tours/list-clients-by-date-and-hour.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `date`, `hour`
- **Retorno:** `{ error, clients: [{client, companionName, companionContact}] }`
- **Tabelas acessadas:** `tour`
- **Filtros:** `status != 'Cancelado' AND canceled = 0`

---

### back/tours/mark-as-late-check.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - `id` (GET), `lastEditBy`
- **Retorno:** `{ error: false }` ou `{ error: true }`
- **Tabelas acessadas:** `tour` (UPDATE: `lateCheck = 1`)

---

### back/tours/regular-list.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `date`, `hour`
- **Retorno:** Array de objetos para impressão:
  ```json
  [{ "n": 1, "guideAgency": "...", "adulto": 2, "net": 0, "brasileiro": 0, "meia": 1, "free": 0, "total": 3, "nomePax": "...", "guia": "...", "paymentMethod": "...", "valorTotal": "...", "comissao": "Sim|Não", "statusPgto": "...", "obs": "..." }]
  ```
- **Tabelas acessadas:** `tour`
- **Filtros:** `status = 'Confirmado' AND type = 'regular' AND canceled = 0`

---

## Customers

### back/customers/create.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `customerType`, `customerName`, `createdBy`, `lastEditBy`
  - `contacts` — array de `{ name, contact, office, email }`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `customers` (INSERT), `customerContacts` (INSERT para cada contato)

---

### back/customers/update.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `customerId`, `customerType`, `customerName`, `createdBy`, `lastEditBy`
  - `contacts` — array de contatos (replace completo)
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `customers` (UPDATE), `customerContacts` (DELETE all + INSERT novos)

---

### back/customers/delete.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `id` — ID do **customerContact** (não do customer)
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `customerContacts` (DELETE por id)

---

### back/customers/list-all.php
- **Método HTTP:** GET (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de registros (JOIN customers + customerContacts) onde `customerContacts.deleted = '0'`
- **Tabelas acessadas:** `customers`, `customerContacts` (INNER JOIN)

---

### back/customers/list-by-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `customer_id`
- **Retorno:** Array de registros do cliente (JOIN customers + customerContacts)
- **Tabelas acessadas:** `customers`, `customerContacts` (INNER JOIN)

---

### back/customers/list-grouped.php
- **Método HTTP:** GET (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de `{ name: "...", contacts: [...] }` — clientes distintos com seus contatos
- **Tabelas acessadas:** `customers`, `customerContacts` (INNER JOIN, WHERE deleted = '0')

---

## Comissions

### back/comissions/list-all.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months`, `year`
- **Retorno:** Array de comissões com `tourDateFormated` (dd/mm/yyyy)
- **Tabelas acessadas:** `comissions`, `tour` (INNER JOIN)
- **Filtros:** `tour.canceled = 0 AND comissions.deleted = 0 AND tour.year = currentYear AND MONTH IN months AND YEAR = year`

---

### back/comissions/list-by-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `comission_id`
- **Retorno:** Objeto da comissão
- **Tabelas acessadas:** `comissions`

---

### back/comissions/update.php
- **Método HTTP:** POST (JSON body) + `?id=` via GET
- **Parâmetros de entrada:**
  - `id` (GET), `orderRef`, `comissionersName`, `comissionersContact`, `comissionCurrency`, `comissionPrice`, `comissionPaid`, `lastEditBy`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `comissions` (UPDATE)

---

### back/comissions/delete.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `id` — ID da comissão
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `comissions` (UPDATE: `deleted = 1`), `tour` (UPDATE: `commissioned = 0`)

---

### back/comissions/pay.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `id`, `lastEditBy`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `comissions` (UPDATE: `comissionPaid = 1`)

---

### back/comissions/unpay.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `id`, `lastEditBy`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `comissions` (UPDATE: `comissionPaid = 0`)

---

## Day Order

### back/day-order/list-active.php
- **Método HTTP:** POST (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de dayOrders com `formatedDate` (dd/mm/yyyy), onde existem tours ativos (status NOT IN ('Cancelado','Bloqueio'), canceled=0, tourHour != '')
- **Tabelas acessadas:** `dayOrder`, `tour` (EXISTS subquery)

---

### back/day-order/list-by-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `day_order_id`
- **Retorno:** `{ error, infos: { dayOrder com formatedDate, prev, next }, employees: [...] }`
- **Lógica especial:** Auto-insere guias de tours no dia, auto-insere funcionários fixos (se autoInserted=0 e nome = 'Tour Principal' ou 'Regular')
- **Tabelas acessadas:** `tour`, `dayOrder` (SELECT/UPDATE), `dayOrderEmployee` (SELECT/INSERT/DELETE), `dayOrderEmployeesList`, `dayOrderEmployeesFunctions` (JOIN para orderNumber)

---

### back/day-order/list-tours-by-dayorder-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `id` — ID do dayOrder
- **Retorno:** `{ error, data: [...tours agrupados por date/hour/activity/type/status] }`
- **Tabelas acessadas:** `tour` (UNION: não-regulares agrupados por id, regulares agrupados por date/hour/activity)

---

### back/day-order/list-tours-by-date.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `date`
- **Retorno:** `{ error, data: [...tours agrupados por date/hour/activity/language] }`
- **Tabelas acessadas:** `tour`

---

### back/day-order/list-all-payments.php
- **Método HTTP:** GET
- **Parâmetros de entrada:**
  - `months`, `year`
- **Retorno:** Array de pagamentos com datas formatadas, ordenado por data ASC, orderNumber ASC, employeeName ASC
- **Tabelas acessadas:** `dayOrderPayments`, `dayOrder` (INNER JOIN), `dayOrderEmployeesFunctions` (INNER JOIN)

---

### back/day-order/list-activities.php
- **Método HTTP:** POST (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de produtos
- **Tabelas acessadas:** `product`

---

### back/day-order/list-functions.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de funções ordenadas por `orderNumber ASC` (excluindo name = '')
- **Tabelas acessadas:** `dayOrderEmployeesFunctions`

---

### back/day-order/list-employees-options.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de todas as opções de funcionários
- **Tabelas acessadas:** `dayOrderEmployeesList`

---

### back/day-order/list-remunerations.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de todas as remunerações
- **Tabelas acessadas:** `dayOrderEmployeesRemunerations`

---

### back/day-order/create-employee.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `dayOrderId`, `editedBy`
  - `employee: { function, name, phone }`
- **Retorno:** `{ error, data: insertId }`
- **Tabelas acessadas:** `dayOrder` (UPDATE lastEditBy), `dayOrderEmployee` (INSERT)

---

### back/day-order/create-employee-option.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `function`, `type`, `name`, `phone`
- **Retorno:** `{ error, data: insertId }` — ou erro se nome+função já existir
- **Tabelas acessadas:** `dayOrderEmployeesList` (SELECT verificação + INSERT)

---

### back/day-order/create-function.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `name`, `orderNumber`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesFunctions` (INSERT)

---

### back/day-order/create-remuneration.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `functionId`, `paymentType`, `activity`, `hourlyValue1`, `hourlyValue2`, `hourlyValue3`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `dayOrderEmployeesRemunerations` (INSERT)

---

### back/day-order/update-employees.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `dayOrderId`, `comments`, `lastEditBy`
  - `employees` — array de `{ id, function, name, prevision, arrival, departure, phone, comments, deleted }`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `dayOrderEmployee` (DELETE se deleted=1 ou function='', senão UPDATE), `dayOrder` (UPDATE comments+lastEditBy)

---

### back/day-order/delete-employee.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesList` (DELETE)

---

### back/day-order/delete-function.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesFunctions` (DELETE)

---

### back/day-order/delete-remuneration.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesRemunerations` (DELETE)

---

### back/day-order/edit-employee-option.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `id`, `function`, `type`, `name`, `phone`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesList` (UPDATE)

---

### back/day-order/edit-function.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `id`, `name`, `orderNumber`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `dayOrderEmployeesFunctions` (UPDATE)

---

### back/day-order/calculate-payments.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `dayOrderId`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Lógica:** Para Guias: pagamento por tour participado (hourlyValue1 da remuneração da atividade). Para outros: pagamento por tempo (day ≤8h → value1, ≤10h → value2, >10h → value3; hour → value1 * horas; special → 0)
- **Tabelas acessadas:** `dayOrderEmployee` (SELECT, JOIN dayOrderEmployeesList para excluir Fixos), `dayOrderPayments` (DELETE all + INSERT), `dayOrderEmployeesRemunerations` (JOIN dayOrderEmployeesFunctions), `tour`

---

### back/day-order/change-individual-payment.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `paymentId`, `paymentNewValue`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `dayOrderPayments` (UPDATE value)

---

### back/day-order/change-individual-comments.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `paymentId`, `commentsNewValue`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `dayOrderPayments` (UPDATE comments)

---

### back/day-order/split-tours-to-another-day-order.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `activity`, `hour`, `date`, `language`, `dayOrderId`, `editedBy`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Lógica:** Cria novo dayOrder com `originalDayOrder = dayOrderId`, atualiza tours do slot para novo dayOrderId
- **Tabelas acessadas:** `dayOrder` (INSERT), `tour` (UPDATE dayOrderId)

---

### back/day-order/return-tour-to-original-day-order.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `activity`, `hour`, `date`, `language`, `dayOrderId`
- **Retorno:** `{ error, original: originalDayOrderId }`
- **Tabelas acessadas:** `dayOrder` (SELECT originalDayOrder), `tour` (SELECT dayOrderId, UPDATE dayOrderId)

---

### back/day-order/associate-guide-to-tour.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `guide` (array), `tourHour`, `activity`, `language`, `dayOrderId`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `dayOrderAssociateGuidesInTours` (DELETE + INSERT para cada guia)

---

## Products

### back/products/create.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `type`, `category` (default: 'atividade'), `productName`, `duration`
  - `variants` — array de `{ pricingType, priceAdult, priceHalf, priceNet, priceBrazilian, priceFree, priceGroup, paxLimit, priceAdultHighSeason, priceHalfHighSeason, priceNetHighSeason, priceFreeHighSeason, priceBrazilianHighSeason, priceGroupHighSeason }`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `product` (INSERT), `variant` (INSERT para cada variante)

---

### back/products/update.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:**
  - `productId`, `type`, `category`, `productName`, `duration`, `variants`, `lastEditBy`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Tabelas acessadas:** `product` (UPDATE), `variant` (DELETE all + INSERT novos)

---

### back/products/delete.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `product` (DELETE)

---

### back/products/list-all.php
- **Método HTTP:** GET (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array com JOIN product+variant, ordenado por product.name
- **Tabelas acessadas:** `product`, `variant` (LEFT JOIN)

---

### back/products/list-by-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `product_id`
- **Retorno:** Array de registros (produto + todas as variantes)
- **Tabelas acessadas:** `product`, `variant` (INNER JOIN)

---

## Settings

### back/settings/list-all.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de `{ id, type, value }` ordenado por value
- **Tabelas acessadas:** `settings`

### back/settings/create.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `type`, `value`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `settings` (INSERT com `year = currentYear`)

### back/settings/delete.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `settings` (DELETE)

### back/settings/update-current-year.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `value`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `settings` (UPDATE WHERE type = 'currentYear')

### back/settings/current-year.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Valor (string) do ano corrente
- **Tabelas acessadas:** `settings` (WHERE type = 'CurrentYear')

### back/settings/activities.php, platforms.php, languages.php, status.php, currencies.php, payment-methods.php, payment-status.php, locals.php, guides.php, companies.php, account-numbers.php, countries.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de `{ value }` filtrado pelo type correspondente, ordenado por value ASC
- **Tabelas acessadas:** `settings`

---

## Users

### back/users/login.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `username`, `password`
- **Retorno:** `{ error: false, token, permissions }` ou `{ error: "Username or password is wrong" }`
- **Tabelas acessadas:** `users` (SELECT), `tokens` (DELETE all for user + INSERT novo)

### back/users/getUser.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `token`
- **Retorno:** `{ username, name, permissions, creationDate, userId }` ou `{ error: true }` se token expirado (>4 horas)
- **Lógica:** Token válido → atualiza creationDate (sliding window 4h). Token inválido → DELETE tokens do usuário
- **Tabelas acessadas:** `users`, `tokens` (INNER JOIN; DELETE/UPDATE)

### back/users/create.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `username`, `name`, `permissions`, `password`
- **Retorno:** `{ error: false }` ou `{ error: "A user with that username already exists" }`
- **Tabelas acessadas:** `users` (SELECT + INSERT; password_hash)

### back/users/update.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `username`, `name`, `token`, `password` (opcional)
- **Retorno:** `{ error: false }` ou `{ error: "Something went wrong" }`
- **Tabelas acessadas:** `tokens` (SELECT userId), `users` (UPDATE)

### back/users/delete.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `id`
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `users` (DELETE)

### back/users/list-all.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de usuários onde `deleted = 0`
- **Tabelas acessadas:** `users`

### back/users/logout-all.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** `{ error: false|true }`
- **Tabelas acessadas:** `tokens` (DELETE WHERE 1)

---

## Change Requests

### back/changeRequests/get-by-tour-id.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** `tour_id`
- **Retorno:** Array de change requests do tour
- **Tabelas acessadas:** `changeRequests`

---

## numberOfGroups

### back/numberOfGroups/create.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `id`, `type`, `date`, `hour`, `activity`, `groups`
- **Retorno:** `{ error: false }` ou `{ error: true, message }`
- **Lógica:** Se regular → DELETE+INSERT em numberOfGroups. Se não-regular → UPDATE tour.numberOfGroups
- **Tabelas acessadas:** `numberOfGroups` (DELETE+INSERT), `tour` (UPDATE)

### back/numberOfGroups/list-all.php
- **Método HTTP:** GET (ignora body)
- **Parâmetros de entrada:** nenhum
- **Retorno:** Array de todos os registros
- **Tabelas acessadas:** `numberOfGroups`

---

## Order Ref

### back/order-ref/create.php (incluído como módulo, não rota direta)
- **Método:** incluído via `include` em tours/create.php e tours/create-financial.php
- **Lógica:** Lê `orderRefCount` de settings, incrementa, zero-pad 4 dígitos, atualiza settings. Expõe `$newOrderRef`
- **Tabelas acessadas:** `settings` (SELECT + UPDATE WHERE type = 'orderRefCount')

---

## Reports

### back/reports/analysis-by-country.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`, `orderBy` ('valor'|outro), `from`, `to` (paginação)
- **Retorno:** Array paginado de `{ country, currency, totalPax, valorTotal, index, paxPercent, valorPercent }`
- **Tabelas acessadas:** `tour` (WHERE status='Confirmado', canceled=0)

### back/reports/analysis-by-customers.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`, `clientSearch`, `orderBy`, `from`, `to`
- **Retorno:** Array paginado de `{ client, currency, totalPax, valorTotal, index, paxPercent, valorPercent }`
- **Tabelas acessadas:** `tour`

### back/reports/analysis-by-product.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`, `orderBy`, `from`, `to`
- **Retorno:** Array paginado de `{ activity, currency, totalPax, valorTotal, index, paxPercent, valorPercent }`
- **Tabelas acessadas:** `tour`

### back/reports/analysis-by-hour.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`, `day` (SEG/TER/QUA/QUI/SEX/SAB/DOM/ALL), `activities` (array)
- **Retorno:** `{ data: [{hora, total}], debug: {...} }` — horas 08:00-21:00 (ou horários exatos para "Regular")
- **Tabelas acessadas:** `tour`

### back/reports/analysis-by-weekday.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`, `day`, `applyDayFilter`, `activities`
- **Retorno:** `{ data: [{dia: DOM|SEG|..., total}], debug }`
- **Tabelas acessadas:** `tour`

### back/reports/analysis-regular-tour.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `startDate`, `endDate`
- **Retorno:** `{ paxAdult, paxHalf, paxFree, paxNet, totalPax, percentAdult/Half/Free/Net, valorAdult/Half/Free/Net, totalValor, percentValorAdult/Half/Free/Net, debug }`
- **Tabelas acessadas:** `tour`, `product`, `variant`

### back/reports/available-activities.php
- **Método HTTP:** GET
- **Parâmetros de entrada:** nenhum
- **Retorno:** `["Regular", "Tour 1", "Mix Tour 1"]` — lista hardcoded
- **Tabelas acessadas:** nenhuma

---

## Quick Search

### back/quick-search/search.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `reserva`, `cliente`
- **Retorno:** `{ reservas: [{value, label}], clientes: [{value, label}] }` — top 10 sugestões
- **Tabelas acessadas:** `tour` (WHERE status='Confirmado', canceled=0)

### back/quick-search/search-tours.php
- **Método HTTP:** POST (JSON body)
- **Parâmetros de entrada:** `reserva`, `cliente`
- **Retorno:** `{ tours: [...] }` — objetos completos de tour com `totalPax`, `weekDay`, `dateOfRegistrationFormated`
- **Tabelas acessadas:** `tour` (WHERE status='Confirmado', canceled=0)
