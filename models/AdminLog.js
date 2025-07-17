const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'admin_logs' });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
