# business-rules.md — Regras de Negócio do Sistema CE

---

### RN-001 — Geração automática de orderRef
- **Arquivo:** back/order-ref/create.php, back/tours/create.php, back/tours/create-financial.php
- **Descrição:** Quando o campo `orderRef` é enviado vazio, o sistema gera automaticamente um número sequencial. Lê o valor atual de `settings.orderRefCount`, incrementa em 1, aplica zero-padding para 4 dígitos, atualiza o contador em `settings`, e o resultado é prefixado com "CE" (ex: CE0001, CE0042, CE0100).
- **Condição:** `orderRef == ""`
- **Efeito:** `orderRef` recebe valor "CE" + zero-padded(counter+1, 4). `settings.orderRefCount` é atualizado.

---

### RN-002 — Criação automática de dayOrder ao criar tour
- **Arquivo:** back/tours/create.php, back/tours/create-financial.php
- **Descrição:** Ao criar um tour, o sistema verifica se existe um `dayOrder` com `date = tourDate AND name = 'Tour Principal'`. Se não existir, cria um novo dayOrder com o nome 'Tour Principal' e o dia da semana calculado. O `dayOrderId` resultante é vinculado ao tour.
- **Condição:** Sempre que um tour é criado
- **Efeito:** `dayOrder` criado se não existir para a data; `tour.dayOrderId` = id do dayOrder encontrado/criado.

---

### RN-003 — Campos financeiros no UPDATE de tour regular dependem da data
- **Arquivo:** back/tours/update.php
- **Descrição:** Ao atualizar um tour, a função `isTourRegularAndDateNotPassed` verifica se o tour é do tipo "regular" E se `tourDate >= data atual (timezone America/Sao_Paulo)`. Se sim, o UPDATE inclui `currency`, `paymentMethod` e `totalValue`. Se o tour for passado (ou não-regular), esses campos financeiros são excluídos do UPDATE para preservar o registro histórico.
- **Condição:** `type === 'regular' AND tourDate >= today (America/Sao_Paulo)`
- **Efeito:** Campos `currency`, `paymentMethod`, `totalValue` são ou não atualizados no UPDATE principal do tour.

---

### RN-004 — Atualização de dayOrderId ao mudar data do tour
- **Arquivo:** back/tours/update.php, back/tours/update-financial.php
- **Descrição:** Se a data do tour for alterada no UPDATE, o sistema busca um dayOrder adequado para a nova data. Prioridade: (1) dayOrderId de um tour regular existente nessa data, (2) dayOrderId de qualquer tour existente nessa data, (3) criação de novo dayOrder. O `tour.dayOrderId` é atualizado para a nova data.
- **Condição:** `tourDate != currentTourDate` no momento do update
- **Efeito:** `tour.dayOrderId` é reatribuído.

---

### RN-005 — Cliente novo é criado automaticamente ao criar tour
- **Arquivo:** back/tours/create.php
- **Descrição:** Ao criar um tour, o sistema verifica se o nome do cliente (`client`) já existe em `customers`. Se não existir, cria um novo registro em `customers` com o `newCustomerType` fornecido, e um registro em `customerContacts` com `clientName` e `clientContact`. Se o cliente existir mas o contato (`clientName`) for novo, apenas o contato é adicionado.
- **Condição:** Cliente não encontrado em `customers` por nome exato
- **Efeito:** INSERT em `customers` e `customerContacts`; ou apenas INSERT em `customerContacts` se cliente existir.

---

### RN-006 — numberOfGroups = ceil(paxAdult / 30) para tours privativos
- **Arquivo:** back/tours/create.php (frontend: TourInput/index.jsx)
- **Descrição:** Para tours do tipo "privativo", o número de grupos é calculado automaticamente como `Math.ceil(paxAdult / 30)` no frontend, a menos que o usuário tenha alterado manualmente o campo (flag `blockUpdateNumberOfGroups`).
- **Condição:** `type === 'privativo' AND blockUpdateNumberOfGroups === false`
- **Efeito:** `numberOfGroups` é atualizado automaticamente conforme `paxAdult` muda.

---

