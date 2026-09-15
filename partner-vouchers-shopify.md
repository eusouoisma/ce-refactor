# Vouchers de Parceiro — Spec da página Shopify

Este documento é a especificação pra implementar, **no repo/tema da Shopify**
(fora deste repo), a página pública que lista e resgata vouchers de parceiro
pros clientes elegíveis. O backend (API, cadastro do catálogo, templates de
email, tela de envio manual) já está pronto neste repo
(`refactor_test/back`) — aqui só documentamos o contrato que a página da
Shopify precisa consumir.

## 1. Onde essa página entra no fluxo

1. Um cliente é importado via Planne com pedido acima do valor mínimo
   configurado (Admin do sistema CE → Vouchers de Parceiros → Configurações).
2. O sistema CE manda um email pro cliente (template editável, 4 idiomas) com
   um botão/link no formato:
   ```
   https://sua-loja.myshopify.com/pages/vouchers?token=<JWT>
   ```
   (a URL base é a configurada em `SHOPIFY_VOUCHER_PAGE_URL` no backend —
   combine com quem administra o sistema qual é a página real).
3. O cliente abre o link → a página da Shopify lê o `token` da query string e
   chama a API do CE pra listar os vouchers disponíveis.
4. Cliente escolhe um voucher → confirma → a página chama a API de resgate.
5. A API debita o estoque e dispara o email de confirmação (pro cliente e pra
   equipe CE, no mesmo envio) — a página só precisa mostrar a mensagem final
   de sucesso, não manda nenhum email ela mesma.

## 2. Autenticação

Não tem login nem API key fixa da loja. Cada oferta gera um **JWT assinado
pelo backend, de uso único, com validade de 14 dias**, embutido no `token` da
query string. A página só precisa repassar esse `token` — como query param na
`GET` e no corpo da `POST` — em toda chamada à API. Não é preciso mandar
nenhum outro header de autenticação.

Guarde o `token` (ex. numa variável em memória / `sessionStorage`) assim que
a página carrega — ele é reaproveitado nas duas chamadas abaixo.

## 3. `GET` — listar os vouchers disponíveis

```
GET {API_URL}/partner-vouchers/public/options?token=<token>
```

**Resposta (200 OK):**
```json
{
  "clientName": "Maria Silva",
  "vouchers": [
    { "id": 3, "partnerName": "Hotel Exemplo", "title": "Diária dupla com café", "description": "Uma noite pra 2 pessoas, com café da manhã incluso." },
    { "id": 5, "partnerName": "Restaurante Exemplo", "title": "Jantar para 2 pessoas", "description": "Válido de segunda a quinta." }
  ]
}
```
Só vêm vouchers ativos e com estoque > 0 — a lista pode vir vazia (mostrar uma
mensagem tipo "no momento não há vouchers disponíveis, entre em contato com a
equipe").

**Erros:**

| Status | Quando acontece | Sugestão de mensagem na página |
|---|---|---|
| 401 | Token inválido, malformado ou expirado (link com mais de 14 dias) | "Esse link expirou. Entre em contato com a equipe Carnaval Experience." |
| 410 | Esse cliente já resgatou um voucher com esse mesmo link antes | "Você já resgatou seu voucher — fique de olho no seu email." |
| 404 | Oferta não encontrada (não deveria acontecer em uso normal) | Mensagem genérica de erro |

## 4. Fluxo de escolha na UI

- Listar os vouchers (parceiro + título + descrição) em cards/lista.
- Ao clicar num voucher, **exigir confirmação** antes de resgatar (ex. modal
  "Confirmar resgate do voucher X?" com botões Confirmar/Cancelar) — a escolha
  é definitiva e debita estoque, não dá pra voltar atrás depois.
- Ao confirmar, chamar o `POST` de resgate (seção 5).
- Em caso de sucesso, mostrar uma mensagem final tipo:
  > "Voucher confirmado! Você vai receber um email em breve com os detalhes e
  > os próximos passos."
- Nenhum dado sensível novo é coletado nessa página — ela só lê o token e
  manda a escolha.

## 5. `POST` — resgatar o voucher escolhido

```
POST {API_URL}/partner-vouchers/public/redeem
Content-Type: application/json

{ "token": "<token>", "voucherId": 3 }
```

**Resposta (200 OK):**
```json
{
  "error": false,
  "voucher": { "id": 3, "title": "Diária dupla com café", "partnerName": "Hotel Exemplo" }
}
```

**Erros:**

| Status | Quando acontece | Sugestão de tratamento na página |
|---|---|---|
| 401 | Token inválido/expirado | Mesma mensagem da seção 3 |
| 410 | Essa oferta já foi resgatada (ex. o cliente clicou resgatar em duas abas ao mesmo tempo) | "Você já resgatou seu voucher." |
| 409 | Esse voucher específico esgotou entre a listagem e a confirmação (corrida com outro cliente) | Re-chamar o `GET` de options pra atualizar a lista e pedir pra escolher outro: "Esse voucher acabou de esgotar — escolha outra opção." |

O corpo de erro sempre vem como `{ "error": true, "message": "..." }` — dá
pra mostrar `message` direto ou mapear pra uma mensagem mais amigável usando a
tabela acima.

## 6. Coisas que a página **não** precisa fazer

- Não precisa mandar nenhum email — isso é 100% responsabilidade do backend
  (o `POST /redeem`, se der certo, já dispara o email de confirmação pro
  cliente e pra equipe).
- Não precisa de login/conta de cliente na Shopify.
- Não precisa lidar com carrinho/checkout da Shopify — essa página é só uma
  landing page custom, não vende nada.

## 7. CORS

O backend do CE já tem `CORS_ORIGIN` configurável — peça pra incluir o
domínio da loja Shopify (ex. `https://sua-loja.myshopify.com` e, se aplicável,
o domínio custom) na lista de origens permitidas antes de integrar.
