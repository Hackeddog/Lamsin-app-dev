const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = String(storedPassword).split(':');
  if (!salt || !storedHash) return false;

  const derivedHash = crypto.scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, 'hex');
  return expectedHash.length === derivedHash.length && crypto.timingSafeEqual(derivedHash, expectedHash);
}

module.exports = { hashPassword, verifyPassword };
