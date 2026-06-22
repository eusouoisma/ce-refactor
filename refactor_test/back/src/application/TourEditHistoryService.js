const FIELD_LABELS = {
  type:               'Tipo',
  orderRef:           'Nº Reserva',
  platform:           'Plataforma',
  activity:           'Atividade',
  adicional:          'Adicional',
  duration:           'Duração',
  tourDate:           'Data do Tour',
  tourHour:           'Hora',
  local:              'Local',
  status:             'Status',
  language:           'Idioma',
  client:             'Cliente',
  clientName:         'Nome do Contato',
  clientContact:      'Contato',
  country:            'País',
  paxAdult:           'Pax Adulto',
  paxHalf:            'Pax Meia',
  paxFree:            'Pax Cortesia',
  paxNet:             'Pax NET',
  paxBrazilian:       'Pax Brasileiro',
  currency:           'Moeda',
  paymentMethod:      'Forma de Pagamento',
  paymentStatus:      'Status Pagamento',
  totalValue:         'Valor Total',
  netValue:           'Valor NET',
  numberOfGroups:     'Nº de Grupos',
  ceGuide:            'Guia CE',
  companionName:      'Nome Acompanhante',
  companionContact:   'Contato Acompanhante',
  emailSubject:       'Assunto Email',
  commissioned:       'Comissionado',
  comments:           'Observações',
  conversationHistory:'Histórico Conversa',
  isHighSeason:       'Alta Temporada',
  financialComments:  'Obs. Financeiro',
  company:            'Empresa',
  invoiceNumber:      'Nº Fatura',
  accountNumber:      'Conta',
  paymentDate:        'Data Pagamento',
};

const OFFICE_FIELDS = [
  'type', 'orderRef', 'platform', 'activity', 'adicional', 'duration',
  'tourDate', 'tourHour', 'local', 'status', 'language',
  'client', 'clientName', 'clientContact', 'country',
  'paxAdult', 'paxHalf', 'paxFree', 'paxNet', 'paxBrazilian',
  'currency', 'paymentMethod', 'paymentStatus', 'totalValue',
  'numberOfGroups', 'ceGuide', 'companionName', 'companionContact',
  'emailSubject', 'commissioned', 'comments', 'conversationHistory', 'isHighSeason',
];

const FINANCIAL_FIELDS = [
  'type', 'orderRef', 'platform', 'activity', 'adicional',
  'tourDate', 'tourHour', 'status', 'paymentStatus',
  'client', 'clientName', 'clientContact',
  'paymentMethod', 'currency', 'totalValue', 'netValue',
  'financialComments', 'company', 'invoiceNumber', 'accountNumber',
  'paymentDate', 'isHighSeason', 'commissioned', 'conversationHistory', 'comments',
];

function normalize(key, val) {
  if (val === null || val === undefined) return '';

  if (key === 'isHighSeason' || key === 'commissioned') {
    return (val === 1 || val === '1' || val === true) ? 'Sim' : 'Não';
  }

  if (key === 'tourDate' || key === 'paymentDate') {
    if (!val) return '';
    try {
      const d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const day   = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getUTCFullYear()}`;
    } catch { return String(val); }
  }

  if (key === 'adicional') {
    const s = String(val).trim();
    if (!s || s === '[]') return '';
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.filter(Boolean).join(', ');
    } catch {}
    return s;
  }

  return String(val).trim();
}

class TourEditHistoryService {
  constructor({ tourEditHistoryRepo }) {
    this.repo = tourEditHistoryRepo;
  }

  async recordChanges(tourId, oldTour, newTour, editedBy, type, tx) {
    const fields = type === 'financial' ? FINANCIAL_FIELDS : OFFICE_FIELDS;
    const records = [];
    for (const field of fields) {
      const oldVal = normalize(field, oldTour[field]);
      const newVal = normalize(field, newTour[field]);
      if (oldVal !== newVal) {
        records.push({
          tourId: parseInt(tourId),
          type,
          fieldName:  field,
          fieldLabel: FIELD_LABELS[field] || field,
          oldValue:   oldVal,
          newValue:   newVal,
          editedBy:   editedBy || '',
        });
      }
    }
    if (records.length > 0) {
      await this.repo.insertMany(records, tx);
    }
  }

  async recordCreation(tourId, createdBy, type, tx) {
    await this.repo.insertMany([{
      tourId:     parseInt(tourId),
      type:       type || 'office',
      fieldName:  '__created__',
      fieldLabel: 'Tour criado',
      oldValue:   '',
      newValue:   '',
      editedBy:   createdBy || '',
    }], tx);
  }

  async getHistory(tourId, type = null) {
    return this.repo.findByTourId(tourId, type);
  }
}

module.exports = { TourEditHistoryService };
