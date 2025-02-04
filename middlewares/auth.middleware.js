// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt.config');

module.exports = (req, res, next) => {
  // Header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token tidak ditemukan' });
  
  const token = authHeader.split(' ')[1];
  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token tidak valid' });
    req.user = decoded;
    next();
  });
};
