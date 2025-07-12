const User = require('../models/User');
const OTP = require('../models/OTP'); // Giả định OTP model vẫn được sử dụng nếu có chức năng liên quan đến OTP
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/token'); // Đảm bảo đường dẫn này đúng
const crypto = require('crypto'); // Import module crypto để tạo chuỗi ngẫu nhiên

// Hàm tiện ích để chuẩn hóa số điện thoại
// Ví dụ: chuyển '0389456321' thành '389456321' hoặc ngược lại, tùy theo chuẩn bạn muốn lưu
const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    // Loại bỏ tất cả ký tự không phải số
    let cleanedPhone = phone.replace(/\D/g, '');

    // Nếu số điện thoại bắt đầu bằng '0' và có 10 chữ số (chuẩn VN)
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
        return cleanedPhone; // Giữ nguyên '0'
    }
    // Nếu số điện thoại có 9 chữ số (ví dụ: '389456321') và bạn muốn lưu có '0'
    else if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('0')) {
        return '0' + cleanedPhone; // Thêm '0' vào đầu
    }
    // Hoặc nếu bạn muốn luôn loại bỏ '0' đầu nếu có (ví dụ: chuyển 038... thành 38...)
    // else if (cleanedPhone.startsWith('0') && cleanedPhone.length > 1) {
    //     return cleanedPhone.substring(1);
    // }
    return cleanedPhone; // Trả về như cũ nếu không khớp quy tắc
};


// --- Quản lý người dùng chung (Parent và Subuser) --- //

/**
 * @desc Lấy danh sách tất cả người dùng trong hệ thống (bao gồm cả parent và subuser).
 * @route GET /api/users/users
 * @access Public (có thể cần auth cho production)
 */
exports.getAllUsers = async (req, res) => {
    try {
        // Lấy tất cả người dùng và ẩn trường password
        const users = await User.find().select('-password');

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

// --- Đăng ký và Đăng nhập tài khoản chính (Parent) --- //

/**
 * @desc Đăng ký tài khoản Parent mới.
 * @route POST /api/users/register
 * @access Public
 */
exports.registerParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới với role 'parent' và tự động xác minh
        const newUser = await User.create({
            email,
            password: hashedPassword,
            isVerified: true, // Tự động xác minh cho tài khoản parent
            role: 'parent'
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản chính thành công.',
            user: {
                _id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname || '',
                numberphone: newUser.numberphone || '',
                image: newUser.image || ''
            }
        });

    } catch (err) {
        console.error('Lỗi đăng ký tài khoản chính:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký tài khoản chính.' });
    }
};

/**
 * @desc Đăng nhập tài khoản Parent.
 * @route POST /api/users/login
 * @access Public
 */
exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        // Tìm người dùng với email và role 'parent'
        const user = await User.findOne({ email, role: 'parent' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        // Tạo JWT token
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập tài khoản chính thành công!',
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
        console.error('Lỗi đăng nhập tài khoản chính:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập tài khoản chính.' });
    }
};

// --- Quản lý thông tin tài khoản (Parent hoặc Subuser) --- //

/**
 * @desc Cập nhật thông tin người dùng (fullname, numberphone, image).
 * @route POST /api/users/update
 * @access Private (cần xác thực)
 */
exports.updateUser = async (req, res) => {
    try {
        const { _id, fullname, numberphone, image } = req.body;

        // Kiểm tra ID hợp lệ
        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        // Tìm người dùng theo ID
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Cập nhật các trường nếu có
        if (fullname !== undefined) user.fullname = fullname;
        // Chuẩn hóa số điện thoại trước khi lưu
        if (numberphone !== undefined) user.numberphone = normalizePhoneNumber(numberphone);
        if (image !== undefined) user.image = image;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công.',
            user
        });
    } catch (err) {
        console.error('Lỗi cập nhật thông tin người dùng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng.' });
    }
};

/**
 * @desc Upload ảnh đại diện cho người dùng.
 * @route POST /api/users/upload-avatar
 * @access Private (cần xác thực)
 * @note Yêu cầu middleware `upload.single('avatar')` trước khi gọi controller này.
 */
exports.uploadAvatar = async (req, res) => {
    try {
        // Lấy userId từ body hoặc từ token xác thực (tùy thuộc vào cách bạn thiết kế middleware xác thực)
        // Ví dụ: const userId = req.user.id; nếu bạn có middleware xác thực JWT
        const { userId } = req.body; // Tạm thời lấy từ body, nên lấy từ req.user.id trong môi trường thực tế

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra xem có file ảnh được upload không
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
        }

        // Lưu đường dẫn file (đường dẫn này phụ thuộc vào cấu hình Multer của bạn)
        const imagePath = `/uploads/${req.file.filename}`;
        user.image = imagePath;
        await user.save();

        // Tạo JWT token mới sau khi cập nhật avatar (để đảm bảo token có thông tin image mới nhất nếu cần)
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Tải ảnh đại diện thành công.',
            image: imagePath,
            token, // Trả về token đã cập nhật
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
        console.error('Lỗi tải ảnh đại diện:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải ảnh đại diện.' });
    }
};

// --- Quản lý tài khoản phụ (Subuser) --- //

/**
 * @desc Lấy tất cả danh sách Subuser của một Parent cụ thể.
 * @route GET /api/users/subusers/parent/:parentId
 * @access Private (chỉ parent hoặc admin mới có thể xem subuser của họ)
 */
exports.getAllSubusersByParentId = async (req, res) => {
    try {
        const { parentId } = req.params; // Lấy parentId từ URL params

        if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

        // Tìm tất cả subuser có created_by là parentId
        const subusers = await User.find({ created_by: parentId, role: 'subuser' }).select('-password');

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách subuser thành công.',
            subusers
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách subuser.' });
    }
};

