const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user_id: {
     type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
  amount: {
     type: Number, required: true
  },
  payment_date: {
     type: Date, default: Date.now
  }
}, { collection: 'payments' });  

module.exports = mongoose.model('Payment', PaymentSchema);