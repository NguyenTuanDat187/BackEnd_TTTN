const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true

    },
    visibility: {
        type: String,
        enum: ['family', 'community'],
        required: true

    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    created_at: { type: Date, default: Date.now }
}, { collection: 'posts' });

module.exports = mongoose.model('Post', PostSchema);