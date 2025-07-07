const Reminder = require('../models/Reminder');
const Child = require('../models/Child');

// ✅ Tạo Reminder mới
exports.createReminder = async (req, res) => {
  try {
    const {
      user_id,
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

    const childExists = await Child.findOne({ _id: child_id, user_id });
    if (!childExists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ tương ứng với tài khoản' });
    }

    if (type === 'other' && (!custom_type || custom_type.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập loại nhắc nhở khác (custom_type)' });
    }

    const reminder = new Reminder({
      user_id,
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

// ✅ Lấy tất cả reminders theo user_id
exports.getRemindersByUser = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Thiếu user_id' });
    }

    const reminders = await Reminder.find({ user_id }).populate('child_id');
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách', error: error.message });
  }
};

// ✅ Lấy Reminder theo ID
exports.getReminderById = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate('child_id');
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reminder' });
    }
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder', error: error.message });
  }
};

// ✅ Lấy Reminder theo Child ID
exports.getRemindersByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const reminders = await Reminder.find({ child_id: childId }).populate('child_id');
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder theo trẻ', error: error.message });
  }
};

// ✅ Cập nhật Reminder
exports.updateReminder = async (req, res) => {
  try {
    const updated = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để cập nhật' });
    }
    const populated = await updated.populate('child_id');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi khi cập nhật reminder', error: error.message });
  }
};

// ✅ Xoá Reminder
exports.deleteReminder = async (req, res) => {
  try {
    const deleted = await Reminder.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để xoá' });
    }
    res.json({ success: true, message: 'Đã xoá reminder thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xoá reminder', error: error.message });
  }
};

// ✅ Cập nhật trạng thái hoàn thành
exports.completeReminder = async (req, res) => {
  try {
    const updated = await Reminder.findByIdAndUpdate(
      req.params.id,
      { is_completed: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để cập nhật hoàn thành' });
    }

    const populated = await updated.populate('child_id');
    res.json({ success: true, message: 'Đã hoàn thành nhắc nhở', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi hoàn thành reminder', error: error.message });
  }
};