# database-schema.md — Schema Inferido do Banco de Dados

> Banco: `u658162899_sistemace` | Charset: `utf8mb4`  
> Schema inferido a partir das queries SQL dos arquivos PHP.

---

## Tabela: `tour`

Principal tabela do sistema. Armazena todos os tours (regulares, privativos, shows/eventos, financeiros).

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `type` | VARCHAR | 'regular', 'privativo', 'show/evento' |
| `orderRef` | VARCHAR | Ex: 'CE0001' |
| `platform` | VARCHAR | Plataforma de origem |
| `activity` | VARCHAR | Nome da atividade/produto |
| `adicional` | VARCHAR | Produto adicional (pode ser vazio) |
| `duration` | VARCHAR | Duração do tour |
| `tourDate` | DATE | Data do tour |
| `tourHour` | TIME/VARCHAR | Horário do tour (ex: '09:00') |
| `local` | VARCHAR | Local do tour |
| `status` | VARCHAR | Status de reserva (ex: 'Confirmado', 'Cancelado', 'Bloqueio') |
| `language` | VARCHAR | Idioma |
| `client` | VARCHAR | Nome do cliente/agência |
| `paxAdult` | INT | Quantidade adultos |
| `paxHalf` | INT | Quantidade meia entrada |
| `paxFree` | INT | Quantidade cortesia |
| `paxNet` | INT | Quantidade NET |
| `paxBrazilian` | INT | Quantidade brasileiros |
| `currency` | VARCHAR | Moeda (ex: 'R$', 'USD') |
| `paymentMethod` | VARCHAR | Método de pagamento |
| `totalValue` | DECIMAL/VARCHAR | Valor total |
| `numberOfGroups` | INT | Número de grupos (não-regulares) |
| `ceGuide` | VARCHAR | Guias CE separados por vírgula (ex: 'João,Maria') |
| `clientName` | VARCHAR | Nome do contato do cliente |
| `clientContact` | VARCHAR | Email/contato do cliente |
| `country` | VARCHAR | País(es) — pode ser múltiplos separados por ", " |
| `emailSubject` | VARCHAR | Assunto do email |
| `companionName` | VARCHAR | Nome do guia acompanhante |
| `companionContact` | VARCHAR | Contato do guia acompanhante |
| `commissioned` | TINYINT(1) | 0 ou 1 |
| `comments` | TEXT | Observações gerais |
| `conversationHistory` | TEXT | Histórico de conversas |
| `paymentStatus` | VARCHAR | Status de pagamento |
| `financialComments` | TEXT | Comentários financeiros |
| `year` | INT/VARCHAR | Ano fiscal do sistema |
| `dateOfRegistration` | DATE | Data de registro |
| `createdBy` | VARCHAR | Usuário que criou |
| `lastEditBy` | VARCHAR | Último usuário que editou |
| `origin` | VARCHAR | 'office' | 'financial' |
| `dayOrderId` | INT FK → dayOrder.id | Ordem do dia associada |
| `isHighSeason` | TINYINT(1) | 0 ou 1 |
| `canceled` | TINYINT(1) | 0 = ativo, 1 = cancelado |
| `cancelReason` | VARCHAR | Motivo do cancelamento |
| `lateCheck` | TINYINT(1) | 0 | 1 (verificação tardia) |
| `paymentDate` | DATE | Data do pagamento |
| `netValue` | DECIMAL | Valor líquido (apenas financeiros) |
| `company` | VARCHAR | Empresa (apenas financeiros) |
| `invoiceNumber` | VARCHAR | Número da fatura (apenas financeiros) |
| `accountNumber` | VARCHAR | Número da conta (apenas financeiros) |

**Lido em:** `list-all.php`, `list-by-id.php`, `list-canceled.php`, `list-all-summary.php`, `list-all-financial.php`, `list-clients-by-date-and-hour.php`, `regular-list.php`, `available-hours.php`, `list-tours-by-dayorder-id.php`, todos os reports, quick-search
**Escrito em:** `create.php`, `update.php`, `create-financial.php`, `update-financial.php`, `cancel.php`, `cancel-multiple.php`, `uncancel.php`, `mark-as-late-check.php`, `numberOfGroups/create.php`

---

## Tabela: `dayOrder`

