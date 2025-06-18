// routes/authRouter.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController'); // ✅ đúng file

router.post('/register', userController.registerParent);
router.post('/login', userController.loginParent);
router.post('/verify', userController.verifyOTP);

module.exports = router;
