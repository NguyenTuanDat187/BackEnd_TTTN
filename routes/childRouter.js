const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');

router.post('/', childController.createChild);
router.get('/:userId', childController.getChildrenByUser);
router.put('/:childId', childController.updateChild);
router.delete('/:childId', childController.deleteChild);

module.exports = router;
