const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String, required: true, maxlength: 50
  },
  password: {
    type: String, required: true
  }, // Nên hash bằng bcrypt trước khi lưu
  email: {
    type: String, unique: true, maxlength: 100
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  balance: {
    type: mongoose.Decimal128,
    default: 0.00
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);