### RN-007 — Comissão criada automaticamente ao marcar tour como comissionado
- **Arquivo:** back/tours/create.php, back/tours/update.php, back/tours/update-financial.php
- **Descrição:** Se `commissioned === true`, um registro é criado em `comissions` com os dados do comissionado. No update, se já existir um registro com o `commissionId`, atualiza; caso contrário, insere um novo.
- **Condição:** `commissioned == "1"`
- **Efeito:** INSERT ou UPDATE em `comissions`.

---

### RN-008 — Soft delete de comissão atualiza flag no tour
- **Arquivo:** back/comissions/delete.php
- **Descrição:** Ao excluir uma comissão, o campo `comissions.deleted` é setado para 1 (soft delete) e o campo `tour.commissioned` é setado para 0, desvinculando o tour da comissão.
- **Condição:** DELETE de comissão via `?id=`
- **Efeito:** `comissions.deleted = 1` e `tour.commissioned = 0`

---

### RN-009 — Token de sessão expira após 4 horas (sliding window)
- **Arquivo:** back/users/getUser.php
- **Descrição:** O token de autenticação tem validade de 4 horas (14400 segundos). A cada verificação bem-sucedida, o campo `tokens.creationDate` é atualizado com o timestamp atual (sliding window — a inatividade de 4h expira, não o tempo total). Se expirado, todos os tokens do usuário são deletados.
- **Condição:** Toda chamada autenticada via `getUser.php`
- **Efeito:** Token renovado (UPDATE creationDate) ou expirado (DELETE FROM tokens WHERE userId).

---

### RN-010 — Login gera token único, deletando tokens anteriores do usuário
- **Arquivo:** back/users/login.php
- **Descrição:** Ao fazer login com sucesso, todos os tokens anteriores do usuário são deletados (`DELETE FROM tokens WHERE userId`) e um novo token aleatório de 40 caracteres é gerado e inserido.
- **Condição:** Login bem-sucedido com username+password corretos
- **Efeito:** DELETE + INSERT em `tokens`; retorna `{ token, permissions }`.

---

### RN-011 — Verificação de username duplicado no cadastro de usuário
- **Arquivo:** back/users/create.php
- **Descrição:** Antes de criar um novo usuário, o sistema verifica se já existe um usuário com o mesmo `username`. Se existir, retorna erro sem inserir.
- **Condição:** `SELECT username WHERE username = '$username'` retorna resultado
- **Efeito:** Retorna `{ error: "A user with that username already exists" }`

---

### RN-012 — Senha hashada com PASSWORD_DEFAULT
- **Arquivo:** back/users/create.php, back/users/update.php
- **Descrição:** A senha é sempre armazenada como hash bcrypt via `password_hash($password, PASSWORD_DEFAULT)`. Na atualização do usuário, a senha só é alterada se o campo `password` não for vazio.
- **Condição:** Sempre no cadastro; no update apenas se `password != ""`
- **Efeito:** `users.password` armazena hash bcrypt.

---

### RN-013 — Guias CE armazenados como string separada por vírgula
- **Arquivo:** back/tours/create.php, back/tours/update.php
- **Descrição:** O campo `ceGuide` é recebido como array do frontend e serializado com `implode(",", $ceGuide)` antes de ser salvo em `tour.ceGuide`.
- **Condição:** Sempre ao criar/atualizar tour
- **Efeito:** `tour.ceGuide` = "Guia1,Guia2,Guia3"

---

### RN-014 — isHighSeason converte bool para '0'/'1'
- **Arquivo:** back/tours/create.php, back/tours/update.php, back/tours/create-financial.php, back/tours/update-financial.php
- **Descrição:** O campo `isHighSeason` é recebido como booleano do frontend e convertido para '1' ou '0' antes de salvar.
- **Condição:** Sempre ao criar/atualizar tour
- **Efeito:** `tour.isHighSeason` = '1' ou '0'

---

### RN-015 — commissioned converte bool para '0'/'1'
- **Arquivo:** back/tours/create.php e variantes
- **Descrição:** Similar ao RN-014, o campo `commissioned` é convertido de bool para string '0'/'1'.
- **Condição:** Sempre ao criar/atualizar tour
- **Efeito:** `tour.commissioned` = '1' ou '0'

