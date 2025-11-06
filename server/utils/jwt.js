const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// Ensure JWT_SECRET is set in production
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

// Use a default only for development
const secret = JWT_SECRET || 'development-secret-key-change-in-production';

function generateToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'wazatutor'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secret, {
      issuer: 'wazatutor'
    });
  } catch (error) {

    throw new Error('Invalid or expired token');
  }
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET: secret
};
