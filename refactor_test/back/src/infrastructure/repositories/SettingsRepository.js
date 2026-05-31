class SettingsRepository {
  constructor(pool) {
    this.pool = pool;
  }

  _db(tx) { return tx || this.pool; }

  async findAll() {
    const res = await this.pool.query(`SELECT id, type, value FROM settings ORDER BY value ASC`);
    return res.rows;
  }

  async findByType(type) {
    const res = await this.pool.query(
      `SELECT value FROM settings WHERE type = $1 ORDER BY value ASC`, [type]
    );
    return res.rows;
  }

  async getCurrentYear() {
    const res = await this.pool.query(
      `SELECT value FROM settings WHERE LOWER(type) = 'currentyear' LIMIT 1`
    );
    return res.rows[0]?.value || new Date().getFullYear().toString();
  }

  async insert(type, value, year) {
    await this.pool.query(
      `INSERT INTO settings (type, value, year) VALUES ($1,$2,$3)`,
      [type || '', value || '', year]
    );
  }

  async delete(id) {
    await this.pool.query(`DELETE FROM settings WHERE id = $1`, [id]);
  }

  async updateCurrentYear(value) {
    await this.pool.query(`UPDATE settings SET value = $1 WHERE type = 'currentYear'`, [value]);
    await this.pool.query(`UPDATE settings SET value = $1 WHERE type = 'CurrentYear'`, [value]);
  }

  async generateOrderRef(tx) {
    const db = this._db(tx);
    const res = await db.query(
      `SELECT id, value FROM settings WHERE type = 'orderRefCount' LIMIT 1`
    );
    const count = parseInt(res.rows[0]?.value || '0') + 1;
    await db.query(
      `UPDATE settings SET value = $1 WHERE type = 'orderRefCount'`,
      [String(count)]
    );
    return 'CE' + String(count).padStart(4, '0');
  }
}

module.exports = { SettingsRepository };
