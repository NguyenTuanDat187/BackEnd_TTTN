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
    required: false, // ✅ Thay đổi từ 'true' thành 'false'
    default: ''      // ✅ Nên có default để đảm bảo giá trị không phải 'undefined'
  },
  image: {
    type: String,
    required: false // Vẫn giữ nguyên
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
    enum: ['public', 'private', 'friends'],
    default: 'public'
  },
  status: {
    type: String,
    default: 'active'
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