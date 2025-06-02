const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'file'],
        required: true
    },
    file_url: {
        type: String,
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    diary_entry_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiaryEntry'
    },
    uploaded_at: {
        type: Date, default: Date.now
    }
}, { collection: 'media' });

module.exports = mongoose.model('Media', MediaSchema);