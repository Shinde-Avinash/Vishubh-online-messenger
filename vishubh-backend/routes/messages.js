const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/', auth, messageController.sendMessage);
router.get('/:userId', auth, messageController.getMessages);
router.get('/conversations/all', auth, messageController.getConversations);

module.exports = router;