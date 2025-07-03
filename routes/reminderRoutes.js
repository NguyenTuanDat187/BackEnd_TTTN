const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminderController');

router.post('/', controller.createReminder);
router.get('/', controller.getRemindersByUser); // GET /api/reminders?user_id=xyz
router.get('/:id', controller.getReminderById);
router.get('/by-child/:childId', controller.getRemindersByChild);
router.put('/:id', controller.updateReminder);
router.delete('/:id', controller.deleteReminder);
router.put('/:id/complete', controller.completeReminder);

module.exports = router;
