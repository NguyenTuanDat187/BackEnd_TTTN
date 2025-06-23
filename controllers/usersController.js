const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// ✅ Đăng ký tài khoản cha mẹ
exports.registerParent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ email, password: hash, isVerified: false });

    // Gửi OTP nếu chưa có (chưa hết hạn)
    const existingOtp = await OTP.findOne({ email, expiresAt: { $gt: new Date() } });
    if (!existingOtp) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.create({
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      await sendEmail(email, 'Mã xác thực tài khoản FMCarer', `Mã OTP của bạn là: ${code}`);
    }

    res.status(200).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email.' });
  } catch (err) {
    console.error('Đăng ký lỗi:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

// ✅ Xác minh OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await OTP.findOne({ email });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    await OTP.deleteMany({ email });

    res.status(200).json({
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
    res.status(500).json({ message: 'Lỗi server khi xác minh OTP.' });
  }
};

// ✅ Đăng nhập (email dùng cho parent)
exports.loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Sai mật khẩu' });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        fullname: user.fullname,
        numberphone: user.numberphone,
        image: user.image
      }
    });
  } catch (err) {
    console.error('Đăng nhập lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
  }
};

// ✅ Cập nhật thông tin người dùng
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
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        numberphone: user.numberphone,
        image: user.image,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Lỗi khi cập nhật user:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật người dùng.'
    });
  }
};

// ✅ Upload ảnh đại diện
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Tải ảnh thành công',
      imageUrl
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh' });
  }
};

;


// ✅ Tạo hoặc cập nhật SubUser dựa trên số điện thoại & parentId
exports.createOrUpdateSubuserByPhone = async (req, res) => {
  try {
    const { numberphone, password, fullname, image, parentId, relationship } = req.body;

    console.log('📥 Nhận yêu cầu tạo/cập nhật SubUser:', req.body);

    // 📌 Kiểm tra dữ liệu đầu vào
    if (!numberphone?.trim() || !password?.trim() || !parentId?.trim()) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (số điện thoại, mật khẩu, parentId)'
      });
    }

    // 📌 Kiểm tra parentId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: 'parentId không hợp lệ' });
    }

    // 📌 Kiểm tra xem parent có tồn tại không
    const parent = await User.findOne({ _id: parentId, role: 'parent' });
    if (!parent) {
      return res.status(400).json({ message: 'Không tìm thấy tài khoản cha (parent)' });
    }

    // 📌 Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📌 Kiểm tra nếu SubUser đã tồn tại theo số điện thoại và parentId
    let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });

    if (subuser) {
      // ✅ Nếu tồn tại → cập nhật lại
      subuser.password = hashedPassword;
      subuser.fullname = fullname || subuser.fullname;
      subuser.image = image || subuser.image;
      await subuser.save();

      return res.status(200).json({
        message: 'Cập nhật tài khoản phụ thành công',
        user: subuser
      });
    }

    // 📌 Kiểm tra số lượng subuser của parent
    const count = await User.countDocuments({ role: 'subuser', created_by: parentId });
    if (count >= 10) {
      return res.status(400).json({ message: 'Bạn đã tạo tối đa 10 tài khoản phụ' });
    }

    // ✅ Nếu chưa tồn tại → tạo mới subuser
    subuser = new User({
      numberphone,
      password: hashedPassword,
      fullname: fullname || '',
      image: image || '',
      role: 'subuser',
      created_by: parentId,
      email: null // Email không cần thiết cho subuser
    });

    await subuser.save();

    return res.status(201).json({
      message: 'Tạo tài khoản phụ thành công',
      user: subuser
    });

  } catch (error) {
    console.error('❌ Lỗi khi xử lý SubUser:', error.message);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};