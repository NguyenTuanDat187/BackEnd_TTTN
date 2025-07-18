const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function getVietnamTime() {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  return now;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function () { return this.role !== 'subuser'; },
    unique: true,
    sparse: true,
    maxlength: 100
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['parent', 'subuser', 'admin'],
    default: 'parent',
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  balance: {
    type: mongoose.Decimal128,
    default: 0.00
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  fullname: {
    type: String,
    default: ''
  },
  numberphone: {
    type: String,
    required: function () { return this.role === 'subuser'; },
    unique: function () { return this.role === 'subuser'; },
    sparse: true
  },
  image: {
    type: String,
    default: ''
  },
  isSuspended: {
    type: Boolean,
    default: false,
    index: true
  },
  created_at: {
    type: Date,
    default: getVietnamTime
  }
}, {
  collection: 'users'
});

// GIỮ NGUYÊN HOOK NÀY - ĐÂY LÀ NƠI MẬT KHẨU SẼ ĐƯỢC HASH
UserSchema.pre('save', async function (next) {
  // Chỉ hash nếu mật khẩu đã được sửa đổi (hoặc là mới)
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// So sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);