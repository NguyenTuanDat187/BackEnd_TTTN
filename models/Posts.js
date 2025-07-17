// models/Posts.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullname: {
        type: String,
        required: false,
        default: ''
    },
    image: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: true
    },
    media_urls: [{
        type: String
    }],
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends', 'community'], // Added 'community'
        default: 'public'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'], // Defined possible statuses
        default: 'active' // Default is 'active', but will be overridden by controller logic for 'community' posts
    },
    rejectionReason: { // New field to store rejection reason
        type: String,
        default: null
    },
    total_comments: {
        type: Number,
        default: 0
    },
    total_likes: {
        type: Number,
        default: 0
    }
}, {
    collection: 'posts',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Post', PostSchema);