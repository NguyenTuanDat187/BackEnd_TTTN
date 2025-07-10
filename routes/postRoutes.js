const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
// ✅ Import middleware xác thực của bạn. Đảm bảo đường dẫn đúng!
const { requireAuth } = require('../middlewares/auth');

// Lấy danh sách tất cả bài viết
// Route này không yêu cầu xác thực, cho phép mọi người xem các bài viết.
router.get('/', postController.getAllPosts);

// Tạo bài viết mới
// BẮT BUỘC PHẢI CÓ XÁC THỰC! Chỉ người dùng đã đăng nhập mới có thể tạo bài viết.
router.post('/', requireAuth, postController.createPost);

// Sửa bài viết
// BẮT BUỘC PHẢI CÓ XÁC THỰC! Chỉ người dùng đã đăng nhập mới có thể sửa bài viết.
router.put('/:postId', requireAuth, postController.updatePost);

// Xóa bài viết
// BẮT BUỘC PHẢI CÓ XÁC THỰC! Chỉ người dùng đã đăng nhập mới có thể xóa bài viết.
router.delete('/:postId', requireAuth, postController.deletePost);

module.exports = router;