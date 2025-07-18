const Payment = require('../models/Payment');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Để tạo chữ ký (nếu Momo yêu cầu)
const axios = require('axios'); // Để gửi HTTP requests đến Momo API
const moment = require('moment'); // Cần cài đặt: npm install moment

// --- Cấu hình Momo (THỰC TẾ LẤY TỪ .env) ---
// Đảm bảo bạn đã tạo file .env và đặt các biến này trong đó
// Ví dụ:
// MOMO_PARTNER_CODE=MOMO_PARTNER_CODE_FROM_DEV_PORTAL
// MOMO_ACCESS_KEY=MOMO_ACCESS_KEY_FROM_DEV_PORTAL
// MOMO_SECRET_KEY=MOMO_SECRET_KEY_FROM_DEV_PORTAL
// MOMO_RETURN_URL=http://localhost:3000/payment-status // URL frontend của bạn
// MOMO_IPN_URL=http://your-public-domain.com/api/payments/momo-ipn // URL backend công khai

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY';
const MOMO_RETURN_URL = process.env.MOMO_RETURN_URL || 'YOUR_APP_FRONTEND_URL/payment-status';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'YOUR_APP_BACKEND_URL/api/payments/momo-ipn';

// --- Các cấu hình ZaloPay đã được loại bỏ để tập trung vào Momo ---
// const ZLP_APP_ID = process.env.ZLP_APP_ID || 'ZLP_APP_ID';
// const ZLP_KEY1 = process.env.ZLP_KEY1 || 'ZLP_KEY1';
// const ZLP_KEY2 = process.env.ZLP_KEY2 || 'ZLP_KEY2';
// const ZLP_CALLBACK_URL = process.env.ZLP_CALLBACK_URL || 'YOUR_APP_BACKEND_URL/api/payments/zalopay-callback';

// Giả lập hàm gọi API Momo
const callMomoApi = async (orderId, amount, userId, orderInfo, redirectUrl, ipnUrl) => {
    // Trong thực tế, đây là nơi bạn gửi request POST đến API của Momo
    // Xem tài liệu Momo API để biết format request và tạo signature
    const requestId = uuidv4();
    // Chuỗi rawSignature cần được xây dựng chính xác theo tài liệu Momo
    // extraData có thể là JSON string, ở đây để trống
    const extraData = ''; 
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}`;
    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

    // Giả lập phản hồi từ Momo
    return new Promise(resolve => {
        setTimeout(() => {
            const success = Math.random() > 0.05; // 95% thành công, 5% thất bại giả lập
            if (success) {
                resolve({
                    payUrl: `https://mock-momo.com/pay?orderId=${orderId}&amount=${amount}&signature=${signature}&requestId=${requestId}`,
                    deeplink: `momo://?action=pay&data=${orderId}`,
                    qrCodeUrl: `https://mock-momo.com/qr/${orderId}.png`,
                    requestId: requestId, // Momo dùng requestId này cho giao dịch khởi tạo
                    orderId: orderId,
                    message: "Success",
                    resultCode: 0, // 0 là thành công
                    rawResponse: { /* ... raw data from Momo ... */ }
                });
            } else {
                resolve({
                    resultCode: 1001, // Mã lỗi giả lập
                    message: "Momo processing failed, please try again.",
                    rawResponse: { /* ... raw data from Momo ... */ }
                });
            }
        }, 1500); // Giả lập độ trễ mạng
    });
};

// --- Hàm gọi API ZaloPay đã được loại bỏ để tập trung vào Momo ---
// const callZaloPayApi = async (orderId, amount, userId, orderInfo, callbackUrl) => { /* ... */ };


/**
 * @desc Khởi tạo yêu cầu nạp tiền mới qua Momo
 * @route POST /api/payments/topup/initiate
 * @access Private (cần xác thực người dùng)
 */
