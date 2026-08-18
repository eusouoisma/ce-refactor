// Carrinhos abandonados: capturados a partir do webhook SALE_STATE_CHANGE da Planne
// quando uma venda muda para o estado "expired" (abandono, erro de pagamento,
// antifraude, 3DS, erro do banco etc — qualquer venda que não foi finalizada).
//
// A Sale pertence ao app Carnaval Experience (PLANNE_APP_ID). A Order (usada pra
// checar se houve tentativa de pagamento) pertence ao app JCS Carnaval — mas o
// endpoint getOrder é flat (/orders/:id, sem appId na URL) e é resolvido pela
// credencial, então basta ela ter acesso liberado às duas apps (confirmado com
// dados reais em 2026-08-13).
const LOG_PREFIX = '[abandoned-cart]';

// Config do fluxo de recuperação (link de pagamento, com ou sem desconto —
// ver createRecoveryLink, chamado só pelos emails automáticos, cada um com
// seu próprio discount). O desconto vai direto no amountCents da venda, sem
// cupom — testado contra a API real em 2026-08-17 (aceita amountCents menor
// que a soma das tarifas sem reclamar). Evita de vez o problema de cupom com
// "couponHasCustomerUsesLeft": como o mesmo cliente de teste recebe emails
// de vários carrinhos diferentes, um cupom compartilhado com limite por
// cliente estourava já no segundo carrinho, mesmo sem ele nunca ter pago nada.
const RECOVERY_TAG_NAME    = 'Recuperação de Carrinho';
const RECOVERY_LINK_TTL_HOURS = 48;
// Métodos de pagamento que fazem sentido num link que o cliente paga sozinho
// (exclui dinheiro/cortesia/pós-faturado/cartão físico, que são presenciais/internos).
const ONLINE_PAYMENT_CODES = ['credit_card', 'debit_card', 'pix'];

function asList(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  if (body && Array.isArray(body.items)) return body.items;
  return [];
}

function normalizeTagName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const RECOVERY_TAG_NORMALIZED = normalizeTagName(RECOVERY_TAG_NAME);

// include=tags devolve Tag { name }; GET /sales/:id/tags devolve SaleTag { tag: { name } }.
function isRecoveryTag(tag) {
  const name = normalizeTagName(tag?.name || tag?.tag?.name);
  return name === RECOVERY_TAG_NORMALIZED || name.includes(RECOVERY_TAG_NORMALIZED);
}

class AbandonedCartService {
  constructor({ abandonedCartRepo, planneSyncService }) {
    this.repo   = abandonedCartRepo;
    this.planne = planneSyncService;
    this._recoveryTagId = null;
    this._onlinePaymentInfo = null;
  }

  // Chamado pelo webhook quando stateTo === 'expired'. Ignora vendas que já
  // nasceram de um link de recuperação nosso (têm a tag "Recuperação de
  // Carrinho", aplicada na criação do link — ver createRecoveryLink) — senão
  // toda venda-rascunho tageada que expira sem pagamento vira um "carrinho
  // abandonado" novo, duplicando a lista com o mesmo cliente/carrinho original.
  async captureFromWebhook(saleId) {
    console.log(`${LOG_PREFIX} capturing saleId=${saleId}`);
    if (await this._saleHasRecoveryTag(saleId)) {
      console.log(`${LOG_PREFIX} saleId=${saleId} já é uma venda de recuperação (tag "${RECOVERY_TAG_NAME}") — ignorando`);
      return;
    }
    const fetched = await this.planne.fetchMappedSale(saleId);
    if (!fetched) {
      console.warn(`${LOG_PREFIX} saleId=${saleId} — não foi possível buscar a sale, abortando captura`);
      return;
    }
    const { sale, mapped } = fetched;
    if (await this._isOwnRecoverySale(sale)) {
      console.log(`${LOG_PREFIX} saleId=${saleId} nasceu do nosso link de recuperação — ignorando`);
      return;
    }
    const customer = sale.customer || {};

    const { hadTransaction, transactionStatus } = await this._fetchTransactionInfo(sale);

    await this.repo.upsert({
      saleId:         String(sale.id),
      planneCode:     sale.code || null,
      state:          sale.currentState,
      hadTransaction,
      transactionStatus,
      customerId:     sale.customerId != null ? String(sale.customerId) : null,
      clientName:     mapped.clientName,
      clientContact:  mapped.clientContact,
      clientEmail:    customer.email || null,
      clientPhone:    customer.phone || null,
      activity:       mapped.activity,
      tourDate:       mapped.tourDate,
      tourHour:       mapped.tourHour,
      totalValue:     mapped.totalValue || null,
      currency:       mapped.currency,
      country:        Array.isArray(mapped.country) ? mapped.country[0] : mapped.country,
      language:       mapped.language,
      raw:            sale,
    });
    console.log(`${LOG_PREFIX} saleId=${saleId} capturado — hadTransaction=${hadTransaction} transactionStatus=${transactionStatus}`);
  }