---

### RN-016 — year do tour é o currentYear do sistema
- **Arquivo:** back/tours/create.php, back/tours/create-financial.php, back/currentYear.php
- **Descrição:** O campo `tour.year` é atribuído com o valor de `$currentYear`, que é lido de `settings WHERE type = 'CurrentYear'`. Não é o ano da data do tour, mas o "ano fiscal/operacional" configurado no sistema.
- **Condição:** Sempre ao criar tour
- **Efeito:** `tour.year` = valor de `settings.CurrentYear`

---

### RN-017 — origin diferencia tours de escritório vs financeiro
- **Arquivo:** back/tours/create.php, back/tours/create-financial.php
- **Descrição:** Tours criados via formulário padrão têm `origin = 'office'`. Tours criados via formulário financeiro têm `origin = 'financial'`. A listagem de tours regulares filtra por `origin = 'office'`.
- **Condição:** Tipo de formulário usado
- **Efeito:** `tour.origin` = 'office' | 'financial'

---

### RN-018 — dayOrder auto-insere guias e funcionários fixos no primeiro acesso
- **Arquivo:** back/day-order/list-by-id.php
- **Descrição:** Ao listar um dayOrder por ID, o sistema automaticamente: (1) insere em `dayOrderEmployee` os guias dos tours que ainda não estão na lista; (2) remove da lista guias que não têm mais tours naquele dia; (3) Se `autoInserted = 0` e o nome do dayOrder for 'Tour Principal' ou 'Regular', insere todos os funcionários com `type = 'Fixo'` da tabela `dayOrderEmployeesList`, depois marca `autoInserted = 1`.
- **Condição:** Toda chamada a list-by-id
- **Efeito:** Sincronização automática de `dayOrderEmployee` com os tours e funcionários fixos.

---

### RN-019 — Cálculo de pagamento de guia por tour participado
- **Arquivo:** back/day-order/calculate-payments.php
- **Descrição:** Para funcionários com `function = 'Guia'`: o pagamento é calculado por atividade/hora em que o guia participou. Para cada tour (agrupado por date/hour/activity) onde o guia consta em `ceGuide LIKE '%nome%'`, busca o `hourlyValue1` da remuneração configurada para a função "Guia" + aquela atividade. Cada tour resulta em um registro separado em `dayOrderPayments`.
- **Condição:** `function == "Guia"` no cálculo de pagamentos
- **Efeito:** N registros em `dayOrderPayments` (um por tour participado pelo guia)

---

### RN-020 — Cálculo de pagamento não-guia por tempo trabalhado
- **Arquivo:** back/day-order/calculate-payments.php
- **Descrição:** Para funções não-guia: o valor é calculado baseado em `paymentType` da remuneração: `day` → ≤8h = value1, ≤10h = value2, >10h = value3; `hour` → value1 * horas trabalhadas; `special` → 0. O tempo é calculado pela diferença entre `arrival` e `departure` do `dayOrderEmployee`.
- **Condição:** `function != "Guia"`
- **Efeito:** 1 registro em `dayOrderPayments` por funcionário

---

### RN-021 — Funcionários com type='Fixo' não são incluídos no cálculo de pagamentos
- **Arquivo:** back/day-order/calculate-payments.php
- **Descrição:** O cálculo de pagamentos exclui funcionários cujo tipo na lista de opções (`dayOrderEmployeesList.type`) seja 'Fixo'. Esses funcionários têm tratamento diferenciado (salário fixo externo ao sistema).
- **Condição:** JOIN com `dayOrderEmployeesList` e filtro `type != 'Fixo'`
- **Efeito:** Funcionários fixos não geram registros em `dayOrderPayments`

---

### RN-022 — Split de tours cria novo dayOrder com referência ao original
- **Arquivo:** back/day-order/split-tours-to-another-day-order.php
- **Descrição:** Ao separar um slot de tours para outro dayOrder, cria-se um novo `dayOrder` com `originalDayOrder = dayOrderId` (referência ao principal) e `name = activity`. Os tours do slot (date + hour + activity + language) são migrados para o novo dayOrder.
- **Condição:** Ação de split na tela de edição do dayOrder
- **Efeito:** Novo `dayOrder` criado; `tour.dayOrderId` atualizado para o novo ID