/**
 * @desc Lấy thông tin một Subuser cụ thể bằng ID của subuser đó.
 * @route GET /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser đó hoặc admin mới có thể xem)
 */
exports.getSubuserById = async (req, res) => {
    try {
        const { subuserId } = req.params; // Lấy subuserId từ URL params

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'Subuser ID không hợp lệ.' });
        }

        // Tìm subuser theo ID và đảm bảo đó là subuser
        const subuser = await User.findOne({ _id: subuserId, role: 'subuser' }).select('-password');

        if (!subuser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy subuser.' });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin subuser thành công.',
            subuser
        });
    } catch (err) {
        console.error('Lỗi khi lấy thông tin subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin subuser.' });
    }
};

/**
 * @desc Tạo mới hoặc cập nhật thông tin Subuser.
 * Nếu subuser với `numberphone` và `parentId` đã tồn tại, sẽ cập nhật.
 * Nếu chưa, sẽ tạo mới.
 * @route POST /api/users/subuser/create-or-update
 * @access Private (chỉ parent mới có thể tạo/cập nhật subuser của họ)
 */
exports.createOrUpdateSubuser = async (req, res) => {
    try {
        let { numberphone, password, fullname, image, parentId } = req.body;
        const relationship = req.body.relationship || 'unknown';

        // Chuẩn hóa số điện thoại trước khi sử dụng
        numberphone = normalizePhoneNumber(numberphone);

        if (!numberphone || !password || !parentId) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin: số điện thoại, mật khẩu, và Parent ID.' });
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

        // Đảm bảo parentId tồn tại và có role 'parent'
        const parent = await User.findOne({ _id: parentId, role: 'parent' });
        if (!parent) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản Parent với Parent ID này.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Tìm subuser hiện có bằng numberphone và parentId
        let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });

        if (subuser) {
            // Nếu subuser đã tồn tại, cập nhật thông tin
            subuser.password = hashedPassword; // Cập nhật mật khẩu
            subuser.fullname = fullname ?? subuser.fullname; // Cập nhật fullname nếu có
            subuser.image = image ?? subuser.image; // Cập nhật image nếu có
            subuser.relationship = relationship; // Cập nhật relationship
            // KHÔNG CẬP NHẬT EMAIL KHI LÀ SUBUSER ĐỂ TRÁNH LỖI DUPLICATE KEY
            await subuser.save();

            return res.status(200).json({ success: true, message: 'Cập nhật subuser thành công.', user: subuser });
        }

        // Nếu subuser chưa tồn tại, kiểm tra giới hạn số lượng subuser
        const subuserCount = await User.countDocuments({ role: 'subuser', created_by: parentId });
        if (subuserCount >= 10) { // Giới hạn 10 subuser cho mỗi parent
            return res.status(400).json({ success: false, message: 'Tài khoản Parent đã đạt giới hạn 10 subuser.' });
        }

        // Tạo email placeholder duy nhất cho subuser mới
        // Sử dụng timestamp và một phần của UUID để đảm bảo tính duy nhất
        const uniqueEmail = `subuser_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@fmcarer.com`;

        // Tạo subuser mới
        subuser = new User({
            numberphone, // Sử dụng số điện thoại đã được chuẩn hóa
            password: hashedPassword,
            fullname: fullname || '',
            image: image || '',
            role: 'subuser',
            created_by: parentId, // Liên kết với parent
            relationship,
            email: uniqueEmail // Gán email placeholder duy nhất
        });

        await subuser.save();

        return res.status(201).json({ success: true, message: 'Tạo subuser thành công.', user: subuser });
    } catch (error) {
        console.error('Lỗi khi tạo hoặc cập nhật subuser:', error);
        // Kiểm tra nếu lỗi là do duplicate key trên email
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp email. Vui lòng thử lại hoặc liên hệ hỗ trợ.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý subuser.', error: error.message });
    }
};

/**
 * @desc Xóa một Subuser cụ thể.
 * @route DELETE /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser đó hoặc admin mới có thể xóa)
 */
exports.deleteSubuser = async (req, res) => {
    try {
        const { subuserId } = req.params; // Lấy ID của subuser cần xóa từ URL params

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'ID subuser không hợp lệ.' });
        }

        // Tìm và xóa subuser. Đảm bảo chỉ xóa subuser
        const result = await User.deleteOne({ _id: subuserId, role: 'subuser' });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy subuser để xóa hoặc không phải là subuser.' });
        }

        res.status(200).json({ success: true, message: 'Xóa subuser thành công.' });
    } catch (err) {
        console.error('Lỗi khi xóa subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa subuser.' });
    }
};

/**
 * @desc Đăng nhập tài khoản Subuser.
 * @route POST /api/users/login-subuser
 * @access Public
 */
exports.loginSubuser = async (req, res) => {
    try {
        let { numberphone, password } = req.body;

        // Chuẩn hóa số điện thoại trước khi sử dụng để tìm kiếm
        numberphone = normalizePhoneNumber(numberphone);

        if (!numberphone || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu số điện thoại hoặc mật khẩu.' });
        }

        // Tìm người dùng với numberphone và role 'subuser'
        const user = await User.findOne({ numberphone, role: 'subuser' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        // Tạo JWT token cho subuser
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập subuser thành công!',
            token, // Trả về token cho client
            user: {
                _id: user._id,
                numberphone: user.numberphone,
                fullname: user.fullname,
                role: user.role,
                image: user.image,
                created_by: user.created_by,
                relationship: user.relationship
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập subuser.' });
    }
};
