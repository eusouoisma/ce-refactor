const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const token = this.signToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      permissions: user.permissions,
    });
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

  async create({ username, name, permissions, password }) {
    const exists = await this.userRepo.usernameExists(username);
    if (exists) return { error: 'A user with that username already exists' };
    const hash = await bcrypt.hash(password, 10);
    await this.userRepo.insert(username, name, permissions, hash);
    return { error: false };
  }

  async updateSelf(userId, { username, name, password }) {
    if (password && password !== '') {
      const hash = await bcrypt.hash(password, 10);
      await this.userRepo.updateWithPassword(userId, username, name, hash);
    } else {
      await this.userRepo.updateWithoutPassword(userId, username, name);
    }
    return { error: false };
  }

  async deleteUser(id) {
    await this.userRepo.delete(id);
    return { error: false };
  }

  async listAll() {
    return this.userRepo.findAll();
  }
}

module.exports = { UserService };
