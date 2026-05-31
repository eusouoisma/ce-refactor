class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUsername(username) {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions, password FROM users WHERE username = $1 AND deleted = 0`,
      [username]
    );
    return res.rows[0] || null;
  }

  async findById(id) {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions FROM users WHERE id = $1 AND deleted = 0`,
      [id]
    );
    return res.rows[0] || null;
  }

  async usernameExists(username) {
    const res = await this.pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    return res.rows.length > 0;
  }

  async insert(username, name, permissions, passwordHash) {
    await this.pool.query(
      `INSERT INTO users (username, name, permissions, password) VALUES ($1, $2, $3, $4)`,
      [username, name, permissions, passwordHash]
    );
  }

  async updateWithPassword(id, username, name, passwordHash) {
    await this.pool.query(
      `UPDATE users SET username = $1, name = $2, password = $3 WHERE id = $4`,
      [username, name, passwordHash, id]
    );
  }

  async updateWithoutPassword(id, username, name) {
    await this.pool.query(
      `UPDATE users SET username = $1, name = $2 WHERE id = $3`,
      [username, name, id]
    );
  }

  async delete(id) {
    await this.pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async findAll() {
    const res = await this.pool.query(
      `SELECT id, username, name, permissions FROM users WHERE deleted = 0`
    );
    return res.rows;
  }
}

module.exports = { UserRepository };
