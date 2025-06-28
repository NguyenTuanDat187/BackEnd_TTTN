const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.post('/', reminderController.createReminder);
router.get('/', reminderController.getAllReminders);
router.get('/:id', reminderController.getReminderById);
router.get('/by-child/:childId', reminderController.getReminderByChild);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

// ✅ API cập nhật trạng thái hoàn thành
router.put('/:id/complete', reminderController.completeReminder);

module.exports = router;
