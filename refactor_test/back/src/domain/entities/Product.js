class Product {
  static coerce(data = {}) {
    return {
      type:        data.type        || '',
      category:    data.category    || 'atividade',
      productName: data.productName || '',
      duration:    data.duration    || '',
    };
  }

  static coerceVariant(data = {}) {
    return {
      pricingType:               data.pricingType               || 'person',
      priceAdult:                data.priceAdult                || 0,
      priceHalf:                 data.priceHalf                 || 0,
      priceNet:                  data.priceNet                  || 0,
      priceBrazilian:            data.priceBrazilian            || 0,
      priceFree:                 data.priceFree                 || 0,
      priceGroup:                data.priceGroup                || 0,
      paxLimit:                  data.paxLimit                  || 0,
      priceAdultHighSeason:      data.priceAdultHighSeason      || 0,
      priceHalfHighSeason:       data.priceHalfHighSeason       || 0,
      priceNetHighSeason:        data.priceNetHighSeason        || 0,
      priceFreeHighSeason:       data.priceFreeHighSeason       || 0,
      priceBrazilianHighSeason:  data.priceBrazilianHighSeason  || 0,
      priceGroupHighSeason:      data.priceGroupHighSeason      || 0,
    };
  }
}

module.exports = { Product };
