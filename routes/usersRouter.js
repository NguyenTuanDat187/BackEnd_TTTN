const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController'); // ✅ Đảm bảo file này tồn tại!

router.post('/register', userController.registerParent);
router.post('/login', userController.loginParent);
router.post('/verify', userController.verifyOTP);
router.post('/update', userController.updateUser);

router.get('/', (req, res) => {
  res.send('🟢 userRouter hoạt động!');
});

module.exports = router;
