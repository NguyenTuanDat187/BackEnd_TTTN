const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const upload = require('../middlewares/upload'); // Đảm bảo đường dẫn này đúng

// --- Routes chung cho người dùng --- //

// Lấy danh sách tất cả người dùng
router.get('/users', userController.getAllUsers);

// Đăng ký tài khoản chính (Parent)
router.post('/register', userController.registerParent);

// Đăng nhập tài khoản chính (Parent)
router.post('/login', userController.loginParent);

// Cập nhật thông tin người dùng (Parent hoặc Subuser)
router.post('/update', userController.updateUser);

// Upload avatar
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

// --- Routes cho tài khoản phụ (Subuser) --- //

// Lấy tất cả danh sách subuser của một parent
router.get('/subusers/parent/:parentId', userController.getAllSubusersByParentId);

// Lấy thông tin một subuser cụ thể
router.get('/subuser/:subuserId', userController.getSubuserById);

// Tạo hoặc cập nhật subuser (đã đổi tên hàm trong controller)
router.post('/subuser/create-or-update', userController.createOrUpdateSubuser);

// Xóa một subuser
router.delete('/subuser/:subuserId', userController.deleteSubuser);

// Đăng nhập subuser
router.post('/login-subuser', userController.loginSubuser);


// --- Route kiểm tra hoạt động --- //
router.get('/', (req, res) => {
  res.send('🟢 userRouter hoạt động!');
});
// Xác thực mật khẩu
router.post('/verify-password', userController.verifyPassword);

module.exports = router;