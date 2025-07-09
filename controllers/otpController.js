// controllers/otpController.js
require('dotenv').config();
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const User = require('../models/User');

exports.sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại. Vui lòng dùng email khác.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email }); // Xóa OTP cũ
    await OTP.create({ email, code, expiresAt });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'datntph39291@fpt.edu.vn',
        pass: 'egztyvcmubzmykly',
      },
    });

    const mailOptions = {
      from: 'FMCarer <datntph39291@fpt.edu.vn>',
      to: email,
      subject: 'Xác minh OTP',
      text: `Mã OTP của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Lỗi gửi email:', err);
        return res.status(500).json({ success: false, message: 'Không thể gửi email.' });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP đã gửi về email.',
        otp: code, // ❗ chỉ để test, nên xóa khi production
      });
    });

  } catch (err) {
    console.error('Lỗi sendOtpToEmail:', err);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};
