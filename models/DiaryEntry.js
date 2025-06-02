const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child', required: true
    },

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },

    activity: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'diary_entries' });

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);