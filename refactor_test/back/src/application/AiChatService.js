const Anthropic = require('@anthropic-ai/sdk');

const DB_SCHEMA = `
Banco de dados PostgreSQL do sistema CE (agência de turismo). Tabelas disponíveis:

"tour" — reservas de passeios
  id, type, orderRef, platform, activity, adicional, duration,
  tourDate (DATE) ← USE SEMPRE ESTE PARA FILTRAR POR DATA/ANO,
  tourHour, local, status, language, client,
  paxAdult, paxHalf, paxFree, paxNet, paxBrazilian, currency,
  paymentMethod,
  totalValue (TEXT) — valor bruto original; válido quando netValue=0,
  numberOfGroups, ceGuide, clientName, clientContact, country,
  emailSubject, companionName, companionContact, commissioned, comments,
  paymentStatus, financialComments,
  year (TEXT — IGNORAR, campo legado com valor fixo, NÃO USAR para filtrar ano),
  dateOfRegistration (DATE), createdBy, lastEditBy, origin, dayOrderId,
  isHighSeason, canceled (0=ativo, 1=cancelado), cancelReason, lateCheck,
  paymentDate (DATE),
  netValue (DECIMAL) — valor líquido; pode ser 0 mesmo quando há valor em totalValue,
  company, invoiceNumber, accountNumber

"comissions" — comissões por reserva
  id, tourId, orderRef, comissionersName, comissionersContact,
  comissionCurrency, comissionPrice (TEXT), comissionPaid (0/1),
  createdBy, lastEditBy, year, dateOfRegistration, deleted (0/1)

"customers" — clientes/agências
  id, customerName, customerType, createdBy, lastEditBy

"customerContacts" — contatos dos clientes
  id, customerId, contactName, contactContact, contactOffice, contactEmail, deleted

"product" — produtos/atividades oferecidas
  id, type, category, name, duration

"variant" — variantes de preço por produto
  id, productId, pricingType, priceAdult, priceHalf, priceNet,
  priceBrazilian, priceFree, priceGroup, paxLimit,
  priceAdultHighSeason, priceHalfHighSeason, priceNetHighSeason,
  priceFreeHighSeason, priceBrazilianHighSeason, priceGroupHighSeason

"dayOrder" — ordens do dia (agenda de operações)
  id, date (DATE), name, weekDay, comments, passed, autoInserted, originalDayOrder, lastEditBy

"dayOrderEmployee" — funcionários escalados por ordem do dia
  id, dayOrderId, function, name, prevision, arrival, departure, phone, comments, deleted

"dayOrderPayments" — pagamentos a funcionários
  id, dayOrderId, function, employeeName, arrival, departure, value, comments, activity, tourHour, paymentDate

"dayOrderAssociateGuidesInTours" — guias associados aos passeios na ordem do dia
  id, dayOrderId, tourHour, activity, language, guide

"dayOrderEmployeesList" — lista mestra de funcionários
  id, name, function, phone, type

"dayOrderEmployeesFunctions" — funções dos funcionários
  id, name, orderNumber

"dayOrderEmployeesRemunerations" — remunerações por função
  id, functionId, paymentType, activity, hourlyValue1, hourlyValue2, hourlyValue3

"settings" — configurações do sistema
  id, type, value, year

"users" — usuários do sistema
  id, username, name, permissions, deleted

"numberOfGroups" — controle de grupos por atividade
  id, date (DATE), hour, activity, groups

"changeRequests" — solicitações de alteração em reservas
  id, type, name, oldValue, newValue, tourId, createdBy

NOTAS CRÍTICAS:
- NUNCA filtre por "tour"."year" — esse campo está corrompido (todos os registros têm '2024'). Use SEMPRE "tourDate" para filtrar por data/ano/mês.
- Para filtrar por ano: WHERE "tourDate" BETWEEN 'AAAA-01-01' AND 'AAAA-12-31'
- Para filtrar por mês/ano: WHERE "tourDate" BETWEEN 'AAAA-MM-01' AND 'AAAA-MM-31'
- VALOR REAL DE UMA RESERVA: muitas reservas têm netValue=0 mas têm o valor correto em totalValue (TEXT numérico). Use SEMPRE esta expressão para obter o valor real:
    CASE WHEN "netValue" > 0 THEN "netValue" ELSE CAST(NULLIF("totalValue",'') AS DECIMAL) END
  Exemplo para listar valor: CASE WHEN t."netValue" > 0 THEN t."netValue" ELSE CAST(NULLIF(t."totalValue",'') AS DECIMAL) END AS valor
  Exemplo para somar: SUM(CASE WHEN "netValue" > 0 THEN "netValue" ELSE CAST(NULLIF("totalValue",'') AS DECIMAL) END)
- "tour"."canceled"=0 significa reserva ativa; =1 significa cancelada. Sempre filtre canceled=0
- "comissions"."deleted"=0 significa comissão ativa
`;

