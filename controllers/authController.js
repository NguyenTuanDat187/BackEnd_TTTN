const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');

// ✅ Đăng ký tài khoản (Gửi OTP qua email, chưa xác minh)
exports.registerParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email đã tồn tại
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hash = await bcrypt.hash(password, 10);

    // Tạo user với isVerified: false
    await User.create({ email, password: hash, isVerified: false });

    // Kiểm tra OTP còn hạn
    const existingOtp = await OTP.findOne({ email, expiresAt: { $gt: new Date() } });
    if (existingOtp) {
      return res.status(200).json({
        message: 'Đăng ký thành công! Vui lòng kiểm tra email (OTP đã gửi trước đó).'
      });
    }

    // Gửi OTP mới
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendEmail(email, 'Mã xác thực tài khoản FMCarer', `Mã OTP của bạn là: ${code}`);

    return res.status(200).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh.' });
  } catch (err) {
    console.error('Đăng ký lỗi:', err);
    return res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

// ✅ Xác minh OTP để xác thực tài khoản
exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await OTP.findOne({ email });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Cập nhật xác minh
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    // Xóa OTP sau khi xác minh
    await OTP.deleteMany({ email });

    return res.status(200).json({
      message: 'Xác minh thành công!',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('OTP lỗi:', err);
    return res.status(500).json({ message: 'Lỗi server khi xác minh OTP.' });
  }
};

// ✅ Đăng nhập KHÔNG kiểm tra isVerified
exports.loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📥 Email:", email);
    console.log("📥 Password:", password);

    const user = await User.findOne({ email });
    console.log("🔍 Found User:", user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Sai mật khẩu'
      });
    }

    // Trả về đúng format app cần
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error('Đăng nhập lỗi:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập.'
    });
  }
};


