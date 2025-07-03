const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Lấy danh sách tất cả bài viết
router.get('/', postController.getAllPosts);

// Tạo bài viết mới
router.post('/', postController.createPost);

// Sửa bài viết
router.put('/:postId', postController.updatePost);

// Xóa bài viết
router.delete('/:postId', postController.deletePost);

module.exports = router;
