const mongoose = require('mongoose');
const moment = require('moment-timezone'); // thêm dòng này
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
        enum: ['public', 'private', 'friends', 'community'],
        default: 'public'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'active'
    },
    rejectionReason: {
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
    },
    created_time_vn: { // thêm trường này
        type: String,
        default: () => moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
    }
}, {
    collection: 'posts',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Post', PostSchema);
