const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { loadUsers, saveUsers } = require('../src/storage');
const { hashPassword, verifyPassword } = require('../src/password');

const ALLOWED_ROLES = ['reader', 'author', 'admin'];

function createAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function register(req, res) {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role are required' });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be reader, author, or admin' });
  }

  const users = loadUsers();
  const normalizedUsername = String(username).trim();
  if (users.some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
    return res.status(409).json({ error: 'username is already taken' });
  }

  const user = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    hashed_password: hashPassword(String(password)),
    role,
    refresh_token: null,
    created_at: new Date().toISOString(),
    revoked_at: null
  };

  users.push(user);
  saveUsers(users);
  return res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    created_at: user.created_at
  });
}

function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = loadUsers().find((candidate) => candidate.username === username);
  if (!user || !verifyPassword(String(password), user.hashed_password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  user.refresh_token = refreshToken;
  user.revoked_at = null;
  const users = loadUsers();
  const index = users.findIndex((candidate) => candidate.id === user.id);
  users[index] = user;
  saveUsers(users);

  return res.json({ accessToken, refreshToken });
}

function refresh(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'invalid or expired refresh token' });
  }

  if (payload.type !== 'refresh') {
    return res.status(401).json({ error: 'access tokens cannot be refreshed here' });
  }

  const users = loadUsers();
  const user = users.find((candidate) => candidate.id === payload.id);
  if (!user || user.refresh_token !== refreshToken || user.revoked_at) {
    return res.status(401).json({ error: 'refresh token is revoked or not recognized' });
  }

  return res.json({ accessToken: createAccessToken(user) });
}

function logout(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  const users = loadUsers();
  const user = users.find((candidate) => candidate.refresh_token === refreshToken);
  if (!user) return res.status(401).json({ error: 'invalid or revoked refresh token' });

  user.refresh_token = null;
  user.revoked_at = new Date().toISOString();
  saveUsers(users);
  return res.json({ message: 'logged out successfully' });
}

module.exports = { register, login, refresh, logout };
