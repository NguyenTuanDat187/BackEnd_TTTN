const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    activity: {
        type: String,
        required: true,
        trim: true
    },
    isFromReminder: {
        type: Boolean,
        default: false
    },
    originalReminderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
        sparse: true,
        unique: true
    },
    local_time: {
        type: String, // Hoặc Date nếu bạn muốn lưu timestamp
        default: () => {
            // Tính giờ Việt Nam (UTC+7)
            const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            return vnDate.toISOString().replace('T', ' ').substring(0, 19);
        }
    }
}, {
    collection: 'diary_entries',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
