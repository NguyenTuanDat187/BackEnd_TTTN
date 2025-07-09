const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const upload = require('../middlewares/upload');

//lấy danh sách người dùng 
router.get('/users', userController.getAllUsers);
// 🧾 Đăng ký tài khoản (kiểm tra OTP trong hàm luôn)
router.post('/register', userController.registerParent);

// 🔐 Đăng nhập tài khoản chính
router.post('/login', userController.loginParent);

// ✏️ Cập nhật thông tin người dùng (fullname, phone, image)
router.post('/update', userController.updateUser);

// 👤 Tạo hoặc cập nhật subuser (con)
router.post('/subuser/create-or-update', userController.createOrUpdateSubuserByPhone);

// 🔐 Đăng nhập subuser
router.post('/login-subuser', userController.loginSubuser);

// 📷 Upload avatar (sử dụng middleware upload.single)
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

// 🌐 Kiểm tra hoạt động
router.get('/', (req, res) => {
  res.send('🟢 userRouter hoạt động!');
});

module.exports = router;
