const SKIP_STATES = new Set(['canceled', 'expired', 'payment_voided', 'payment_chargeback', 'pending', 'created']);
const CANCEL_STATES = new Set(['canceled', 'expired', 'payment_voided', 'payment_chargeback']);

const LANGUAGE_MAP = {
  es: 'Espanhol', en: 'Inglês', pt: 'Português', fr: 'Francês',
  de: 'Alemão',   it: 'Italiano', zh: 'Chinês',   ja: 'Japonês',
  ko: 'Coreano',  ru: 'Russo',   nl: 'Holandês',  ar: 'Árabe',
};

const COUNTRY_MAP = {
  BRA: 'Brasil',      USA: 'Estados Unidos', ARG: 'Argentina',   GBR: 'Reino Unido',
  ESP: 'Espanha',     FRA: 'França',         DEU: 'Alemanha',     ITA: 'Itália',
  CHL: 'Chile',       COL: 'Colômbia',       PRT: 'Portugal',     AUS: 'Austrália',
  CAN: 'Canadá',      MEX: 'México',         URY: 'Uruguai',      PRY: 'Paraguai',
  BOL: 'Bolívia',     PER: 'Peru',           VEN: 'Venezuela',    ECU: 'Equador',
  NLD: 'Holanda',     BEL: 'Bélgica',        CHE: 'Suíça',        AUT: 'Áustria',
  SWE: 'Suécia',      NOR: 'Noruega',        DNK: 'Dinamarca',    FIN: 'Finlândia',
  POL: 'Polônia',     CZE: 'República Tcheca', HUN: 'Hungria',    ROU: 'Romênia',
  RUS: 'Rússia',      CHN: 'China',          JPN: 'Japão',        KOR: 'Coreia do Sul',
  IND: 'Índia',       ZAF: 'África do Sul',  NZL: 'Nova Zelândia', ISR: 'Israel',
};

const STATUS_MAP = {
  payment_complete: 'Pago',
};

class PlanneSyncService {
  constructor({ planneSyncRepo, tourService }) {
    this.repo        = planneSyncRepo;
    this.tourService = tourService;
    this.BASE        = 'https://seller-api.planne.com.br/1';
    this.APP_ID      = process.env.PLANNE_APP_ID    || '2902';
    this.HEADERS     = {
      'X-Client-Id':     process.env.PLANNE_CLIENT_ID     || '',
      'X-Client-Secret': process.env.PLANNE_CLIENT_SECRET || '',
    };
    this._typeNameMap    = null;
    this._tariffTypeMap  = null;
    this._productNameMap = null;
    this._cacheBuilding  = null;
  }

  // ── HTTP ─────────────────────────────────────────────────────────────────

  async _get(path) {
    const res = await fetch(`${this.BASE}${path}`, { headers: this.HEADERS });
    if (!res.ok) throw new Error(`Planne API ${res.status}: ${path}`);
    return res.json();
  }