  // Sem orderId na sale = nem chegou a gerar um pedido, abandono garantido (sem
  // tentativa) — não precisa nem chamar a Order. Com orderId, busca a Order com
  // include=lastTransaction: lastTransaction null = chegou no pedido mas não
  // tentou pagar; presente = tentou, e normalizedStatus diz o motivo da falha
  // (Failed, AntifraudFailed etc).
  async _fetchTransactionInfo(sale) {
    if (!sale.orderId) {
      console.log(`${LOG_PREFIX} saleId=${sale.id} sem orderId — abandono sem nenhuma tentativa`);
      return { hadTransaction: false, transactionStatus: null };
    }

    const path = `/orders/${sale.orderId}?include=lastTransaction`;
    console.log(`${LOG_PREFIX} GET ${path}`);
    try {
      const order = await this.planne.get(path);
      const lastTransaction = order ? order.lastTransaction : null;
      console.log(`${LOG_PREFIX} GET ${path} -> 200 (lastTransaction=${lastTransaction ? lastTransaction.normalizedStatus : 'null'})`);
      return {
        hadTransaction: lastTransaction != null,
        transactionStatus: lastTransaction ? (lastTransaction.normalizedStatus || null) : null,
      };
    } catch (err) {
      console.warn(`${LOG_PREFIX} GET ${path} -> falhou: ${err.message}`);
      return { hadTransaction: null, transactionStatus: null };
    }
  }

  async list() {
    return this.repo.list();
  }

