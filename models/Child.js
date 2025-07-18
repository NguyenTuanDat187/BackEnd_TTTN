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
    type: String
  }
}, {
  collection: 'children',
  timestamps: false
});

// Middleware gán created_at theo giờ Việt Nam
ChildSchema.pre('save', function (next) {
  if (!this.created_at) {
    this.created_at = new Date(Date.now() + 7 * 60 * 60 * 1000);
  }
  next();
});

ChildSchema.add({
  created_at: Date
});

module.exports = mongoose.model('Child', ChildSchema);