exports.initiateTopUp = async (req, res) => {
    const { amount, payment_method } = req.body;
    const user_id = req.user._id; // Giả định user ID được lấy từ token xác thực
    const username = req.user.username; // Giả định có username từ user object

    if (!amount || amount <= 0 || !payment_method) {
        console.error('Validation Error: Missing required fields for initiateTopUp.', { amount, payment_method, user_id });
        return res.status(400).json({ message: 'Missing required fields: amount or payment_method.' });
    }
    // Chỉ cho phép Momo
    if (payment_method !== 'Momo') {
        console.error('Validation Error: Invalid payment method for initiateTopUp.', { payment_method, user_id });
        return res.status(400).json({ message: 'Invalid payment method. Only Momo is supported for now.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderId = `PAY_${uuidv4()}`; // ID giao dịch nội bộ của bạn
        const orderInfo = `Nạp tiền vào tài khoản ${username || user_id} - ${orderId}`;

        let newPaymentData = {
            user_id,
            amount,
            currency: 'VND', // Momo thường mặc định là VND
            payment_method: 'Momo', // Đảm bảo là Momo
            transaction_id: orderId,
            order_info: orderInfo,
            status: 'Pending',
            payment_date: new Date()
        };

        const newPayment = new Payment(newPaymentData);
        await newPayment.save({ session });
        console.log('Payment record created with Pending status:', newPayment._id);

        let gatewayResponse;
        let payUrl = null;

        // Chỉ gọi Momo API
        gatewayResponse = await callMomoApi(orderId, amount, user_id.toString(), orderInfo, MOMO_RETURN_URL, MOMO_IPN_URL);

        if (gatewayResponse.resultCode === 0) { // Momo trả về resultCode = 0 là thành công
            payUrl = gatewayResponse.payUrl;
            newPayment.gateway_transaction_id = gatewayResponse.requestId; // Momo dùng requestId làm ID giao dịch ban đầu
            newPayment.pay_url = payUrl;
            newPayment.raw_gateway_response = gatewayResponse;
            await newPayment.save({ session });

            await session.commitTransaction();
            console.log('Momo payment initiated successfully, redirect URL generated:', payUrl);
            return res.status(200).json({
                message: 'Momo payment initiated successfully.',
                payment: newPayment,
                payUrl: payUrl // Trả về URL để frontend chuyển hướng
            });
        } else {
            newPayment.status = 'Failed';
            newPayment.failed_reason = gatewayResponse.message || 'Momo initiation failed.';
            newPayment.raw_gateway_response = gatewayResponse;
            await newPayment.save({ session });
            await session.commitTransaction(); // Commit giao dịch thất bại
            console.error('Momo payment initiation failed:', newPayment.failed_reason, { orderId, gatewayResponse });
            return res.status(400).json({
                message: 'Momo payment initiation failed.',
                error: newPayment.failed_reason,
                payment: newPayment
            });
        }

    } catch (error) {
        await session.abortTransaction(); // Rollback tất cả thay đổi nếu có lỗi
        console.error('Error during payment initiation:', error.message, error.stack); // Log chi tiết lỗi
        res.status(500).json({
            message: 'Server error during payment process.',
            error: error.message
        });
    } finally {
        session.endSession();
        console.log('Payment initiation session ended.');
    }
};

/**
 * @desc Endpoint nhận IPN (Instant Payment Notification) từ Momo
 * @route POST /api/payments/momo-ipn
 * @access Public (Momo gọi đến, không cần xác thực người dùng app)
 */
exports.momoIPN = async (req, res) => {
    // Các trường quan trọng từ Momo IPN: partnerCode, orderId, requestId, amount, resultCode, message, transId, signature
    const { orderId, requestId, amount, resultCode, message, transId, signature } = req.body;
    console.log('Received Momo IPN:', req.body); // Log toàn bộ payload nhận được

    // Kiểm tra chữ ký (signature verification) là bước cực kỳ quan trọng
    // Dựa vào tài liệu Momo để biết cách tạo lại signature để so sánh
    // Ví dụ về cách tạo rawSignature cho IPN (cần kiểm tra tài liệu Momo chính thức):
    // const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${req.body.extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${req.body.orderInfo || ''}&orderType=${req.body.orderType || ''}&partnerCode=${partnerCode}&payType=${req.body.payType || ''}&requestId=${requestId}&responseTime=${req.body.responseTime || ''}&resultCode=${resultCode}&transId=${transId}`;
    // const expectedSignature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');
    // if (signature !== expectedSignature) {
    //     console.warn('Momo IPN: Invalid signature from Momo.', { orderId, signature, expectedSignature });
    //     return res.status(400).json({ message: 'Invalid signature.' });
    // }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Tìm bản ghi thanh toán bằng transaction_id (ID nội bộ của bạn) và gateway_transaction_id (requestId ban đầu của Momo)
        const payment = await Payment.findOne({ transaction_id: orderId, gateway_transaction_id: requestId }).session(session);

        if (!payment) {
            console.warn('Momo IPN: Payment not found for orderId/requestId.', { orderId, requestId });
            await session.abortTransaction();
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        // Kiểm tra tính trùng lặp: Nếu giao dịch đã hoàn thành, không xử lý lại
        if (payment.status === 'Completed') {
            console.log('Momo IPN: Payment already completed for orderId:', orderId);
            await session.commitTransaction(); // Commit để giữ nguyên trạng thái nếu đã hoàn thành
            return res.status(200).json({ message: 'Payment already processed.' });
        }

        if (resultCode === 0) { // Momo: 0 là thành công
            payment.status = 'Completed';
            payment.completed_at = new Date();
            payment.gateway_transaction_id = transId; // Cập nhật ID giao dịch thực từ Momo (transId)
            payment.raw_gateway_response = req.body; // Lưu toàn bộ phản hồi IPN
            await payment.save({ session });

            const user = await User.findById(payment.user_id).session(session);
            if (!user) {
                // Log lỗi nghiêm trọng nếu không tìm thấy user khi payment đã thành công
                console.error('Momo IPN Error: User not found for completed payment.', { userId: payment.user_id, paymentId: payment._id });
                throw new Error('User not found during Momo IPN processing.');
            }
            user.balance = (user.balance || 0) + payment.amount;
            await user.save({ session });

            console.log(`Momo IPN: Successfully processed payment for user ${payment.user_id}, amount ${payment.amount}. Payment ID: ${payment._id}`);
        } else {
            // Giao dịch Momo thất bại
            payment.status = 'Failed';
            payment.failed_reason = message || `Momo failed with result code: ${resultCode}`;
            payment.raw_gateway_response = req.body;
            await payment.save({ session });
            console.log(`Momo IPN: Payment failed for user ${payment.user_id}, orderId ${orderId}. Reason: ${message}. Payment ID: ${payment._id}`);
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Momo IPN processed successfully.' }); // Momo yêu cầu phản hồi 200 OK

    } catch (error) {
        await session.abortTransaction();
        console.error('Error processing Momo IPN:', error.message, error.stack, { orderId, requestId }); // Log chi tiết lỗi
        res.status(500).json({ message: 'Server error processing Momo IPN.', error: error.message });
    } finally {
        session.endSession();
        console.log('Momo IPN session ended.');
    }
};

// --- Endpoint nhận Callback từ ZaloPay đã được loại bỏ để tập trung vào Momo ---
// exports.zalopayCallback = async (req, res) => { /* ... */ };

/**
 * @desc Lấy lịch sử nạp tiền của người dùng
 * @route GET /api/payments/topup/history
 * @access Private (cần xác thực người dùng)
 */
exports.getTopUpHistory = async (req, res) => {
    const user_id = req.user._id;
    const { limit = 10, skip = 0 } = req.query;

    try {
        const payments = await Payment.find({ user_id, payment_method: 'Momo' }) // Chỉ lấy lịch sử Momo
            .sort({ payment_date: -1 }) // Sắp xếp từ mới nhất đến cũ nhất
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const totalPayments = await Payment.countDocuments({ user_id, payment_method: 'Momo' }); // Đếm tổng số giao dịch Momo

        console.log(`Fetched Momo top-up history for user ${user_id}. Total: ${totalPayments}, Limit: ${limit}, Skip: ${skip}`);
        res.status(200).json({
            total: totalPayments,
            limit: parseInt(limit),
            skip: parseInt(skip),
            data: payments
        });
    } catch (error) {
        console.error('Error fetching Momo top-up history:', error.message, error.stack, { user_id }); // Log chi tiết lỗi
        res.status(500).json({ message: 'Server error fetching top-up history.', error: error.message });
    }
};

/**
 * @desc Lấy chi tiết một giao dịch nạp tiền Momo cụ thể
 * @route GET /api/payments/topup/:id
 * @access Private (cần xác thực người dùng)
 */
exports.getPaymentById = async (req, res) => {
    const paymentId = req.params.id;
    const user_id = req.user._id;

    try {
        // Chỉ tìm giao dịch Momo của người dùng
        const payment = await Payment.findOne({ _id: paymentId, user_id, payment_method: 'Momo' });

        if (!payment) {
            console.warn('Momo Payment not found or unauthorized access.', { paymentId, user_id });
            return res.status(404).json({ message: 'Momo Payment not found or you do not have access to it.' });
        }

        console.log(`Fetched Momo payment details for ID: ${paymentId}, user: ${user_id}`);
        res.status(200).json(payment);
    } catch (error) {
        console.error('Error fetching Momo payment by ID:', error.message, error.stack, { paymentId, user_id }); // Log chi tiết lỗi
        res.status(500).json({ message: 'Server error fetching payment details.', error: error.message });
    }
};
