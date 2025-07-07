// controllers/diaryEntryController.js
const DiaryEntry = require('../models/DiaryEntry');
const mongoose = require('mongoose');

// @desc    Lấy tất cả các mục nhật ký hoặc theo child_id/user_id
// @route   GET /api/diaryentries
// @access  Public (có thể điều chỉnh thành Private nếu cần xác thực)
exports.getDiaryEntries = async (req, res) => {
    try {
        const { child_id, user_id } = req.query; // Lấy child_id hoặc user_id từ query params

        let query = {};
        if (child_id) {
            // Kiểm tra xem child_id có phải là ObjectId hợp lệ không
            if (!mongoose.Types.ObjectId.isValid(child_id)) {
                return res.status(400).json({ success: false, message: 'ID trẻ không hợp lệ.' });
            }
            query.child_id = child_id;
        }
        if (user_id) {
            // Kiểm tra xem user_id có phải là ObjectId hợp lệ không
            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
            }
            query.user_id = user_id;
        }

        const diaryEntries = await DiaryEntry.find(query)
                                             .populate('child_id', 'name image') // Lấy name và image từ Child
                                             .populate('user_id', 'username email'); // Lấy username và email từ User

        res.status(200).json({ success: true, count: diaryEntries.length, data: diaryEntries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// @desc    Lấy một mục nhật ký bằng ID
// @route   GET /api/diaryentries/:id
// @access  Public
exports.getDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id)
                                          .populate('child_id', 'name image')
                                          .populate('user_id', 'username email');

        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        res.status(200).json({ success: true, data: diaryEntry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// @desc    Tạo một mục nhật ký mới (Thủ công, không phải từ nhắc nhở)
// @route   POST /api/diaryentries
// @access  Public (có thể điều chỉnh thành Private)
exports.createDiaryEntry = async (req, res) => {
    try {
        const { child_id, type, user_id, activity } = req.body;

        // Kiểm tra tính hợp lệ của ObjectId từ body
        if (!mongoose.Types.ObjectId.isValid(child_id)) {
            return res.status(400).json({ success: false, message: 'ID trẻ không hợp lệ.' });
        }
        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const newDiaryEntry = await DiaryEntry.create({ child_id, type, user_id, activity });
        res.status(201).json({ success: true, data: newDiaryEntry });
    } catch (error) {
        console.error(error);
        // Xử lý lỗi validation của Mongoose (ví dụ: required fields missing)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// @desc    Cập nhật một mục nhật ký
// @route   PUT /api/diaryentries/:id
// @access  Public (có thể điều chỉnh thành Private)
exports.updateDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id);

        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        // --- KIỂM TRA ĐỂ NGĂN CẶN CẬP NHẬT NẾU LÀ TỪ NHẮC NHỞ ---
        if (diaryEntry.isFromReminder) {
            return res.status(403).json({ success: false, message: 'Không thể cập nhật nhật ký được tạo từ nhắc nhở đã hoàn thành.' });
        }
        // --------------------------------------------------------

        // Các trường được phép cập nhật khi không phải là nhật ký từ reminder
        const { type, activity } = req.body;

        const updatedDiaryEntry = await DiaryEntry.findByIdAndUpdate(
            req.params.id,
            { type, activity }, // updated_at tự động bởi timestamps
            { new: true, runValidators: true } // new: trả về tài liệu đã cập nhật, runValidators: chạy lại các validator
        ).populate('child_id', 'name image').populate('user_id', 'username email');

        res.status(200).json({ success: true, data: updatedDiaryEntry });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// @desc    Xóa một mục nhật ký
// @route   DELETE /api/diaryentries/:id
// @access  Public (có thể điều chỉnh thành Private)
exports.deleteDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id);

        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        // --- KIỂM TRA ĐỂ NGĂN CẶN XÓA NẾU LÀ TỪ NHẮC NHỞ ---
        if (diaryEntry.isFromReminder) {
            return res.status(403).json({ success: false, message: 'Không thể xóa nhật ký được tạo từ nhắc nhở đã hoàn thành.' });
        }
        // -------------------------------------------------

        await DiaryEntry.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Đã xóa mục nhật ký thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};