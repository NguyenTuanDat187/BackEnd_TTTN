const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  dob: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  avatar_url: {
    type: String // Đường dẫn ảnh đại diện nếu có
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'children' });

module.exports = mongoose.model('Child', ChildSchema);
