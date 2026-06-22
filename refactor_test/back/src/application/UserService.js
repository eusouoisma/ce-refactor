const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeShortcuts } = require('../shared/menuPaths');
const { sendTwoFactorCode } = require('./EmailService');

class UserService {
  constructor({ userRepo, signToken }) {
    this.userRepo = userRepo;
    this.signToken = signToken;
  }

  async login(username, password) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return { error: 'Username or password is wrong' };
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: 'Username or password is wrong' };

    if (user.twofa_enabled === false) {
      const token = this.signToken({ userId: user.id, username: user.username, name: user.name, permissions: user.permissions });
      return { error: false, token, permissions: user.permissions, name: user.name };
    }

    if (!user.email) {
      return { error: 'Este usuário não tem email cadastrado. Contate o administrador.' };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await this.userRepo.setTwofaCode(user.id, code, expiry);
    await sendTwoFactorCode(user.email, code);

    return { error: false, requiresCode: true, userId: user.id };
  }

  async verify2fa(userId, code) {
    const user = await this.userRepo.findById2fa(userId);
    if (!user) return { error: 'Usuário não encontrado.' };
    if (!user.twofa_code || !user.twofa_expiry) return { error: 'Nenhum código pendente. Faça login novamente.' };
    if (new Date() > new Date(user.twofa_expiry)) {
      await this.userRepo.clearTwofaCode(userId);
      return { error: 'Código expirado. Faça login novamente.' };
    }
    if (user.twofa_code !== code) return { error: 'Código inválido.' };

    await this.userRepo.clearTwofaCode(userId);
    const token = this.signToken({ userId: user.id, username: user.username, name: user.name, permissions: user.permissions });
    return { error: false, token, permissions: user.permissions, name: user.name };
  }

  async getUser(token) {
    if (!token) return { error: true };
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        username: decoded.username,
        name: decoded.name,
        permissions: decoded.permissions,
        userId: decoded.userId,
      };
    } catch {
      return { error: true };
    }
  }

  async create({ username, name, permissions, password, email = '' }) {
    const exists = await this.userRepo.usernameExists(username);
    if (exists) return { error: 'A user with that username already exists' };
    const hash = await bcrypt.hash(password, 10);
    await this.userRepo.insert(username, name, permissions, hash, email);
    return { error: false };
  }

  async updateSelf(userId, { name, password }) {
    if (password && password !== '') {
      const hash = await bcrypt.hash(password, 10);
      await this.userRepo.updateNameAndPassword(userId, name, hash);
    } else {
      await this.userRepo.updateName(userId, name);
    }
    return { error: false };
  }

  async setTwofaEnabled(id, enabled) {
    await this.userRepo.setTwofaEnabled(id, enabled);
    return { error: false };
  }

  async adminUpdateUser(id, { username, name, email, permissions, password }) {
    let passwordHash = null;
    if (password && password !== '') {
      passwordHash = await bcrypt.hash(password, 10);
    }
    await this.userRepo.adminUpdate(id, { username, name, email, permissions, passwordHash });
    return { error: false };
  }

  async deleteUser(id) {
    await this.userRepo.delete(id);
    return { error: false };
  }

  async listAll() {
    return this.userRepo.findAll();
  }

  async getShortcuts(userId) {
    const raw = await this.userRepo.getShortcuts(userId);
    if (raw == null) return null;
    return sanitizeShortcuts(Array.isArray(raw) ? raw : []);
  }

  async updateShortcuts(userId, shortcuts) {
    const clean = sanitizeShortcuts(shortcuts);
    await this.userRepo.updateShortcuts(userId, clean);
    return { error: false, shortcuts: clean };
  }
}

module.exports = { UserService };
