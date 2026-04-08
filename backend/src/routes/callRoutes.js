const express = require('express');
const { getAllCallRecords, getUserCallRecords, saveCallRecord } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware'); // à créer

const router = express.Router();
router.get('/admin/records', protect, adminOnly, getAllCallRecords);
router.get('/user/:userId', protect, getUserCallRecords);
router.post('/save', protect, saveCallRecord);

module.exports = router;