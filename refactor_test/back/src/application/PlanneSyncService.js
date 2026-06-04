const SKIP_STATES = new Set(['canceled', 'expired', 'payment_voided', 'payment_chargeback']);

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
  payment_complete:   'Pago',
  pending:            'Pendente',
  created:            'Criado',
  expired:            'Expirado',
  canceled:           'Cancelado',
  payment_voided:     'Cancelado',
  payment_chargeback: 'Chargeback',
};

class PlanneSyncService {
  constructor({ planneSyncRepo }) {
    this.repo = planneSyncRepo;
    this.BASE   = 'https://seller-api.planne.com.br/1';
    this.APP_ID = process.env.PLANNE_APP_ID    || '2902';
    this.HEADERS = {
      'X-Client-Id':     process.env.PLANNE_CLIENT_ID     || '',
      'X-Client-Secret': process.env.PLANNE_CLIENT_SECRET || '',
    };
  }

  async _get(path) {
    const res = await fetch(`${this.BASE}${path}`, { headers: this.HEADERS });
    if (!res.ok) throw new Error(`Planne API ${res.status}: ${path}`);
    return res.json();
  }

  // Normalise paginated or plain-array responses
  _items(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data))  return body.data;
    if (body && Array.isArray(body.items)) return body.items;
    return [];
  }

  async _fetchAllSales() {
    let page = 1, all = [];
    while (true) {
      const body = await this._get(
        `/apps/${this.APP_ID}/sales?perPage=100&page=${page}&include=customer`
      );
      const items = this._items(body);
      all = all.concat(items);
      if (items.length < 100) break;
      page++;
    }
    return all;
  }

  async _fetchProducts() {
    let page = 1, map = {};
    while (true) {
      const body = await this._get(`/apps/${this.APP_ID}/products?perPage=100&page=${page}`);
      const items = this._items(body);
      for (const p of items) map[String(p.id)] = p.name || p.title || '';
      if (items.length < 100) break;
      page++;
    }
    return map;
  }

  async _fetchSaleItems(saleId) {
    try {
      const body = await this._get(`/sales/${saleId}/items`);
      return this._items(body);
    } catch { return []; }
  }

  async getAvailableTours() {
    const [importedIds, allSales, productMap] = await Promise.all([
      this.repo.findImportedPlanneIds(),
      this._fetchAllSales(),
      this._fetchProducts(),
    ]);

    const pending = allSales.filter(s =>
      !importedIds.has(s.id) && !SKIP_STATES.has(s.currentState)
    );

    // Fetch items for each sale in parallel (capped to avoid overwhelming the API)
    const BATCH = 20;
    const itemsMap = {};
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async s => {
          itemsMap[s.id] = await this._fetchSaleItems(s.id);
        })
      );
    }

    return pending.map(sale => this._map(sale, itemsMap[sale.id] || [], productMap));
  }

  _map(sale, items, productMap) {
    const item     = items[0] || {};
    const customer = sale.customer || {};
    const langCode = (item.selectedAttributes || []).find(a => a.type === 'language')?.value || '';
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');

    return {
      planneId:      sale.id,
      planneCode:    sale.code,
      planneState:   sale.currentState,
      // tour fields
      orderRef:      sale.code     || '',
      tourDate:      item.scheduleDate || '',
      tourHour:      item.scheduleTime || '',
      activity:      productMap[String(item.productId)] || '',
      platform:      'Planne',
      language:      LANGUAGE_MAP[langCode] || langCode || '',
      client:        fullName,
      clientName:    fullName,
      clientContact: customer.email || customer.phone || '',
      country:       customer.countryCode ? [COUNTRY_MAP[customer.countryCode] || customer.countryCode] : [],
      totalValue:    sale.amountCents != null ? (sale.amountCents / 100).toFixed(2) : '',
      currency:      sale.amountCurrencyInfo?.currency || 'BRL',
      paymentStatus: STATUS_MAP[sale.currentState] || sale.currentState || '',
      comments:      '',
      createdAt:     sale.createdAt,
    };
  }
}

module.exports = { PlanneSyncService };
