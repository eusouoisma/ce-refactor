// Format money value
export function formatMoney(value) {
  if (!value && value !== 0) return '';
  const num = parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get day of week name in Portuguese
export function getDayName(date) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return days[d.getDay()];
}

// Calculate total pax
export function totalPax(tour) {
  return (parseInt(tour.paxAdult)||0) + (parseInt(tour.paxHalf)||0) + (parseInt(tour.paxFree)||0) + (parseInt(tour.paxNet)||0) + (parseInt(tour.paxBrazilian)||0);
}

// Calculate total value from product variants
export function calcVariantValue(variant, paxAdult, paxHalf, paxFree, paxNet, paxBrazilian, numberOfGroups, isHighSeason) {
  if (!variant) return 0;
  if (variant.pricingType === 'group') {
    const price = isHighSeason ? parseFloat(variant.priceGroupHighSeason||0) : parseFloat(variant.priceGroup||0);
    return price * (parseInt(numberOfGroups)||1);
  }
  const priceA = isHighSeason ? parseFloat(variant.priceAdultHighSeason||0) : parseFloat(variant.priceAdult||0);
  const priceH = isHighSeason ? parseFloat(variant.priceHalfHighSeason||0) : parseFloat(variant.priceHalf||0);
  const priceF = isHighSeason ? parseFloat(variant.priceFreeHighSeason||0) : parseFloat(variant.priceFree||0);
  const priceN = isHighSeason ? parseFloat(variant.priceNetHighSeason||0) : parseFloat(variant.priceNet||0);
  const priceB = isHighSeason ? parseFloat(variant.priceBrazilianHighSeason||0) : parseFloat(variant.priceBrazilian||0);
  return (
    (parseInt(paxAdult)||0) * priceA +
    (parseInt(paxHalf)||0) * priceH +
    (parseInt(paxFree)||0) * priceF +
    (parseInt(paxNet)||0) * priceN +
    (parseInt(paxBrazilian)||0) * priceB
  );
}

// Select best variant for given total pax
export function selectVariant(variants, totalPaxCount) {
  if (!variants || variants.length === 0) return null;
  // Sort by paxLimit DESC, select largest that doesn't exceed paxTotal
  const sorted = [...variants].sort((a, b) => parseInt(b.paxLimit||0) - parseInt(a.paxLimit||0));
  const valid = sorted.filter(v => parseInt(v.paxLimit||0) <= totalPaxCount);
  if (valid.length > 0) return valid[0];
  return sorted[sorted.length - 1]; // fallback to smallest
}

// Generate months array
export function getAllMonths() {
  return [
    { num: 1, name: 'Jan' }, { num: 2, name: 'Fev' }, { num: 3, name: 'Mar' },
    { num: 4, name: 'Abr' }, { num: 5, name: 'Mai' }, { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' }, { num: 8, name: 'Ago' }, { num: 9, name: 'Set' },
    { num: 10, name: 'Out' }, { num: 11, name: 'Nov' }, { num: 12, name: 'Dez' },
  ];
}

export function getWeekDayName(dow) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dow] || '';
}
