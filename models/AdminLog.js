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
    default: () => {
      const vnTime = new Date();
      vnTime.setHours(vnTime.getHours() + 7); // Cộng thêm 7 giờ để chuyển sang giờ VN
      return vnTime;
    }
  }
}, { collection: 'admin_logs' });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