---

### RN-023 — Retorno ao dayOrder original usa campo originalDayOrder
- **Arquivo:** back/day-order/return-tour-to-original-day-order.php
- **Descrição:** Ao retornar um tour ao dayOrder principal, o sistema lê `dayOrder.originalDayOrder`. Se não encontrar, tenta encontrar o dayOrder de um tour regular na mesma data, depois qualquer tour. Atualiza `tour.dayOrderId` para o original.
- **Condição:** Ação de retorno ao original na tela de edição
- **Efeito:** `tour.dayOrderId` atualizado para o dayOrder original

---

### RN-024 — numberOfGroups para regulares vem da tabela numberOfGroups
- **Arquivo:** back/tours/list-all.php, back/tours/list-all-summary.php
- **Descrição:** Na listagem, o campo `groups` para tours regulares é obtido da tabela `numberOfGroups` (JOIN por date + hour + activity), não do campo `tour.numberOfGroups`. Para não-regulares, usa `tour.numberOfGroups` diretamente.
- **Condição:** `tour.type = 'regular'`
- **Efeito:** `IF(type='regular', numberOfGroups.groups, tour.numberOfGroups) as groups`

---

### RN-025 — Cancelamento de tour não exclui o registro
- **Arquivo:** back/tours/cancel.php, back/tours/cancel-multiple.php
- **Descrição:** Tours são cancelados via soft delete: `tour.canceled` setado para 1, com registro do motivo em `cancelReason` e do responsável em `lastEditBy`. O registro permanece no banco.
- **Condição:** Ação de cancelamento
- **Efeito:** `tour.canceled = 1, tour.cancelReason = '...', tour.lastEditBy = '...'`

---

### RN-026 — Change requests são armazenados e processados no update
- **Arquivo:** back/tours/update.php, back/tours/update-financial.php
- **Descrição:** Change requests representam solicitações de alteração em campos do tour. No update, os change requests anteriores são deletados e os novos inseridos. No update-financial, cada change request pode ser aprovado (aplica o `newValue` ao campo) ou reprovado (apenas deleta o registro).
- **Condição:** Array `changeRequests` enviado no body
- **Efeito:** DELETE + INSERT em `changeRequests`; ou UPDATE `tour.$field = newValue` se aprovado

---

### RN-027 — Verificação de nome+função duplicada no cadastro de funcionário
- **Arquivo:** back/day-order/create-employee-option.php
- **Descrição:** Antes de criar um funcionário na lista de opções, verifica se já existe um com o mesmo `name` e `function`. Se existir, retorna erro.
- **Condição:** `SELECT WHERE name = '$name' AND function = '$function'` retorna resultado
- **Efeito:** Retorna `{ error: true, message: "Já existe um colaborador cadastrado com esse nome e função." }`

---

### RN-028 — Comissão calculada por percentual é opcional
- **Arquivo:** back/tours/create.php (frontend: TourInput/index.jsx)
- **Descrição:** Na interface de comissão, o usuário pode optar por calcular o valor da comissão por percentual (`comissionByPercentage = true`). Nesse caso, `comissionPrice = (comissionPercentage / 100) * totalValue`. O cálculo é feito no frontend.
- **Condição:** `comissionByPercentage === true`
- **Efeito:** `comissionPrice` recalculado automaticamente ao alterar `totalValue` ou `comissionPercentage`

---

### RN-029 — Timezone America/Sao_Paulo para comparação de datas
- **Arquivo:** back/tours/update.php, back/users/getUser.php
- **Descrição:** Comparações envolvendo "hoje" usam `date_default_timezone_set('America/Sao_Paulo')`. Isso afeta a lógica de RN-003 (campos financeiros em tours futuros) e o sliding window de tokens.
- **Condição:** Operações que dependem da data/hora atual
- **Efeito:** Datas calculadas no fuso de São Paulo

