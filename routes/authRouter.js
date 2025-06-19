// routes/authRouter.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerParent);
router.post('/login', authController.loginParent);
router.post('/verify', authController.verifyOTP);

module.exports = router;
