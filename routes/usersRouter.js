const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController'); // ✅ Đảm bảo file này tồn tại!
const upload = require('../middlewares/upload');

router.post('/register', userController.registerParent);
router.post('/login', userController.loginParent);
router.post('/verify', userController.verifyOTP);
router.post('/update', userController.updateUser);
router.post('/subuser/create-or-update', userController.createOrUpdateSubuserByPhone);


router.get('/', (req, res) => {
  res.send('🟢 userRouter hoạt động!');
});
// ✅ Upload avatar
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);
module.exports = router;
