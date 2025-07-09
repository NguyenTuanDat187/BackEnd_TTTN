require('dotenv').config(); // <== PHẢI đặt trước khi gọi process.env

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

exports.generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET); // sẽ dùng JWT_SECRET từ .env
  } catch (err) {
    console.error("❌ Lỗi trong verifyToken:", err.message);
    return null;
  }
};
