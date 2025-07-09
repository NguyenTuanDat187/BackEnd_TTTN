const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function () {
      return this.role !== 'subuser'; // Subuser không cần email
    },
    unique: true,
    sparse: true, // Chỉ enforce unique nếu có giá trị
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
  index: true // Thêm index cho role
},

created_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null,
  index: true // Thêm index cho created_by
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
    required: function () {
      return this.role === 'subuser'; // Subuser bắt buộc có số điện thoại
    },
    unique: function () {
      return this.role === 'subuser'; // Unique chỉ cho subuser
    },
    sparse: true // Cho phép một số bản ghi không có numberphone
  },

  image: {
    type: String,
    default: ''
  },

  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users'
});

module.exports = mongoose.model('User', UserSchema);
