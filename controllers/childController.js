const Child = require('../models/Child');

// ✅ Tạo hồ sơ trẻ mới
exports.createChild = async (req, res) => {
  try {
    const { name, dob, gender, avatar_url } = req.body;
    const user_id = req.user?._id; // Lấy từ middleware auth

    if (!user_id || !name || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const newChild = new Child({
      user_id,
      name,
      dob,
      gender,
      avatar_url: avatar_url || null // không bắt buộc
    });

    const savedChild = await newChild.save();
    res.status(201).json({ success: true, data: savedChild });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// ✅ Lấy danh sách con của 1 người dùng
exports.getChildrenByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const children = await Child.find({ user_id: userId }).sort({ created_at: -1 });
    res.json({ success: true, data: children });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// ✅ Cập nhật thông tin trẻ
exports.updateChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const { name, dob, gender, avatar_url } = req.body;

    const updatedChild = await Child.findByIdAndUpdate(
      childId,
      { name, dob, gender, avatar_url },
      { new: true }
    );

    if (!updatedChild) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ' });
    }

    res.json({ success: true, data: updatedChild });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// ✅ Xóa hồ sơ trẻ
exports.deleteChild = async (req, res) => {
  try {
    const { childId } = req.params;

    const deleted = await Child.findByIdAndDelete(childId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ để xóa' });
    }

    res.json({ success: true, message: 'Đã xóa trẻ thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};