const TOOLS = [
  {
    name: 'query_database',
    description: 'Executa uma consulta SELECT no banco de dados PostgreSQL do sistema CE para buscar informações. Use sempre que precisar de dados reais.',
    input_schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'Consulta SQL SELECT válida para PostgreSQL. Use aspas duplas para nomes de tabelas e colunas (ex: SELECT * FROM "tour" WHERE "canceled"=0).',
        },
      },
      required: ['sql'],
    },
  },
];

class AiChatService {
  constructor(aiChatRepository) {
    this.repo = aiChatRepository;
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(userId, userName, sessionId, userMessage) {
    await this.repo.saveMessage(userId, sessionId, 'user', userMessage);

    const sessionMessages = await this.repo.getSessionMessages(sessionId);
    const messages = sessionMessages.map(m => ({ role: m.role, content: m.content }));

    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const anoAtual  = now.toLocaleDateString('pt-BR', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).slice(-4);
    const mesAtual  = String(now.getMonth() + 1).padStart(2, '0');

    const systemPrompt = `Você é um assistente inteligente e educado do sistema de gestão CE (agência de turismo).
Seu nome é CE Assistente. Você ajuda com consultas e análises sobre os dados do sistema.

DATA E HORA ATUAL: ${dataAtual} (ano ${anoAtual}, mês ${mesAtual}) — use SEMPRE esta data como referência para "hoje", "este mês", "este ano" etc.

Usuário logado: ${userName}

${DB_SCHEMA}

INSTRUÇÕES:
- Seja sempre educado e prestativo, trate o usuário pelo nome quando adequado
- Use a ferramenta query_database sempre que precisar buscar dados reais
- Formate valores monetários com R$ e duas casas decimais quando relevante
- Formate datas no padrão brasileiro (DD/MM/AAAA)
- Quando não encontrar dados, informe claramente
- Responda sempre em português brasileiro
- Para perguntas sobre totais de vendas, use SUM("netValue") ou tente converter "totalValue" com CAST
- Limite resultados a no máximo 100 linhas por consulta`;

    const assistantMessage = await this._callWithTools(systemPrompt, messages);
    await this.repo.saveMessage(userId, sessionId, 'assistant', assistantMessage);

    return { message: assistantMessage };
  }

  async _callWithTools(systemPrompt, messages) {
    let response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    // Agentic loop: handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(b => b.type === 'tool_use');
      if (!toolUseBlock) break;

      let toolResult;
      try {
        const rows = await this.repo.runReadOnlyQuery(toolUseBlock.input.sql);
        toolResult = JSON.stringify(rows.slice(0, 100));
      } catch (err) {
        toolResult = JSON.stringify({ error: err.message });
      }

      // Build next turn with assistant response + tool result
      const nextMessages = [
        ...messages,
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: toolResult,
            },
          ],
        },
      ];

      response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages: nextMessages,
      });

      messages = nextMessages;
    }

    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.text || 'Desculpe, não consegui gerar uma resposta.';
  }

  async getSessions(userId) {
    return this.repo.getUserSessions(userId);
  }

  async getSessionMessages(sessionId) {
    return this.repo.getSessionMessages(sessionId);
  }
}

module.exports = AiChatService;
