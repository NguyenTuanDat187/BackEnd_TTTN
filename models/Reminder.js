const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  custom_type: {
    type: String,
    default: null,
    validate: {
      validator: function (value) {
        if (this.type === 'other') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'custom_type is required when type is "other".'
    }
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
  },
  is_completed: {
    type: Boolean,
    default: false
  }
}, { collection: 'reminders' });

module.exports = mongoose.model('Reminder', ReminderSchema);