Representa a "Ordem do Dia" — um container de tours para uma data específica.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `date` | DATE | Data da ordem do dia |
| `name` | VARCHAR | 'Tour Principal', nome da atividade, etc. |
| `weekDay` | INT/VARCHAR | Dia da semana (0=Dom, 6=Sáb) ou string |
| `comments` | TEXT | Observações |
| `passed` | TINYINT(1) | 0 | 1 |
| `autoInserted` | TINYINT(1) | 0 = fixos ainda não inseridos; 1 = já inseridos |
| `originalDayOrder` | INT FK → dayOrder.id | Referência ao dayOrder principal (para splits) |
| `lastEditBy` | VARCHAR | Último editor |

**Lido em:** `list-by-id.php`, `list-active.php`, `return-tour-to-original-day-order.php`, `split-tours-to-another-day-order.php`, `list-all-payments.php`
**Escrito em:** `tours/create.php`, `tours/update.php`, `tours/create-financial.php`, `tours/update-financial.php`, `day-order/split-tours-to-another-day-order.php`, `day-order/update-employees.php`, `day-order/list-by-id.php` (UPDATE autoInserted)

---

## Tabela: `dayOrderEmployee`

Funcionários escalados para uma ordem do dia específica.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `dayOrderId` | INT FK → dayOrder.id | |
| `function` | VARCHAR | Função (ex: 'Guia', 'Motorista') |
| `name` | VARCHAR | Nome do funcionário |
| `prevision` | VARCHAR | Horário previsto |
| `arrival` | VARCHAR/TIME | Horário de chegada |
| `departure` | VARCHAR/TIME | Horário de saída |
| `phone` | VARCHAR | Telefone |
| `comments` | TEXT | Observações |
| `deleted` | TINYINT(1) | 0 | 1 (soft delete) |

**Lido em:** `list-by-id.php`, `calculate-payments.php`
**Escrito em:** `create-employee.php`, `update-employees.php`, `list-by-id.php` (INSERT auto-guias/fixos)

---

## Tabela: `dayOrderEmployeesList`

Lista de funcionários disponíveis para escalar (catálogo/opções).

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR | Nome do funcionário |
| `function` | VARCHAR | Função |
| `phone` | VARCHAR | Telefone |
| `type` | VARCHAR | 'Fixo' | outros — controla auto-inserção |

**Lido em:** `list-employees-options.php`, `calculate-payments.php` (JOIN), `list-by-id.php` (Fixos)
**Escrito em:** `create-employee-option.php`, `edit-employee-option.php`, `delete-employee.php`

---

## Tabela: `dayOrderEmployeesFunctions`

Catálogo de funções disponíveis para funcionários.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR | Nome da função (ex: 'Guia', 'Motorista') |
| `orderNumber` | INT | Ordem de exibição |

**Lido em:** `list-functions.php`, `list-by-id.php` (JOIN orderNumber), `calculate-payments.php` (JOIN), `list-all-payments.php` (JOIN)
**Escrito em:** `create-function.php`, `edit-function.php`, `delete-function.php`

---

## Tabela: `dayOrderEmployeesRemunerations`

Tabela de remunerações por função e atividade.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `functionId` | INT FK → dayOrderEmployeesFunctions.id | |
| `paymentType` | VARCHAR | 'day' | 'hour' | 'special' |
| `activity` | VARCHAR | Atividade (para guias); pode ser genérico para outras funções |
| `hourlyValue1` | DECIMAL | Valor base / até 8h / por tour |
| `hourlyValue2` | DECIMAL | Até 10h |
| `hourlyValue3` | DECIMAL | Acima de 10h |

**Lido em:** `calculate-payments.php`, `list-remunerations.php`
**Escrito em:** `create-remuneration.php`, `delete-remuneration.php`

---

## Tabela: `dayOrderPayments`

Pagamentos calculados para funcionários de uma ordem do dia.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `dayOrderId` | INT FK → dayOrder.id | |
| `function` | VARCHAR | |
| `employeeName` | VARCHAR | |
| `arrival` | VARCHAR/TIME | |
| `departure` | VARCHAR/TIME | |
| `value` | DECIMAL | Valor calculado |
| `comments` | TEXT | |
| `activity` | VARCHAR | Atividade do tour (somente guias) |
| `tourHour` | VARCHAR | Horário do tour (somente guias) |
| `paymentDate` | DATETIME | Data/hora do cálculo |

**Lido em:** `list-all-payments.php`
**Escrito em:** `calculate-payments.php` (DELETE all + INSERT), `change-individual-payment.php`, `change-individual-comments.php`

---

## Tabela: `dayOrderAssociateGuidesInTours`

