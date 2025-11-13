const db = require('../config/db');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType, fileId } = req.body;
    const senderId = req.userId;

    // Check if users are friends
    const [friendships] = await db.query(
      'SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [senderId, receiverId, receiverId, senderId]
    );

    if (friendships.length === 0) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content, message_type, file_id) VALUES (?, ?, ?, ?, ?)',
      [senderId, receiverId, content, messageType || 'text', fileId || null]
    );

    // Update or create conversation
    await db.query(
      'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_message_at = NOW()',
      [Math.min(senderId, receiverId), Math.max(senderId, receiverId)]
    );

    const [messages] = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);

    res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Check if users are friends
    const [friendships] = await db.query(
      'SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [currentUserId, userId, userId, currentUserId]
    );

    if (friendships.length === 0) {
      return res.status(403).json({ error: 'You can only view messages from friends' });
    }

    const [messages] = await db.query(
      `SELECT m.*, 
        f.id as file_id,
        f.filename, 
        f.original_name, 
        f.file_type, 
        f.file_size, 
        f.encrypted_path
       FROM messages m 
       LEFT JOIN files f ON m.file_id = f.id 
       WHERE (m.sender_id = ? AND m.receiver_id = ?) 
          OR (m.sender_id = ? AND m.receiver_id = ?) 
       ORDER BY m.created_at ASC`,
      [currentUserId, userId, userId, currentUserId]
    );

    // Mark messages as read
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [userId, currentUserId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const [conversations] = await db.query(
      `SELECT 
        u.id, u.username, u.email, u.avatar, u.status, u.last_seen,
        c.last_message_at,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM conversations c
       JOIN users u ON (c.user1_id = u.id OR c.user2_id = u.id) AND u.id != ?
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};