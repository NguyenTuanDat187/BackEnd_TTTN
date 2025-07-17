// routes/AdminRouter.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/requireAdmin');

// ✅ Hiển thị trang đăng nhập Admin (GET /admin/login)
router.get('/login', adminController.showLoginForm);

// ✅ Xử lý đăng nhập Admin (POST /admin/login)
router.post('/login', adminController.handleLogin);

// ✅ Trang Dashboard Admin (GET /admin/dashboard) - yêu cầu xác thực Admin
router.get('/dashboard', requireAdmin, adminController.dashboard);

// ✅ Danh sách người dùng
router.get('/users', requireAdmin, adminController.getUserList);

// ✅ Chuyển đổi trạng thái đình chỉ/mở đình chỉ người dùng (CẬP NHẬT ROUTE NÀY)
router.post('/users/:id/toggle-suspension', requireAdmin, adminController.toggleUserSuspension);

// ✅ Đăng xuất Admin (POST /admin/logout)
router.post('/logout', adminController.handleLogout);

module.exports = router;