Associação explícita de guias a slots de tour no dayOrder.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `dayOrderId` | INT FK → dayOrder.id | |
| `tourHour` | VARCHAR | |
| `activity` | VARCHAR | |
| `language` | VARCHAR | |
| `guide` | VARCHAR | Nome do guia |

**Lido em:** (frontend usa para exibição, mas não há endpoint de leitura mapeado)
**Escrito em:** `associate-guide-to-tour.php` (DELETE + INSERT por dayOrderId+hour+activity+language)

---

## Tabela: `comissions`

Comissões associadas a tours.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `tourId` | INT FK → tour.id | |
| `orderRef` | VARCHAR | |
| `comissionersName` | VARCHAR | Nome do comissionado |
| `comissionersContact` | VARCHAR | Contato do comissionado |
| `comissionCurrency` | VARCHAR | Moeda da comissão |
| `comissionPrice` | DECIMAL/VARCHAR | Valor da comissão |
| `comissionPaid` | TINYINT(1) | 0 | 1 |
| `createdBy` | VARCHAR | |
| `lastEditBy` | VARCHAR | |
| `year` | INT/VARCHAR | Ano fiscal |
| `dateOfRegistration` | DATE | |
| `deleted` | TINYINT(1) | 0 | 1 (soft delete) |

**Lido em:** `list-all.php`, `list-by-id.php`, `tours/list-all.php` (verificação), `tours/list-by-id.php` (JOIN)
**Escrito em:** `tours/create.php`, `tours/update.php`, `tours/create-financial.php`, `tours/update-financial.php`, `comissions/delete.php`, `comissions/pay.php`, `comissions/unpay.php`, `comissions/update.php`

---

## Tabela: `customers`

Clientes/agências cadastradas no sistema.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `customerName` | VARCHAR | Nome da agência/cliente |
| `customerType` | VARCHAR | 'Agencia' | 'Guia' | 'ClienteFinal' |
| `createdBy` | VARCHAR | |
| `lastEditBy` | VARCHAR | |

**Lido em:** `list-all.php`, `list-by-id.php`, `list-grouped.php`, `tours/create.php` (verificação)
**Escrito em:** `customers/create.php`, `customers/update.php`, `tours/create.php` (auto-criação)

---

## Tabela: `customerContacts`

Contatos vinculados a clientes.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `customerId` | INT FK → customers.id | |
| `contactName` | VARCHAR | Nome do contato |
| `contactContact` | VARCHAR | Telefone/contato |
| `contactOffice` | VARCHAR | Cargo/função |
| `contactEmail` | VARCHAR | Email |
| `createdBy` | VARCHAR | |
| `lastEditBy` | VARCHAR | |
| `deleted` | TINYINT(1) | 0 | 1 (soft delete) |

**Lido em:** `customers/list-all.php`, `customers/list-by-id.php`, `customers/list-grouped.php`, `tours/create.php`
**Escrito em:** `customers/create.php`, `customers/update.php` (DELETE+INSERT), `tours/create.php` (auto-criação), `customers/delete.php` (DELETE por id)

---

## Tabela: `product`

Catálogo de produtos/atividades.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `type` | VARCHAR | Tipo do tour ('regular', 'privativo', 'show/evento') |
| `category` | VARCHAR | 'atividade' | 'adicional' |
| `name` | VARCHAR | Nome do produto |
| `duration` | VARCHAR | Duração padrão |

**Lido em:** `products/list-all.php`, `products/list-by-id.php`, `day-order/list-activities.php`, `reports/analysis-regular-tour.php`
**Escrito em:** `products/create.php`, `products/update.php`, `products/delete.php`

---

## Tabela: `variant`

Variantes de preço para cada produto.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `productId` | INT FK → product.id | |
| `pricingType` | VARCHAR | 'person' | 'group' |
| `priceAdult` | DECIMAL | Preço adulto (normal) |
| `priceHalf` | DECIMAL | Preço meia |
| `priceNet` | DECIMAL | Preço NET |
| `priceBrazilian` | DECIMAL | Preço brasileiro |
| `priceFree` | DECIMAL | Preço cortesia |
| `priceGroup` | DECIMAL | Preço por grupo |
| `paxLimit` | INT | Limite de pax que ativa esta variante |
| `priceAdultHighSeason` | DECIMAL | Adulto alta temporada |
| `priceHalfHighSeason` | DECIMAL | Meia alta temporada |
| `priceNetHighSeason` | DECIMAL | NET alta temporada |
| `priceFreeHighSeason` | DECIMAL | Cortesia alta temporada |
| `priceBrazilianHighSeason` | DECIMAL | Brasileiro alta temporada |
| `priceGroupHighSeason` | DECIMAL | Grupo alta temporada |

