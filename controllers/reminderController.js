    const Reminder = require('../models/Reminder');
    const Child = require('../models/Child');

    // ✅ Tạo Reminder mới
    exports.createReminder = async (req, res) => {
      try {
        const {
          child_id,
          type,
          note,
          reminder_date,
          reminder_time,
          repeat,
          repeat_type
        } = req.body;

        // Kiểm tra thiếu thông tin cơ bản
        if (!child_id || !type || !reminder_date || !reminder_time) {
          return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' });
        }

        // Kiểm tra child có tồn tại không
        const childExists = await Child.findById(child_id);
        if (!childExists) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ tương ứng' });
        }

        // Nếu là "other" thì yêu cầu có note
        if (type === 'other' && (!note || note.trim() === '')) {
          return res.status(400).json({ success: false, message: 'Vui lòng nhập loại nhắc nhở khác (ghi chú)' });
        }

        const reminder = new Reminder({
          child_id,
          type,
          note,
          reminder_date,
          reminder_time,
          repeat,
          repeat_type
        });

        await reminder.save();
        const populated = await reminder.populate('child_id');

        res.status(201).json({ success: true, data: populated });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    };

    // ✅ Lấy tất cả reminders
    exports.getAllReminders = async (req, res) => {
      try {
        const reminders = await Reminder.find().populate('child_id');
        res.json({ success: true, data: reminders });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
      }
    };

    // ✅ Lấy Reminder theo Child ID
    exports.getReminderByChild = async (req, res) => {
      try {
        const reminders = await Reminder.find({ child_id: req.params.childId }).populate('child_id');
        res.json({ success: true, data: reminders });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    };

    // ✅ Cập nhật Reminder
    exports.updateReminder = async (req, res) => {
      try {
        const reminder = await Reminder.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
        );
        if (!reminder) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để cập nhật' });
        }
        const populated = await reminder.populate('child_id');
        res.json({ success: true, data: populated });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    };

    // ✅ Xoá Reminder
    exports.deleteReminder = async (req, res) => {
      try {
        const reminder = await Reminder.findByIdAndDelete(req.params.id);
        if (!reminder) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để xoá' });
        }
        res.json({ success: true, message: 'Đã xoá reminder thành công' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    };
    // ✅ Cập nhật trạng thái hoàn thành Reminder
exports.completeReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { is_completed: true },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy reminder để cập nhật hoàn thành' });
    }

    const populated = await reminder.populate('child_id');
    res.json({ success: true, message: 'Đã hoàn thành nhắc nhở', data: populated });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
