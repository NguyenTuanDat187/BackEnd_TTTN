const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');

// ✅ [1] Đăng ký tài khoản
exports.registerParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ email, password: hash, isVerified: false });

    const existingOtp = await OTP.findOne({ email, expiresAt: { $gt: new Date() } });
    if (existingOtp) {
      return res.status(200).json({
        message: 'Đăng ký thành công! Vui lòng kiểm tra email (OTP đã gửi trước đó).'
      });
    }

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

// ✅ [2] Xác minh OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await OTP.findOne({ email });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

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

// ✅ [3] Đăng nhập (trả về _id để client dùng cập nhật thông tin)
exports.loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Sai mật khẩu'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        fullname: user.fullname || '',
        numberphone: user.numberphone || '',
        image: user.image || ''
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

// ✅ [4] Cập nhật tên, số điện thoại, ảnh (KHÔNG cần email – chỉ cần _id)
exports.updateUser = async (req, res) => {
  try {
    const { _id, fullname, numberphone, image } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu _id người dùng để cập nhật.'
      });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.'
      });
    }

    if (fullname !== undefined) user.fullname = fullname;
    if (numberphone !== undefined) user.numberphone = numberphone;
    if (image !== undefined) user.image = image;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      user
    });
  } catch (err) {
    console.error('Lỗi khi cập nhật user:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật người dùng.'
    });
  }
};