**Lido em:** `products/list-all.php` (LEFT JOIN), `products/list-by-id.php` (INNER JOIN), `reports/analysis-regular-tour.php`
**Escrito em:** `products/create.php`, `products/update.php` (DELETE+INSERT)

---

## Tabela: `settings`

Configurações e dados de referência do sistema (listas de opções).

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `type` | VARCHAR | Tipo da configuração |
| `value` | VARCHAR | Valor |
| `year` | INT/VARCHAR | Ano associado |

**Types conhecidos:** `activity`, `platform`, `language`, `status`, `currency`, `paymentMethod`, `paymentStatus`, `local`, `guide`, `company`, `accountNumber`, `country`, `orderRefCount`, `CurrentYear`, `currentYear`

**Lido em:** `settings/list-all.php`, todos os settings/*.php, `order-ref/create.php`, `currentYear.php`
**Escrito em:** `settings/create.php`, `settings/delete.php`, `settings/update-current-year.php`, `order-ref/create.php`

---

## Tabela: `users`

Usuários do sistema.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `username` | VARCHAR | Login único |
| `name` | VARCHAR | Nome de exibição |
| `permissions` | INT/VARCHAR | Número de permissão (1-6) |
| `password` | VARCHAR | Hash bcrypt |
| `deleted` | TINYINT(1) | 0 | 1 (soft delete) |

**Lido em:** `users/login.php`, `users/getUser.php`, `users/list-all.php`
**Escrito em:** `users/create.php`, `users/update.php`, `users/delete.php`

---

## Tabela: `tokens`

Tokens de autenticação de sessão.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `userId` | INT FK → users.id | |
| `token` | VARCHAR(40) | Token aleatório |
| `creationDate` | DATETIME | Data/hora de criação ou último refresh |

**Lido em:** `users/getUser.php`
**Escrito em:** `users/login.php` (DELETE+INSERT), `users/getUser.php` (UPDATE/DELETE), `users/logout-all.php` (DELETE ALL)

---

## Tabela: `changeRequests`

Solicitações de alteração em campos de tours.

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `type` | VARCHAR | Campo a ser alterado |
| `name` | VARCHAR | Nome legível do campo |
| `oldValue` | VARCHAR | Valor anterior |
| `newValue` | VARCHAR | Novo valor solicitado |
| `tourId` | INT FK → tour.id | |
| `createdBy` | VARCHAR | Usuário que criou |

**Lido em:** `changeRequests/get-by-tour-id.php`, `tours/list-all.php` (verificação), `tours/list-by-id.php`
**Escrito em:** `tours/update.php` (DELETE+INSERT), `tours/update-financial.php` (DELETE/UPDATE tour se aprovado)

---

## Tabela: `numberOfGroups`

Número de grupos por slot de tour regular (date + hour + activity).

| Campo | Tipo Inferido | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `date` | DATE | |
| `hour` | TIME/VARCHAR | |
| `activity` | VARCHAR | |
| `groups` | INT | Número de grupos |

**Lido em:** `tours/list-all.php` (LEFT JOIN), `tours/list-all-financial.php` (LEFT JOIN), `tours/list-all-summary.php` (LEFT JOIN), `numberOfGroups/list-all.php`
**Escrito em:** `numberOfGroups/create.php` (DELETE+INSERT para regulares)

---

## Relacionamentos (JOINs documentados)

```
tour.dayOrderId ──────────────── dayOrder.id
tour.id ──────────────────────── comissions.tourId
tour.id ──────────────────────── changeRequests.tourId
customers.id ─────────────────── customerContacts.customerId
product.id ───────────────────── variant.productId
dayOrder.id ──────────────────── dayOrderEmployee.dayOrderId
dayOrder.id ──────────────────── dayOrderPayments.dayOrderId
dayOrder.id ──────────────────── dayOrderAssociateGuidesInTours.dayOrderId
dayOrder.originalDayOrder ─────── dayOrder.id (self-reference)
dayOrderEmployeesFunctions.id ── dayOrderEmployeesRemunerations.functionId
dayOrderEmployeesFunctions.name ─ dayOrderEmployee.function (JOIN por nome)
dayOrderEmployeesFunctions.name ─ dayOrderPayments.function (JOIN por nome)
users.id ─────────────────────── tokens.userId
tour.tourDate+tourHour+activity ─ numberOfGroups.date+hour+activity (JOIN composto)
```
