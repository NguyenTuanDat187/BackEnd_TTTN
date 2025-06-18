// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Email đăng nhập (duy nhất)
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },

  // Mật khẩu (được hash)
  password: {
    type: String,
    required: true
  },

  // Vai trò người dùng: phụ huynh, tài khoản phụ, hoặc admin
  role: {
    type: String,
    enum: ['parent', 'subuser', 'admin'],
    default: 'parent'
  },

  // ID người tạo nếu là tài khoản phụ (subuser)
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Số dư tài khoản nếu có tính năng thanh toán
  balance: {
    type: mongoose.Decimal128,
    default: 0.00
  },

  // Trạng thái xác minh email
  isVerified: {
    type: Boolean,
    default: false
  },

  // Họ tên (tùy chọn)
  fullname: {
    type: String,
    default: ''
  },

  // Số điện thoại (tùy chọn)
  numberphone: {
    type: String,
    default: ''
  },

  // Ảnh đại diện (tùy chọn)
  image: {
    type: String,
    default: ''
  },

  // Thời gian tạo
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users' // Đặt tên rõ ràng cho collection
});

module.exports = mongoose.model('User', UserSchema);
