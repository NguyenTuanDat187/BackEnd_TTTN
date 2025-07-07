// models/DiaryEntry.js
const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    user_id: { // Người tạo/ghi nhận nhật ký (có thể là người tạo nhắc nhở hoặc người đánh dấu hoàn thành)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: { // Loại nhật ký: có thể là 'eat', 'sleep', 'bathe', 'vaccine', 'other', 'milestone', 'note', v.v.
        type: String,
        required: true,
        trim: true,
        // Enum có thể được thêm nếu bạn muốn giới hạn các loại nhật ký
        // Ví dụ: enum: ['eat', 'sleep', 'bathe', 'vaccine', 'other_reminder', 'milestone', 'free_note']
    },
    activity: { // Mô tả chi tiết hoạt động hoặc sự kiện. Sẽ bao gồm thông tin tổng hợp từ nhắc nhở.
        type: String,
        required: true,
        trim: true
    },
    // Các trường dưới đây dùng để quản lý nhật ký được tạo từ nhắc nhở
    isFromReminder: { // Đánh dấu nếu nhật ký này được tạo tự động từ một nhắc nhở đã hoàn thành
        type: Boolean,
        default: false
    },
    originalReminderId: { // Lưu ID của nhắc nhở gốc nếu nhật ký được tạo từ nhắc nhở
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
        sparse: true, // Cho phép trường này rỗng (chỉ tồn tại nếu isFromReminder là true)
        unique: true // Đảm bảo mỗi Reminder chỉ tạo ra một DiaryEntry duy nhất (ngăn ngừa tạo trùng lặp)
    },
    // Bạn có thể thêm các trường khác nếu muốn ghi nhận thêm chi tiết đặc biệt cho nhật ký
    // Ví dụ: image: { type: String }, media: [{ type: String }]
}, {
    collection: 'diary_entries', // Tên collection trong MongoDB
    timestamps: {
        createdAt: 'created_at', // Mongoose tự động quản lý thời gian tạo
        updatedAt: 'updated_at'  // Mongoose tự động quản lý thời gian cập nhật cuối cùng
    }
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);