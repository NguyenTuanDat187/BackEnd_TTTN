// 👉 childRouter.js
const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { requireAuth } = require('../middlewares/auth'); // 👈 Import đúng hàm

// ✅ Định nghĩa các route dùng middleware requireAuth
router.post('/', requireAuth, childController.createChild);
router.get('/my', requireAuth, childController.getChildrenByUser);
router.get('/:childId', requireAuth, childController.getChildById);
router.put('/:childId', requireAuth, childController.updateChild);
router.delete('/:childId', requireAuth, childController.deleteChild);

module.exports = router;