  // Recria a venda expirada como um Direct Link da Planne (o cliente paga
  // sozinho pelo link) com os mesmos itens, com ou sem desconto conforme o
  // discount ({ enabled, percentage }) — cada email automático passa o seu
  // próprio. O desconto vai direto no amountCents da venda nova (sem cupom —
  // ver comentário no topo do arquivo). A resposta do POST /directLinks já
  // vem com o saleId da venda-rascunho (status "created", antes de o cliente
  // pagar) — por isso a tag "Recuperação de Carrinho" é aplicada aqui mesmo,
  // na hora, sem esperar nenhum webhook (pedido explícito em 2026-08-17: tageia
  // mesmo sabendo que a maioria dessas vendas-rascunho vai expirar sem pagar).
  // O que continua esperando confirmação de verdade é markRecoveredSaleIfAny
  // (chamado pelo webhook sale.create) — só ele marca o carrinho como
  // recuperado e para os próximos emails, senão o email 1 já bloquearia o 2 e 3.
  async createRecoveryLink(saleId, discount) {
    if (!discount) throw new Error('createRecoveryLink precisa de um discount ({ enabled, percentage })');
    console.log(`${LOG_PREFIX} recovery: gerando link pra saleId=${saleId}`);
    const fetched = await this.planne.fetchMappedSale(saleId);
    if (!fetched) throw new Error('Venda original não encontrada na Planne');
    const { sale, detailedItems } = fetched;

    // Usa a mesma data/hora da venda original, sem substituição automática —
    // se o horário já passou, a Planne recusa com "scheduleDoesNotExists" e o
    // erro sobe pra tela (o time vê isso já sinalizado na tabela antes de tentar).
    const items = (detailedItems || [])
      .filter(item => (item.tariffs || []).length)
      .map(item => ({
        productId: String(item.productId),
        scheduleDate: item.scheduleDate || null,
        scheduleTime: item.scheduleTime || null,
        tariffs: item.tariffs.map(t => ({ id: String(t.tariffId), quantity: t.quantity })),
        // Sem isso a Planne não resolve o horário pra um grupo de tarifa
        // específico (ex.: idioma) e recusa com "scheduleDoesNotExists".
        selectedAttributes: (item.selectedAttributes || []).map(a => ({ type: a.type, value: a.value })),
      }));
    if (!items.length) throw new Error('Venda original não tem itens pra recriar');

    if (sale.amountCents == null) {
      throw new Error('Venda original sem amountCents — não é possível recriar o link');
    }
    // Desconto aplicado direto no total, sem cupom — testado em produção:
    // a Planne aceita amountCents menor que a soma das tarifas sem exigir
    // couponId (ver comentário no topo do arquivo).
    const amountCents = discount.enabled
      ? Math.round(sale.amountCents * (1 - Number(discount.percentage) / 100))
      : sale.amountCents;

    const paymentInfo = await this._getOnlinePaymentInfo();

    const expiresAt = new Date(Date.now() + RECOVERY_LINK_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const body = {
      type: 'sale',
      customerId: sale.customerId != null ? String(sale.customerId) : null,
      items,
      amountCents,
      paymentMethodIds: paymentInfo.paymentMethodIds,
      enablePayment: true,
      maxInstallments: paymentInfo.maxInstallments,
      minInstallmentAmountCents: paymentInfo.minInstallmentAmountCents,
      expiresAt,
      notification: { email: false, sms: false }, // envio é manual pelo time, não pela Planne
    };
    console.log(`${LOG_PREFIX} recovery: POST /apps/${this.planne.APP_ID}/directLinks — ${items.length} item(ns), amountCents=${amountCents}${discount.enabled ? ` (${discount.percentage}% off de ${sale.amountCents})` : ''}`);
    const link = await this.planne.post(`/apps/${this.planne.APP_ID}/directLinks`, body);
    console.log(`${LOG_PREFIX} recovery: link criado — ${link.checkoutUrl} (directLinkId=${link.id}, saleId=${link.saleId})`);

    // Tageia a venda-rascunho já aqui, antes de devolver o link — o email pode
    // sair mesmo se a tag falhar, mas esperamos a tentativa pra a venda já
    // estar marcada quando o webhook de expired chegar.
    if (link.saleId) {
      try {
        const tagId = await this._ensureRecoveryTag();
        await this.planne.post(`/sales/${link.saleId}/tags`, { tagId });
        console.log(`${LOG_PREFIX} recovery: saleId=${link.saleId} tageada como "${RECOVERY_TAG_NAME}"`);
      } catch (err) {
        console.warn(`${LOG_PREFIX} recovery: falhou ao tagear saleId=${link.saleId} — ${err.message}`);
      }
    }

    const recoverySentAt = new Date();
    await this.repo.setRecoveryLink(String(sale.id), {
      recoveryUrl: link.checkoutUrl,
      recoverySentAt,
      directLinkId: String(link.id),
    });

    return { checkoutUrl: link.checkoutUrl, expiresAt: link.expiresAt, recoverySentAt };
  }

  // Chamado pelo webhook sale.create: se a venda nova referencia um directLinkId
  // que a gente gerou (sale.directLinkId), marca o carrinho abandonado original
  // como recuperado — o que também para os próximos emails agendados desse
  // carrinho (ver _processCart). A tag já foi aplicada antes, na criação do
  // link (ver createRecoveryLink) — esse método só cuida da confirmação real.
  async markRecoveredSaleIfAny(saleId) {
    let sale;
    try {
      sale = await this.planne.get(`/sales/${saleId}`);
    } catch (err) {
      console.warn(`${LOG_PREFIX} recovery: falhou ao buscar saleId=${saleId} pra checar origem — ${err.message}`);
      return;
    }
    if (!sale.directLinkId) return;

    const original = await this.repo.findByDirectLinkId(String(sale.directLinkId));
    if (!original) return;

    await this.repo.markRecovered(original.saleId, String(saleId));
    console.log(`${LOG_PREFIX} recovery: carrinho ${original.saleId} marcado como recuperado (nova venda ${saleId})`);
  }

  // Chamado pelo tick de emails (AbandonedCartEmailService) antes de mandar
  // um novo email agendado: confere se o cliente já fez QUALQUER outro pedido
  // pago depois desse carrinho ter sido capturado — mesmo fora do nosso link
  // de recuperação (ex.: ligou e comprou por telefone, comprou outro passeio
  // direto no site). Se achar, marca como recuperado também, pra não incomodar
  // o cliente com mais emails de um carrinho que ele já resolveu de outro jeito.
  async markRecoveredIfCustomerOrderedElsewhere(cart) {
    if (!cart.customerId || !cart.receivedAt) return null;
    try {
      const since = encodeURIComponent(new Date(cart.receivedAt).toISOString());
      // O filtro ?currentState= dessa rota não funciona de forma confiável —
      // testado contra a API real em 2026-08-17: devolve todas as vendas do
      // cliente independente do valor passado (inclusive as próprias vendas-
      // rascunho "created" geradas pelos nossos links de recuperação). Filtra
      // por payment_complete no código mesmo; "since" só reduz o volume da resposta.
      const sales = await this.planne.get(`/customers/${cart.customerId}/sales?since=${since}&limit=50`);
      const found = (Array.isArray(sales) ? sales : [])
        .find(s => String(s.id) !== String(cart.saleId) && s.currentState === 'payment_complete');
      if (!found) return null;
      await this.repo.markRecovered(cart.saleId, String(found.id));
      console.log(`${LOG_PREFIX} recovery: carrinho ${cart.saleId} marcado como recuperado — cliente fez outro pedido (saleId=${found.id})`);
      return String(found.id);
    } catch (err) {
      console.warn(`${LOG_PREFIX} recovery: falhou ao checar outros pedidos do cliente ${cart.customerId} — ${err.message}`);
      return null;
    }
  }

  // Venda nova gerada pelo nosso Direct Link (mesmo se a tag ainda não
  // estiver visível na API): o original guarda o directLinkId, e a venda
  // rascunho nasce com o mesmo id. Também ignora se essa saleId já foi
  // registrada como recoveredSaleId de outro carrinho.
  async _isOwnRecoverySale(sale) {
    const saleId = String(sale.id);
    if (sale.directLinkId) {
      const original = await this.repo.findByDirectLinkId(String(sale.directLinkId));
      if (original && String(original.saleId) !== saleId) return true;
    }
    return !!(await this.repo.findByRecoveredSaleId(saleId));
  }

  // Fonte da verdade pra "essa venda veio de um carrinho recuperado": a tag
  // aplicada em createRecoveryLink. include=tags no GET da sale pode vir vazio
  // ou como SaleTag { tag.name } em vez de Tag { name } — o endpoint dedicado
  // GET /sales/:id/tags é o caminho principal.
  async _saleHasRecoveryTag(saleId, sale) {
    if (asList(sale && sale.tags).some(isRecoveryTag)) return true;
    try {
      const tags = asList(await this.planne.get(`/sales/${saleId}/tags`));
      if (tags.some(isRecoveryTag)) return true;
    } catch (err) {
      console.warn(`${LOG_PREFIX} falhou ao listar tags da saleId=${saleId} — ${err.message}`);
    }
    try {
      const withTags = await this.planne.get(`/sales/${saleId}?include=tags`);
      if (asList(withTags && withTags.tags).some(isRecoveryTag)) return true;
    } catch (err) {
      console.warn(`${LOG_PREFIX} falhou ao checar include=tags da saleId=${saleId} — ${err.message}`);
    }
    return false;
  }

  async _ensureRecoveryTag() {
    if (this._recoveryTagId) return this._recoveryTagId;
    const appId = this.planne.APP_ID;
    const tags = asList(await this.planne.get(`/apps/${appId}/tags?search=${encodeURIComponent(RECOVERY_TAG_NAME)}`));
    let tag = tags.find(isRecoveryTag);
    if (!tag) {
      console.log(`${LOG_PREFIX} recovery: criando tag "${RECOVERY_TAG_NAME}"`);
      tag = await this.planne.post(`/apps/${appId}/tags`, { name: RECOVERY_TAG_NAME });
    }
    this._recoveryTagId = tag.id;
    return tag.id;
  }

  // Endpoint específico do playbook (seção 6) — diferente de /paymentMethods,
  // é o único que traz os IDs válidos pra directLinks e os limites de
  // parcelamento (maxInstallmentsNum / minInstallmentAmountCurrencyInfo.amountCents).
  async _getOnlinePaymentInfo() {
    if (this._onlinePaymentInfo) return this._onlinePaymentInfo;
    const appId = this.planne.APP_ID;
    const methods = await this.planne.get(`/apps/${appId}/directLinkPaymentMethods`);
    const online = (Array.isArray(methods) ? methods : [])
      .filter(m => ONLINE_PAYMENT_CODES.includes(m.code) && m.active);

    // Parcelamento faz sentido só pra crédito — usa os limites dele quando
    // disponível; os demais métodos (pix/débito) não parcelam mesmo.
    const creditCard = online.find(m => m.code === 'credit_card');
    const installmentsSource = creditCard || online[0];

    this._onlinePaymentInfo = {
      paymentMethodIds: online.map(m => String(m.id)),
      maxInstallments: installmentsSource?.maxInstallmentsNum || 1,
      minInstallmentAmountCents: installmentsSource?.minInstallmentAmountCurrencyInfo?.amountCents ?? 100,
    };
    return this._onlinePaymentInfo;
  }

  // Debug: inspeciona a resposta crua do getOrder pra uma venda específica —
  // usado só pra validar o mapeamento com dados reais.
  async debugOrder(saleId) {
    const fetched = await this.planne.fetchMappedSale(saleId);
    const sale = fetched ? fetched.sale : null;
    if (!sale) return { saleId, sale: null, order: null };
    const info = await this._fetchTransactionInfo(sale);
    let order = null;
    if (sale.orderId) {
      try { order = await this.planne.get(`/orders/${sale.orderId}?include=lastTransaction`); } catch {}
    }
    return { saleId, orderId: sale.orderId || null, sale, order, ...info };
  }
}

module.exports = { AbandonedCartService, RECOVERY_LINK_TTL_HOURS };
