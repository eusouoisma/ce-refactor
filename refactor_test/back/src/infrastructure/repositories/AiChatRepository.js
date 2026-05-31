const { pool } = require('../../shared/db');

class AiChatRepository {
  async saveMessage(userId, sessionId, role, content) {
    const res = await pool.query(
      `INSERT INTO "aiChatMessages" ("userId","sessionId","role","content") VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, sessionId, role, content]
    );
    return res.rows[0];
  }

  async getSessionMessages(sessionId) {
    const res = await pool.query(
      `SELECT * FROM "aiChatMessages" WHERE "sessionId"=$1 ORDER BY "createdAt" ASC`,
      [sessionId]
    );
    return res.rows;
  }

  async getUserSessions(userId) {
    const res = await pool.query(
      `SELECT DISTINCT ON ("sessionId") "sessionId", "createdAt", "content"
       FROM "aiChatMessages"
       WHERE "userId"=$1 AND "role"='user'
       ORDER BY "sessionId", "createdAt" ASC`,
      [userId]
    );
    return res.rows;
  }

  async runReadOnlyQuery(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
      throw new Error('Apenas consultas SELECT são permitidas');
    }
    const res = await pool.query(sql, params);
    return res.rows;
  }
}

module.exports = AiChatRepository;
