class Comission {
  static coerce(data = {}) {
    return {
      orderRef:            data.orderRef            || '',
      comissionersName:    data.comissionersName    || '',
      comissionersContact: data.comissionersContact || '',
      comissionCurrency:   data.comissionCurrency   || '',
      comissionPrice:      data.comissionPrice      || '',
      comissionPaid:       data.comissionPaid       ? '1' : '0',
      lastEditBy:          data.lastEditBy          || '',
    };
  }
}

module.exports = { Comission };
