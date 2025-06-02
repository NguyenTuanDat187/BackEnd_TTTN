const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
  message: {
    type: String, required: true
  },
  type: {
    type: String, enum: ['reminder', 'system', 'post'], default: 'system'
  },
  is_read: {
    type: Boolean, default: false
  },
  created_at: {
    type: Date, default: Date.now
  }
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', NotificationSchema);