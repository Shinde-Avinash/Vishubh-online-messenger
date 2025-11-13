const db = require('../config/db');

// Search users (not friends)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.userId;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.avatar, u.status,
        (SELECT COUNT(*) FROM friendships 
         WHERE (user1_id = ? AND user2_id = u.id) 
         OR (user2_id = ? AND user1_id = u.id)) as is_friend,
        (SELECT status FROM friend_requests 
         WHERE sender_id = ? AND receiver_id = u.id 
         ORDER BY created_at DESC LIMIT 1) as sent_request_status,
        (SELECT status FROM friend_requests 
         WHERE sender_id = u.id AND receiver_id = ? 
         ORDER BY created_at DESC LIMIT 1) as received_request_status
       FROM users u
       WHERE u.id != ? 
       AND (u.username LIKE ? OR u.email LIKE ?)
       LIMIT 20`,
      [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, `%${query}%`, `%${query}%`]
    );

    // Filter out rejected requests or show as available to send again
    const processedUsers = users.map(user => {
      if (user.sent_request_status === 'rejected') {
        user.sent_request_status = null; // Allow sending again
      }
      if (user.received_request_status === 'rejected') {
        user.received_request_status = null;
      }
      return user;
    });

    res.json(processedUsers);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.userId;

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const [friendships] = await db.query(
      'SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [senderId, receiverId, receiverId, senderId]
    );

    if (friendships.length > 0) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists (including rejected ones)
    const [existingRequests] = await db.query(
      'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [senderId, receiverId, receiverId, senderId]
    );

    if (existingRequests.length > 0) {
      const existingRequest = existingRequests[0];
      
      // If the existing request was rejected, allow resending by updating it
      if (existingRequest.status === 'rejected') {
        await db.query(
          'UPDATE friend_requests SET status = ?, created_at = NOW() WHERE id = ?',
          ['pending', existingRequest.id]
        );
        return res.status(201).json({ message: 'Friend request sent successfully' });
      }
      
      // If request is pending
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
    }

    // Create new request
    const [result] = await db.query(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
      [senderId, receiverId]
    );

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const [requests] = await db.query(
      `SELECT fr.id, fr.sender_id, fr.status, fr.created_at,
        u.username, u.email, u.avatar, u.status as user_status
       FROM friend_requests fr
       JOIN users u ON fr.sender_id = u.id
       WHERE fr.receiver_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    // Get request details
    const [requests] = await db.query(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?',
      [requestId, userId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const request = requests[0];

    // Update request status
    await db.query(
      'UPDATE friend_requests SET status = ? WHERE id = ?',
      ['accepted', requestId]
    );

    // Create friendship
    const user1 = Math.min(request.sender_id, request.receiver_id);
    const user2 = Math.max(request.sender_id, request.receiver_id);

    await db.query(
      'INSERT INTO friendships (user1_id, user2_id) VALUES (?, ?)',
      [user1, user2]
    );

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    await db.query(
      'UPDATE friend_requests SET status = ? WHERE id = ? AND receiver_id = ?',
      ['rejected', requestId, userId]
    );

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get friends list
exports.getFriends = async (req, res) => {
  try {
    const userId = req.userId;

    const [friends] = await db.query(
      `SELECT u.id, u.username, u.email, u.avatar, u.status, u.last_seen,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM friendships f
       JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id) AND u.id != ?
       WHERE f.user1_id = ? OR f.user2_id = ?
       ORDER BY u.status DESC, u.last_seen DESC`,
      [userId, userId, userId, userId]
    );

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove friend
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.userId;

    await db.query(
      'DELETE FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [userId, friendId, friendId, userId]
    );

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};