  _items(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data))  return body.data;
    if (body && Array.isArray(body.items)) return body.items;
    return [];
  }

  async _fetchAllPages(path) {
    let page = 1, all = [];
    const sep = path.includes('?') ? '&' : '?';
    while (true) {
      const body = await this._get(`${path}${sep}perPage=100&page=${page}`);
      const items = this._items(body);
      all = all.concat(items);
      if (items.length < 100) break;
      page++;
    }
    return all;
  }

  // ── Cache ─────────────────────────────────────────────────────────────────

  async _ensureCache() {
    if (this._typeNameMap) return;
    if (!this._cacheBuilding) {
      this._cacheBuilding = this._buildCache().finally(() => { this._cacheBuilding = null; });
    }
    await this._cacheBuilding;
  }

  async _buildCache() {
    const types = await this._get(`/apps/${this.APP_ID}/tariffTypes`);
    this._typeNameMap = {};
    for (const t of this._items(types)) {
      this._typeNameMap[String(t.id)] = t.name || '';
    }

    const products = await this._fetchAllPages(`/apps/${this.APP_ID}/products`);
    this._productNameMap = {};
    for (const p of products) {
      this._productNameMap[String(p.id)] = p.internalName || p.name || '';
    }

    this._tariffTypeMap = {};
    await Promise.all(
      products.map(async (product) => {
        try {
          const groups = await this._get(`/products/${product.id}/tariffGroups`);
          await Promise.all(
            this._items(groups).map(async (group) => {
              try {
                const tariffs = await this._get(`/tariffGroups/${group.id}/tariffs`);
                for (const tariff of this._items(tariffs)) {
                  this._tariffTypeMap[String(tariff.id)] = String(tariff.typeId);
                }
              } catch {}
            })
          );
        } catch {}
      })
    );
  }

  // ── Per-sale fetches ──────────────────────────────────────────────────────

  async _fetchDetailedItems(saleId) {
    try {
      return this._items(await this._get(`/sales/${saleId}/detailedItems`));
    } catch { return []; }
  }

  async _fetchReservations(saleId) {
    try {
      return this._items(await this._get(`/sales/${saleId}/reservations`));
    } catch { return []; }
  }

  async _fetchSaleWithDetails(saleId) {
    try {
      const [sale, detailedItems, reservations] = await Promise.all([
        this._get(`/sales/${saleId}?include=customer`),
        this._fetchDetailedItems(saleId),
        this._fetchReservations(saleId),
      ]);
      return { sale, detailedItems, reservations };
    } catch { return null; }
  }

  // ── Public: manual import ─────────────────────────────────────────────────

  async getAvailableTours() {
    const [importedIds] = await Promise.all([
      this.repo.findImportedPlanneIds(),
      this._ensureCache(),
    ]);

    const allSales = await this._fetchAllPages(
      `/apps/${this.APP_ID}/sales?include=customer`
    );

    const pending = allSales.filter(s =>
      !importedIds.has(s.id) && !SKIP_STATES.has(s.currentState)
    );

    const BATCH = 10;
    const detailedMap = {}, reservMap = {};
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(batch.map(async s => {
        [detailedMap[s.id], reservMap[s.id]] = await Promise.all([
          this._fetchDetailedItems(s.id),
          this._fetchReservations(s.id),
        ]);
      }));
    }

    return pending.map(sale =>
      this._map(sale, detailedMap[sale.id] || [], reservMap[sale.id] || [])
    );
  }

  // ── Public: webhook (queues for manual review) ───────────────────────────

  async processWebhookEvent(event) {
    const { eventType, metadata } = event;
    const saleId = String(metadata.saleId);

    if (eventType === 'SALE_STATE_CHANGE') {
      const { stateTo } = metadata;
      if (!CANCEL_STATES.has(stateTo) && stateTo !== 'payment_complete') return;
      const existing = await this.repo.findTourByPlanneId(saleId);
      if (!existing) return;
      await this.repo.queueEvent('state_change', saleId, { planneCode: null, stateTo, mappedData: null });
      return;
    }

    await this._ensureCache();
    const fetched = await this._fetchSaleWithDetails(saleId);
    if (!fetched) return;
    if (SKIP_STATES.has(fetched.sale.currentState)) return;

    const mapped = this._map(fetched.sale, fetched.detailedItems, fetched.reservations);
    const existing = await this.repo.findTourByPlanneId(saleId);
    const action = existing ? 'update' : 'create';

    await this.repo.queueEvent(action, saleId, { planneCode: mapped.planneCode, stateTo: null, mappedData: mapped });
  }

  async getPendingQueue() {
    return this.repo.getPendingQueue();
  }

  async applyQueueItem(id) {
    const item = await this.repo.getQueueItemById(id);
    if (!item) throw new Error('Item não encontrado ou já processado');

    if (item.action === 'create') {
      const result = await this.tourService.create({ ...item.mappedData, planneId: item.saleId, createdBy: 'Planne (webhook)' });
      if (result.error) throw new Error(result.message);
    } else if (item.action === 'update') {
      await this.repo.updateFromPlanne(item.saleId, item.mappedData);
    } else if (item.action === 'state_change') {
      if (CANCEL_STATES.has(item.stateTo)) {
        await this.repo.cancelTourByPlanneId(item.saleId);
      } else if (item.stateTo === 'payment_complete') {
        await this.repo.setPaymentStatusByPlanneId(item.saleId, STATUS_MAP.payment_complete);
      }
    }

    await this.repo.markQueueItem(id, 'applied');
  }

  async dismissQueueItem(id) {
    await this.repo.markQueueItem(id, 'dismissed');
  }

  // ── Webhook registration ──────────────────────────────────────────────────

  async registerWebhook(callbackUrl) {
    const secret = process.env.PLANNE_WEBHOOK_SECRET;
    const body = {
      url: callbackUrl,
      eventTypes: ['sale.create', 'sale.update', 'SALE_STATE_CHANGE'],
      enabled: true,
      ...(secret ? { headers: { 'X-Webhook-Secret': secret } } : {}),
    };
    const res = await fetch(`${this.BASE}/apps/${this.APP_ID}/webhooks`, {
      method: 'POST',
      headers: { ...this.HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Planne webhook registration failed ${res.status}: ${text}`);
    }
    return res.json();
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

  _tariffTypeName(tariffId) {
    const typeId = this._tariffTypeMap?.[String(tariffId)] || '';
    return this._typeNameMap?.[typeId] || '';
  }

  _paxField(typeName) {
    const n = (typeName || '').toLowerCase();
    if (n.includes('net'))                                                    return 'paxNet';
    if (n.includes('free') || n.includes('crian') || n.includes('cortesia')) return 'paxFree';
    if (n.includes('meia') || n.includes('half') || n.includes('estudante')) return 'paxHalf';
    if (n.includes('carioca') || n.includes('brasileiro') || n.includes('brazil')) return 'paxBrazilian';
    return 'paxAdult';
  }

  _computePax(detailedItems) {
    const pax = { paxAdult: 0, paxHalf: 0, paxFree: 0, paxNet: 0, paxBrazilian: 0 };
    for (const item of detailedItems) {
      for (const t of (item.tariffs || [])) {
        const name  = this._tariffTypeName(t.tariffId);
        const field = this._paxField(name);
        pax[field] += parseInt(t.quantity) || 0;
      }
    }
    return pax;
  }

  _formatDuration(minutes) {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, '0')}`;
  }

  _map(sale, detailedItems, reservations) {
    const item      = detailedItems[0] || {};
    const customer  = sale.customer   || {};
    const resv      = reservations[0] || {};
    const langCode  = (item.selectedAttributes || []).find(a => a.type === 'language')?.value || '';
    const fullName  = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
    const contact   = [customer.email, customer.phone].filter(Boolean).join(' / ');
    const pax       = this._computePax(detailedItems);
    const activity  = this._productNameMap?.[String(item.productId)] || '';
    const type      = activity.toLowerCase().includes('regular') ? 'regular' : 'privativo';

    return {
      planneId:      sale.id,
      planneCode:    sale.code,
      planneState:   sale.currentState,
      orderRef:      sale.code         || '',
      tourDate:      item.scheduleDate || resv.scheduleDate || '',
      tourHour:      item.scheduleTime || resv.scheduleTime || '',
      type,
      activity,
      duration:      this._formatDuration(resv.durationMinutes),
      platform:      'Planne',
      language:      LANGUAGE_MAP[langCode] || langCode || '',
      client:        'Planne',
      clientName:    fullName,
      clientContact: contact,
      country:       customer.countryCode ? [COUNTRY_MAP[customer.countryCode] || customer.countryCode] : [],
      totalValue:    sale.amountCents != null ? (sale.amountCents / 100).toFixed(2) : '',
      currency:        sale.amountCurrencyInfo?.currency || 'BRL',
      paymentStatus:   '',
      comments:        resv.observation || '',
      planneSaleDate:  sale.createdAt || null,
      ...pax,
    };
  }
}

module.exports = { PlanneSyncService };
