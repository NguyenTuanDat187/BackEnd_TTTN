const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/token');




// lấy danh sách người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Ẩn password

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách người dùng thành công.',
            users
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách user:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách người dùng.'
        });
    }
};

// --- Đăng ký, Xác minh OTP, Đăng nhập --- //

exports.registerParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            isVerified: true, // ✅ Cho xác minh luôn
            role: 'parent'
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công.',
            user: {
                _id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname || '',
                numberphone: newUser.numberphone || '',
                image: newUser.image || ''
            }
        });

    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký tài khoản.' });
    }
};

exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const user = await User.findOne({ email, role: 'parent' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        // ✅ Tạo token
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token, // Trả về token cho client
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
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
    }
};


// --- Quản lý tài khoản --- //

exports.updateUser = async (req, res) => {
    try {
        const { _id, fullname, numberphone, image } = req.body;

        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (fullname !== undefined) user.fullname = fullname;
        if (numberphone !== undefined) user.numberphone = numberphone;
        if (image !== undefined) user.image = image;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thành công.',
            user
        });
    } catch (err) {
        console.error('Lỗi cập nhật:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng.' });
    }
};

// --- Subuser (con) --- //

exports.createOrUpdateSubuserByPhone = async (req, res) => {
    try {
        const { numberphone, password, fullname, image, parentId } = req.body;
        const relationship = req.body.relationship || 'unknown';

        if (!numberphone || !password || !parentId) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'parentId không hợp lệ.' });
        }

        const parent = await User.findOne({ _id: parentId, role: 'parent' });
        if (!parent) {
            return res.status(400).json({ message: 'Không tìm thấy parent.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });

        if (subuser) {
            subuser.password = hashedPassword;
            subuser.fullname = fullname ?? subuser.fullname;
            subuser.image = image ?? subuser.image;
            subuser.relationship = relationship;
            await subuser.save();

            return res.status(200).json({ message: 'Cập nhật subuser thành công.', user: subuser });
        }

        const subuserCount = await User.countDocuments({ role: 'subuser', created_by: parentId });
        if (subuserCount >= 10) {
            return res.status(400).json({ message: 'Đã đạt giới hạn 10 subuser.' });
        }

        subuser = new User({
            numberphone,
            password: hashedPassword,
            fullname: fullname || '',
            image: image || '',
            role: 'subuser',
            created_by: parentId,
            relationship,
            email: null
        });

        await subuser.save();

        return res.status(201).json({ message: 'Tạo subuser thành công.', user: subuser });
    } catch (error) {
        console.error('Lỗi xử lý subuser:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.loginSubuser = async (req, res) => {
    try {
        const { numberphone, password } = req.body;

        if (!numberphone || !password) {
            return res.status(400).json({ message: 'Thiếu số điện thoại hoặc mật khẩu.' });
        }

        const user = await User.findOne({ numberphone, role: 'subuser' });
        if (!user) {
            return res.status(400).json({ message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            user
        });
    } catch (err) {
        console.error('Lỗi đăng nhập subuser:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập subuser.' });
    }
};
exports.uploadAvatar = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
        }

        // Lưu đường dẫn file (tuỳ cấu hình Multer - có thể cần chỉnh path phù hợp)
        const imagePath = `/uploads/${req.file.filename}`;
        user.image = imagePath;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Tải ảnh lên thành công.',
            image: imagePath,
            user
        });
    } catch (err) {
        console.error('Lỗi upload avatar:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh.' });
    }
};
