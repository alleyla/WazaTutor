const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'wazatutor'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'wazatutor'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};
