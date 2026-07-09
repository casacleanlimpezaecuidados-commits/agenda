const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'casa_clean_secret_2026';
const JWT_EXPIRES_IN = '24h';

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, generateToken, verifyToken };