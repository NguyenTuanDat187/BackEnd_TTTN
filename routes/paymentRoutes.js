const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Middleware xác thực giả lập (trong thực tế bạn sẽ dùng middleware thật)
const authMiddleware = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }
    req.user = { _id: '66976865a77478051752b12f', username: 'testuser' }; // Thêm username để dùng trong orderInfo
    next();
};

// @route   POST /api/payments/topup/initiate
// @desc    Khởi tạo yêu cầu nạp tiền mới (Chỉ hỗ trợ Momo)
// @access  Private (yêu cầu xác thực)
router.post('/topup/initiate', authMiddleware, paymentController.initiateTopUp);

// @route   POST /api/payments/momo-ipn
// @desc    Endpoint nhận IPN từ Momo
// @access  Public (Không cần xác thực của app bạn, Momo sẽ gọi đến)
router.post('/momo-ipn', paymentController.momoIPN);

// --- Endpoint nhận Callback từ ZaloPay đã được loại bỏ để tập trung vào Momo ---
// @route   POST /api/payments/zalopay-callback
// @desc    Endpoint nhận Callback từ ZaloPay
// @access  Public (Không cần xác thực của app bạn, ZaloPay sẽ gọi đến)
// router.post('/zalopay-callback', paymentController.zalopayCallback);

// @route   GET /api/payments/topup/history
// @desc    Lấy lịch sử nạp tiền Momo của người dùng
// @access  Private (yêu cầu xác thực)
router.get('/topup/history', authMiddleware, paymentController.getTopUpHistory);

// @route   GET /api/payments/topup/:id
// @desc    Lấy chi tiết một giao dịch nạp tiền Momo cụ thể
// @access  Private (yêu cầu xác thực)
router.get('/topup/:id', authMiddleware, paymentController.getPaymentById);

module.exports = router;
