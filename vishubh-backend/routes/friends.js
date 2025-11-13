const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

router.get('/search', auth, friendController.searchUsers);
router.post('/request', auth, friendController.sendFriendRequest);
router.get('/requests', auth, friendController.getFriendRequests);
router.post('/requests/:requestId/accept', auth, friendController.acceptFriendRequest);
router.post('/requests/:requestId/reject', auth, friendController.rejectFriendRequest);
router.get('/list', auth, friendController.getFriends);
router.delete('/:friendId', auth, friendController.removeFriend);

module.exports = router;