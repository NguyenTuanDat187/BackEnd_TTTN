const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND',
    required: true
  },
  payment_method: {
    type: String,
    enum: ['Momo', 'ZaloPay', 'Bank Transfer', 'Credit Card', 'E-Wallet', 'Other'], // Thêm Momo, ZaloPay
    required: true
  },
  transaction_id: { // ID giao dịch nội bộ của bạn
    type: String,
    required: true,
    unique: true
  },
  // Thêm trường cho các ID từ cổng thanh toán
  gateway_transaction_id: { // ID giao dịch từ Momo/ZaloPay
    type: String,
    unique: true,
    sparse: true // Cho phép nhiều tài liệu có giá trị null
  },
  order_info: { // Mô tả giao dịch, thường là "Nạp tiền vào tài khoản [username]"
    type: String,
    default: "Nạp tiền"
  },
  pay_url: { // URL thanh toán từ Momo/ZaloPay (để chuyển hướng người dùng)
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'],
    default: 'Pending',
    required: true
  },
  payment_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  completed_at: {
    type: Date,
    default: null
  },
  failed_reason: {
    type: String,
    default: null
  },
  // Các thông tin khác từ cổng thanh toán nếu cần
  raw_gateway_response: { // Lưu phản hồi đầy đủ từ cổng thanh toán
    type: mongoose.Schema.Types.Mixed // Kiểu dữ liệu linh hoạt
  }
}, {
  collection: 'payments',
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);