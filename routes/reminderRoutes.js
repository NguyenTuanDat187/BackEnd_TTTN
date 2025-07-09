const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminderController');
const { requireAuth } = require('../middlewares/auth'); // 👈 import middleware xác thực

// ✅ Tạo mới nhắc nhở (yêu cầu xác thực)
router.post('/', requireAuth, controller.createReminder);

// ✅ Lấy toàn bộ nhắc nhở của người dùng (từ token, không cần user_id query)
router.get('/', requireAuth, controller.getRemindersByUser);

// ✅ Lấy nhắc nhở theo ID (chỉ nếu thuộc user)
router.get('/:id', requireAuth, controller.getReminderById);

// ✅ Lấy theo child ID (chỉ nếu child thuộc user)
router.get('/by-child/:childId', requireAuth, controller.getRemindersByChild);

// ✅ Cập nhật reminder (chỉ nếu của user)
router.put('/:id', requireAuth, controller.updateReminder);

// ✅ Xóa reminder (chỉ nếu của user)
router.delete('/:id', requireAuth, controller.deleteReminder);

// ✅ Đánh dấu hoàn thành (chỉ nếu của user)
router.put('/:id/complete', requireAuth, controller.completeReminder);

module.exports = router;
