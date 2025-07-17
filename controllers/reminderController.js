const Reminder = require('../models/Reminder');
const Child = require('../models/Child');

// Helper function to determine the effective user ID for queries
// This assumes req.user will have 'parentAccountId' if the user is a 'subuser'
const getEffectiveUserId = (reqUser) => {
    if (reqUser?.role === 'subuser' && reqUser?.parentAccountId) {
        return reqUser.parentAccountId; // Use parent's ID for subusers
    }
    return reqUser?.userId; // Use own ID for parent/admin
};

// ✅ Tạo Reminder mới
exports.createReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const user_role = req.user?.role; // Lấy role của người dùng từ token

        // Kiểm tra xem người dùng có quyền thêm nhắc nhở không (chỉ parent hoặc admin)
        if (user_role !== 'parent' && user_role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo nhắc nhở.' });
        }

        const {
            child_id,
            type,
            note,
            reminder_date,
            reminder_time,
            repeat,
            repeat_type,
            custom_type
        } = req.body;

        if (!user_id || !child_id || !type || !reminder_date || !reminder_time) {
            return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' });
        }

        // Khi tạo nhắc nhở, user_id luôn là ID của tài khoản chính (parent/admin)
        // Nếu một subuser được phép tạo nhắc nhở (hiện tại không), thì user_id của nhắc nhở vẫn phải là parent_account_id của subuser đó.
        // Tuy nhiên, theo yêu cầu, subuser không được tạo, sửa, xóa.
        const effectiveUserIdForCreation = getEffectiveUserId(req.user); // Should be parent's ID if subuser, or own ID if parent/admin

        const childExists = await Child.findOne({ _id: child_id, user_id: effectiveUserIdForCreation }); // Check child against effective user ID
        if (!childExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ tương ứng với tài khoản.' });
        }

        if (type === 'other' && (!custom_type || custom_type.trim() === '')) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập loại nhắc nhở khác (custom_type).' });
        }

        const reminder = new Reminder({
            user_id: effectiveUserIdForCreation, // Store the parent's ID (or admin's ID if admin creates)
            child_id,
            type,
            note,
            reminder_date,
            reminder_time,
            repeat,
            repeat_type,
            custom_type
        });

        await reminder.save();
        const populated = await reminder.populate('child_id');

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Lỗi khi tạo reminder', error: error.message });
    }
};

// ✅ Lấy tất cả reminders theo user_id (hoặc parent_account_id cho subuser)
exports.getRemindersByUser = async (req, res) => {
    try {
        const effectiveUserId = getEffectiveUserId(req.user);
        if (!effectiveUserId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng từ token.' });
        }

        const reminders = await Reminder.find({ user_id: effectiveUserId }).populate('child_id');
        res.json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách', error: error.message });
    }
};

// ✅ Lấy Reminder theo ID (có kiểm tra user_id hoặc parent_account_id)
exports.getReminderById = async (req, res) => {
    try {
        const effectiveUserId = getEffectiveUserId(req.user);
        if (!effectiveUserId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng từ token.' });
        }

        const reminder = await Reminder.findOne({ _id: req.params.id, user_id: effectiveUserId }).populate('child_id');
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền truy cập.' });
        }
        res.json({ success: true, data: reminder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder', error: error.message });
    }
};

// ✅ Lấy Reminder theo Child ID (có kiểm tra user_id hoặc parent_account_id)
exports.getRemindersByChild = async (req, res) => {
    try {
        const effectiveUserId = getEffectiveUserId(req.user);
        const { childId } = req.params;

        if (!effectiveUserId) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng từ token.' });
        }

        // Kiểm tra quyền truy cập child
        const child = await Child.findOne({ _id: childId, user_id: effectiveUserId });
        if (!child) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ hoặc không có quyền truy cập.' });
        }

        const reminders = await Reminder.find({ child_id: childId, user_id: effectiveUserId }).populate('child_id');
        res.json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder theo trẻ', error: error.message });
    }
};

// ✅ Cập nhật Reminder (chỉ parent hoặc admin)
exports.updateReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId; // ID của người dùng hiện tại (parent/subuser/admin)
        const user_role = req.user?.role; // Role của người dùng hiện tại

        // Kiểm tra quyền sửa (chỉ parent hoặc admin)
        if (user_role !== 'parent' && user_role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật nhắc nhở.' });
        }

        // Lấy effectiveUserId để đảm bảo tìm đúng reminder của parent
        const effectiveUserId = getEffectiveUserId(req.user);

        const reminder = await Reminder.findOne({ _id: req.params.id, user_id: effectiveUserId });
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền cập nhật.' });
        }

        Object.assign(reminder, req.body);
        const updated = await reminder.save();
        const populated = await updated.populate('child_id');
        res.json({ success: true, data: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Lỗi khi cập nhật reminder', error: error.message });
    }
};

// ✅ Xoá Reminder (chỉ parent hoặc admin)
exports.deleteReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId; // ID của người dùng hiện tại
        const user_role = req.user?.role; // Role của người dùng hiện tại

        // Kiểm tra quyền xóa (chỉ parent hoặc admin)
        if (user_role !== 'parent' && user_role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa nhắc nhở.' });
        }

        // Lấy effectiveUserId để đảm bảo tìm đúng reminder của parent
        const effectiveUserId = getEffectiveUserId(req.user);

        const deleted = await Reminder.findOneAndDelete({ _id: req.params.id, user_id: effectiveUserId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền xoá.' });
        }
        res.json({ success: true, message: 'Đã xoá reminder thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xoá reminder', error: error.message });
    }
};

// ✅ Cập nhật trạng thái hoàn thành (chỉ parent hoặc admin)
exports.completeReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId; // ID của người dùng hiện tại
        const user_role = req.user?.role; // Role của người dùng hiện tại

        // Kiểm tra quyền hoàn thành (chỉ parent hoặc admin)
        if (user_role !== 'parent' && user_role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền hoàn thành nhắc nhở.' });
        }

        // Lấy effectiveUserId để đảm bảo tìm đúng reminder của parent
        const effectiveUserId = getEffectiveUserId(req.user);

        const reminder = await Reminder.findOne({ _id: req.params.id, user_id: effectiveUserId });
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền cập nhật.' });
        }

        reminder.is_completed = true;
        const updated = await reminder.save();
        const populated = await updated.populate('child_id');
        res.json({ success: true, message: 'Đã hoàn thành nhắc nhở', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi hoàn thành reminder', error: error.message });
    }
};