---

### RN-030 — Preço calculado automaticamente baseado em variantes do produto
- **Arquivo:** front/src/pages/TourInput/index.jsx, front/src/pages/TourUpdate/index.jsx
- **Descrição:** O totalValue é calculado automaticamente no frontend baseado no produto selecionado e nas variantes. Para `pricingType = 'person'`: soma paxAdult * priceAdult + paxHalf * priceHalf + etc. Para `pricingType = 'group'`: numberOfGroups * priceGroup. Em alta temporada, usa os campos HighSeason. A variante selecionada é a de maior `paxLimit` que não excede o total de pax.
- **Condição:** Produto selecionado e quantidades de pax alteradas (se não houver `blockUpdateTotalValue`)
- **Efeito:** `formData.totalValue` atualizado automaticamente

---

### RN-031 — País(es) armazenado como string concatenada
- **Arquivo:** front/src/pages/TourInput/index.jsx, back/tours/create.php
- **Descrição:** O campo `country` no frontend aceita múltiplos países (array via Autocomplete múltiplo). Antes de enviar ao backend, o array é convertido para string com `join(", ")`. No banco, `tour.country` é uma string (ex: "Brasil, Argentina").
- **Condição:** Ao submeter o formulário de criação/edição de tour
- **Efeito:** `tour.country` = "País1, País2, ..."

---

### RN-032 — Permissão 5 não pode cancelar ou editar tours
- **Arquivo:** front/src/pages/TourList/index.jsx, front/src/pages/TourUpdate/index.jsx
- **Descrição:** Usuários com `userPermissions === 5` são bloqueados de cancelar tours na listagem e de salvar edições no formulário de update.
- **Condição:** `userPermissions === 5`
- **Efeito:** Ação retorna sem executar o fetch

---

### RN-033 — lateCheck marca tour financeiro como verificado tardiamente
- **Arquivo:** back/tours/mark-as-late-check.php
- **Descrição:** Permite marcar um tour financeiro como "late check" (verificação tardia), setando `tour.lateCheck = 1`. Utilizado na listagem financeira.
- **Condição:** Ação "marcar como late check" na lista financeira
- **Efeito:** `tour.lateCheck = 1`

---

### RN-034 — Produto adicional soma valor ao produto principal
- **Arquivo:** front/src/pages/TourInput/index.jsx
- **Descrição:** Se um produto adicional (`selectedAdditional`) for selecionado junto com a atividade principal, o `totalValue` será a soma do valor calculado para a atividade principal mais o valor calculado para o adicional.
- **Condição:** `selectedAdditional !== null`
- **Efeito:** `totalValue = calcVariantValue(produto) + calcVariantValue(adicional)`

---

### RN-035 — Tours regulares agrupados por date/hour/activity na lista resumida
- **Arquivo:** back/tours/list-all-summary.php
- **Descrição:** Na lista resumida, tours regulares são agrupados por `(tourDate, tourHour, activity)` e a contagem de pax é somada. Tours não-regulares são listados individualmente por `tour.id`. A união é ordenada por tourDate ASC, tourHour ASC.
- **Condição:** Endpoint `list-all-summary.php`
- **Efeito:** Retorno consolidado: regulares agrupados, demais individuais

---

### RN-036 — Guias duplicados são removidos na lista de tours por dayOrder
- **Arquivo:** back/tours/list-tours-by-dayorder-id.php, back/tours/list-all-summary.php
- **Descrição:** O campo `guides` é gerado com `GROUP_CONCAT(DISTINCT ceGuide)`. Após a query, o PHP explode por vírgula, remove duplicatas com `array_unique`, e implode novamente.
- **Condição:** Sempre no retorno de listas agrupadas
- **Efeito:** Campo `guides` sem repetições

---

### RN-037 — Contatos de clientes são substituídos integralmente no update
- **Arquivo:** back/customers/update.php
- **Descrição:** Ao atualizar um cliente, todos os contatos existentes são deletados (`DELETE WHERE customerId = $customerId`) e os novos contatos são inseridos em seguida. Não há update parcial de contatos.
- **Condição:** Ao salvar edição de cliente
- **Efeito:** DELETE + INSERT em `customerContacts`

