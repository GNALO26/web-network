const express = require('express');
const { sendInvitation, acceptInvitation, declineInvitation, getPendingInvitations, getFriends } = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/', protect, sendInvitation);
router.get('/pending', protect, getPendingInvitations);
router.get('/friends', protect, getFriends);
router.put('/:invitationId/accept', protect, acceptInvitation);
router.put('/:invitationId/decline', protect, declineInvitation);

module.exports = router;