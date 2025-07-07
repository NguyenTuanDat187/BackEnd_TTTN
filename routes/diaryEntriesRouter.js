// routes/diaryEntries.js
const express = require('express');
const {
    getDiaryEntries,
    getDiaryEntry,
    createDiaryEntry,
    updateDiaryEntry,
    deleteDiaryEntry
} = require('../controllers/diaryEntryController');

const router = express.Router();

router.route('/')
    .get(getDiaryEntries)
    .post(createDiaryEntry);

router.route('/:id')
    .get(getDiaryEntry)
    .put(updateDiaryEntry)
    .delete(deleteDiaryEntry);

module.exports = router;