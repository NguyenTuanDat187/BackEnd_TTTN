// controllers/adminController.js
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/token');
const logAdminAction = require('../middlewares/logger');

// 📌 Hiển thị form đăng nhập Admin
exports.showLoginForm = (req, res) => {
    res.render('login', { error: null });
};

// 📌 Xử lý đăng nhập Admin
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.render('login', {
                error: 'Vui lòng nhập đầy đủ email và mật khẩu.'
            });
        }

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            console.log(`❌ Đăng nhập thất bại: Tài khoản '${email}' không tồn tại hoặc không phải admin.`);
            return res.render('login', {
                error: 'Tài khoản không tồn tại hoặc không có quyền truy cập.'
            });
        }

        if (user.isSuspended) { // Kiểm tra trạng thái đình chỉ của chính admin
            console.log(`❌ Đăng nhập admin thất bại: Tài khoản '${email}' đã bị đình chỉ.`);
            return res.render('login', {
                error: 'Tài khoản admin của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên cấp cao.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`❌ Đăng nhập thất bại: Mật khẩu không đúng cho tài khoản '${email}'.`);
            return res.render('login', { error: 'Mật khẩu không đúng.' });
        }

        const token = generateToken({
            _id: user._id,
            email: user.email,
            role: user.role,
            fullname: user.fullname,
            image: user.image
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        console.log(`✅ Admin ${user.email} đã đăng nhập thành công.`);

        await logAdminAction(user._id, `Admin ${user.email} đã đăng nhập.`);

        return res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('❌ Lỗi khi xử lý đăng nhập admin:', err.message);
        return res.status(500).render('login', {
            error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.'
        });
    }
};

// 📌 Trang Dashboard Admin
exports.dashboard = async (req, res) => {
    try {
        const currentAdmin = req.user;

        const userCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        res.render('dashboard', {
            userCount,
            subuserCount,
            adminCount,
            admin: currentAdmin
        });
    } catch (error) {
        console.error('[AdminController] ❌ Dashboard Error:', error);
        res.status(500).send('Lỗi server khi hiển thị trang dashboard.');
    }
};

// 📌 Danh sách người dùng
exports.getUserList = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['parent', 'subuser'] } }).select('-password');

        const parentCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });

        res.render('users', {
            users,
            parentCount,
            subuserCount
        });
    } catch (error) {
        console.error('[AdminController] ❌ User List Error:', error);
        res.status(500).send('Lỗi server khi hiển thị danh sách người dùng.');
    }
};

// 📌 Hàm mới để chuyển đổi trạng thái đình chỉ của người dùng
exports.toggleUserSuspension = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Không cho phép đình chỉ/mở đình chỉ tài khoản admin thông qua chức năng này
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái của tài khoản admin thông qua đây.' });
        }

        user.isSuspended = !user.isSuspended; // Chuyển đổi trạng thái
        await user.save();

        const actionDescription = user.isSuspended ? 'Đình chỉ' : 'Mở đình chỉ';
        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `${actionDescription} người dùng: ${user.fullname || user.email} (ID: ${user._id})`
            );
        } else {
            console.warn('⚠️ Could not log admin action: Admin user data missing from JWT.');
        }

        res.status(200).json({
            success: true,
            message: `${actionDescription} người dùng thành công!`,
            isSuspended: user.isSuspended // Trả về trạng thái mới để JS cập nhật giao diện
        });
    } catch (error) {
        console.error('[AdminController] ❌ Toggle Suspend Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thay đổi trạng thái người dùng.' });
    }
};


// ✅ Logout Admin
exports.handleLogout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
};