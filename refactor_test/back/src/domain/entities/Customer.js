class Customer {
  static coerce(data = {}) {
    return {
      companyName:       data.companyName       || '',
      customerType:      data.customerType      || '',
      address:           data.address           || '',
      phone:             data.phone             || '',
      email:             data.email             || '',
      website:           data.website           || '',
      notes:             data.notes             || '',
      razaoSocial:       data.razaoSocial       || '',
      cnpj:              data.cnpj              || '',
      inscricaoEstadual: data.inscricaoEstadual || '',
      enderecoFiscal:    data.enderecoFiscal    || '',
      mainPhone:         data.mainPhone         || '',
      whatsapp:          data.whatsapp          || '',
      emailFinanceiro:   data.emailFinanceiro   || '',
      emailComercial:    data.emailComercial    || '',
      status:            data.status            || 'Ativo',
      createdBy:         data.createdBy         || '',
      lastEditBy:        data.lastEditBy        || '',
    };
  }

  static coerceContact(data = {}) {
    return {
      firstName: data.firstName || '',
      lastName:  data.lastName  || '',
      role:      data.role      || '',
      email:     data.email     || '',
      whatsapp:  data.whatsapp  || '',
      notes:     data.notes     || '',
    };
  }
}

module.exports = { Customer };
