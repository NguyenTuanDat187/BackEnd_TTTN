// controllers/otpController.js
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');

exports.sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu OTP vào DB
    await OTP.create({ email, code: generatedOtp, expiresAt });

    // Cấu hình transporter gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'datntph39291@fpt.edu.vn',          // ✅ Thay bằng email của bạn
        pass: 'egztyvcmubzmykly'                     // ✅ Mật khẩu ứng dụng (App Password)
      }
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Xác minh OTP',
      text: `Mã OTP của bạn là: ${generatedOtp}. Mã sẽ hết hạn sau 5 phút.`
    };

    // Gửi email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Lỗi gửi email:', error);
        return res.status(500).json({ success: false, message: 'Không thể gửi email' });
      } else {
        console.log('Email đã gửi:', info.response);
        return res.status(200).json({
          success: true,
          message: 'OTP sent successfully',
          otp: generatedOtp // ❗ Chỉ để test, nên bỏ khi release
        });
      }
    });

  } catch (err) {
    console.error('Lỗi gửi OTP:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
