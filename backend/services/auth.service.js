const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, plan: user.plan || 'free' },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, env.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  async register(email, password, authMethod = 'email') {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new Error('Email already registered');
    const user = await User.create({ email, password, authMethod });
    const safeUser = { id: user.id, email: user.email, role: user.role, plan: user.plan || 'free' };
    return { user: safeUser, token: this.generateToken(user) };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await user.comparePassword(password);
    if (!valid) throw new Error('Invalid credentials');
    const safeUser = { id: user.id, email: user.email, role: user.role, plan: user.plan || 'free' };
    return { user: safeUser, token: this.generateToken(user) };
  }

  async googleAuth(profile) {
    const { email } = profile;
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        password: 'google-auth',
        authMethod: 'google',
      });
    }
    const safeUser = { id: user.id, email: user.email, role: user.role, plan: user.plan || 'free' };
    return { user: safeUser, token: this.generateToken(user) };
  }
}

module.exports = new AuthService();
