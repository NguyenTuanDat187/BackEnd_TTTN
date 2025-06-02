const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post', required: true
    },
    reason: {
        type: String, required: true
    },
    status: {
        type: String, enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    created_at: {
        type: Date, default: Date.now
    }
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);