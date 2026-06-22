class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUsername(username) {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions, password, email FROM users WHERE username = $1 AND deleted = 0`,
      [username]
    );
    return res.rows[0] || null;
  }

  async findById2fa(id) {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions, twofa_code, twofa_expiry FROM users WHERE id = $1 AND deleted = 0`,
      [id]
    );
    return res.rows[0] || null;
  }

  async setTwofaCode(id, code, expiryDate) {
    await this.pool.query(
      `UPDATE users SET twofa_code = $1, twofa_expiry = $2 WHERE id = $3`,
      [code, expiryDate, id]
    );
  }

  async clearTwofaCode(id) {
    await this.pool.query(
      `UPDATE users SET twofa_code = NULL, twofa_expiry = NULL WHERE id = $1`,
      [id]
    );
  }

  async findById(id) {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions, shortcuts FROM users WHERE id = $1 AND deleted = 0`,
      [id]
    );
    return res.rows[0] || null;
  }

  async getShortcuts(id) {
    const res = await this.pool.query(
      `SELECT shortcuts FROM users WHERE id = $1 AND deleted = 0`,
      [id]
    );
    const val = res.rows[0]?.shortcuts;
    return val == null ? null : val;
  }

  async updateShortcuts(id, shortcuts) {
    await this.pool.query(
      `UPDATE users SET shortcuts = $1::jsonb WHERE id = $2`,
      [JSON.stringify(shortcuts), id]
    );
  }

  async usernameExists(username) {
    const res = await this.pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    return res.rows.length > 0;
  }

  async insert(username, name, permissions, passwordHash, email = '') {
    await this.pool.query(
      `INSERT INTO users (username, name, permissions, password, email) VALUES ($1, $2, $3, $4, $5)`,
      [username, name, permissions, passwordHash, email]
    );
  }

  async updateNameAndPassword(id, name, passwordHash) {
    await this.pool.query(
      `UPDATE users SET name = $1, password = $2 WHERE id = $3`,
      [name, passwordHash, id]
    );
  }

  async updateName(id, name) {
    await this.pool.query(
      `UPDATE users SET name = $1 WHERE id = $2`,
      [name, id]
    );
  }

  async delete(id) {
    await this.pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async findAll() {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions, email FROM users WHERE deleted = 0`
    );
    return res.rows;
  }
}

module.exports = { UserRepository };