---

### RN-038 — Variantes de produto substituídas integralmente no update
- **Arquivo:** back/products/update.php
- **Descrição:** Similar ao RN-037 para produtos: todas as variantes são deletadas e reinseridas.
- **Condição:** Ao salvar edição de produto
- **Efeito:** DELETE FROM variant WHERE productId + INSERT novos

---

### RN-039 — Análise por hora agrupa por hora cheia (exceto Regular)
- **Arquivo:** back/reports/analysis-by-hour.php
- **Descrição:** Para atividades não-Regular, os horários são agrupados por hora cheia (ex: 09:30, 09:45 → 09:00). Para "Regular" (única atividade), os horários exatos são mantidos sem agrupamento.
- **Condição:** `activities === ['Regular']`
- **Efeito:** Agrupamento por hora cheia vs horário exato

---

### RN-040 — Cálculo de pagamentos exige remuneração cadastrada
- **Arquivo:** back/day-order/calculate-payments.php
- **Descrição:** Se um guia participou de um tour de uma atividade que não possui remuneração cadastrada (`hourlyValue1` na tabela `dayOrderEmployeesRemunerations`), o cálculo lança exceção com mensagem: "Não foi possível gerar os pagamentos pois a atividade X não possui o salário cadastrado". O mesmo vale para funções não-guia.
- **Condição:** Ausência de remuneração para função/atividade
- **Efeito:** Rollback da transação e retorno de erro

---

### RN-041 — DayOrderCalendar não possui rota no Root.jsx
- **Arquivo:** front/src/pages/DayOrderCalendar/index.jsx
- **Descrição:** O componente `DayOrderCalendar` existe no diretório de páginas mas não está registrado como rota no `Root.jsx`. Pode ser componente auxiliar ou rota removida.
- **Condição:** N/A
- **Efeito:** Componente inacessível via navegação

---

### RN-042 — createAll.php está desativado com return inicial
- **Arquivo:** back/day-order/createAll.php
- **Descrição:** O arquivo começa com `return;`, desabilitando sua execução. É um script de manutenção histórico que criava dayOrders para todos os tours desde 2024. Mantido para referência.
- **Condição:** N/A (desativado)
- **Efeito:** Nenhum em produção

---

### RN-043 — Filtro de tours usa currentYear do sistema, não o ano da data
- **Arquivo:** back/tours/list-all.php, back/tours/list-all-financial.php
- **Descrição:** A listagem de tours filtra por `tour.year = $currentYear` (ano fiscal do sistema) E TAMBÉM por `YEAR(tourDate) = $year` (ano do parâmetro). Isso garante que apenas tours do ano fiscal corrente sejam exibidos.
- **Condição:** Sempre na listagem de tours
- **Efeito:** Tours de anos anteriores (mesmo se tourDate for futuro) não aparecem na listagem do ano corrente

---

### RN-044 — Produto tem category 'adicional' para separar de atividades
- **Arquivo:** back/products/create.php, front/src/pages/TourInput/index.jsx
- **Descrição:** Produtos podem ter `category = 'atividade'` (padrão) ou `category = 'adicional'`. No frontend, atividades (category != 'adicional') e adicionais (category === 'adicional') são separados em listas distintas e renderizados em campos diferentes do formulário.
- **Condição:** `category === 'adicional'` no produto
- **Efeito:** Produto aparece no select "Adicional" e não no select "Atividade"

---

### RN-045 — Permissões do sistema por número (1-6)
- **Arquivo:** front/src/pages/Root.jsx
- **Descrição:** O sistema usa permissões numéricas: 1,2,4,5 = acesso geral; 3 = acesso limitado (lista resumida, cancelados, clientes, produtos, ordem do dia); 4,5 = admin (usuários, configurações, financeiro, pagamentos); 5 = pode visualizar mas não editar/cancelar tours; 6 = apenas análises e meu usuário.
- **Condição:** Definida no `users.permissions`
- **Efeito:** Rotas restritas por array de permissões em `RoutesPrivate`
