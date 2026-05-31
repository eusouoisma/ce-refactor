class User {
  static coerce(data = {}) {
    return {
      username:    data.username    || '',
      name:        data.name        || '',
      permissions: data.permissions || '',
      password:    data.password    || '',
    };
  }
}

module.exports = { User };
