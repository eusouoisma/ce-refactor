class Customer {
  static coerce(data = {}) {
    return {
      customerName: data.customerName || '',
      customerType: data.customerType || '',
      createdBy:    data.createdBy    || '',
      lastEditBy:   data.lastEditBy   || '',
    };
  }

  static coerceContact(data = {}) {
    return {
      name:    data.name    || '',
      contact: data.contact || '',
      office:  data.office  || '',
      email:   data.email   || '',
    };
  }
}

module.exports = { Customer };
