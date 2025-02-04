// config/jwt.config.js
const JWT_SECRET = process.env.JWT_SECRET;
module.exports = {
    secret: JWT_SECRET // Ganti dengan secret yang lebih aman untuk production
  };
  