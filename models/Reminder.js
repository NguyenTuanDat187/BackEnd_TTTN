const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  child_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Child',
     required: true 
  },
  type: {
     type: String,
     enum: ['eat', 'sleep', 'bathe', 'vaccine', 'other'],
     required: true
  },
  note: {
     type: String
  },
  reminder_date: {
     type: Date,
     required: true
  },
  reminder_time: {
     type: String,
     required: true
  },
  repeat: {
     type: Boolean,
     default: false
  },
  repeat_type: {
     type: String,
     enum: ['none', 'daily', 'weekly', 'monthly'],
     default: 'none'
  }
}, { collection: 'reminders' });

module.exports = mongoose.model('Reminder', ReminderSchema);