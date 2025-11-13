import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, friendAPI, messageAPI } from '../utils/api';
import { initializeSocket, getSocket, disconnectSocket } from '../utils/socket';
import { fileAPI } from '../utils/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  // Initialize darkMode from localStorage immediately
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem('vishubh_darkmode');
    return saved ? JSON.parse(saved) : false;
  });

  // Provide a wrapper that always syncs DOM class and localStorage immediately
  const setDarkMode = (value) => {
    if (typeof value === 'function') {
      setDarkModeState((prev) => {
        const next = value(prev);
        try {
          localStorage.setItem('vishubh_darkmode', JSON.stringify(next));
          if (next) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        } catch {
          // ignore
        }
        return next;
      });
    } else {
      setDarkModeState(value);
      try {
        localStorage.setItem('vishubh_darkmode', JSON.stringify(value));
        if (value) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch {
        // ignore
      }
    }
  };
  
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Note: dark mode is synced immediately when set via `setDarkMode` wrapper above.

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('vishubh_token');

      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          const userData = response.data;
          setCurrentUser(userData);
          setIsAuthenticated(true);

          // Initialize socket
          const socket = initializeSocket(token);
          setupSocketListeners(userData.id);

          // Fetch friends and requests
          await fetchFriends();
          await fetchFriendRequests();

          // Restore selected user if exists
          const savedSelectedUserId = localStorage.getItem('vishubh_selected_user');
          if (savedSelectedUserId) {
            const userId = parseInt(savedSelectedUserId);
            // We'll set the selected user after friends are loaded
            // This will be handled in a separate useEffect
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('vishubh_token');
          localStorage.removeItem('vishubh_selected_user');
        }
      }
      setLoading(false);
    };

    checkAuth();

    return () => {
      disconnectSocket();
    };
  }, []);

  // Load messages when selected user changes or friends are loaded
  useEffect(() => {
    const loadSelectedUserMessages = async () => {
      const savedSelectedUserId = localStorage.getItem('vishubh_selected_user');
      
      if (savedSelectedUserId && friends.length > 0 && !selectedUser) {
        const userId = parseInt(savedSelectedUserId);
        const friend = friends.find(f => f.id === userId);
        
        if (friend) {
          setSelectedUser(friend);
          await loadMessages(userId);
        } else {
          // If saved user is not in friends anymore, clear it
          localStorage.removeItem('vishubh_selected_user');
        }
      }
    };

    if (isAuthenticated && currentUser && friends.length > 0) {
      loadSelectedUserMessages();
    }
  }, [friends, isAuthenticated, currentUser]);

  // Save selected user to localStorage when it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('vishubh_selected_user', selectedUser.id.toString());
    } else {
      localStorage.removeItem('vishubh_selected_user');
    }
  }, [selectedUser]);

  const setupSocketListeners = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('receive-message', (data) => {
      console.log('Received message via socket:', data);
      
      const chatId = `${Math.min(data.senderId, data.receiverId)}-${Math.max(data.senderId, data.receiverId)}`;
      
      const message = {
        ...data,
        id: data.id || Date.now(),
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        created_at: data.timestamp || data.created_at || new Date().toISOString(),
        message_type: data.type || data.message_type,
      };
      
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      }));
    });

    socket.on('friend-status', ({ userId: statusUserId, status }) => {
      setFriends(prev => prev.map(f => f.id === statusUserId ? { ...f, status } : f));
    });

    socket.on('friend-request-received', async () => {
      await fetchFriendRequests();
    });
  };

  const fetchFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await friendAPI.getFriendRequests();
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({
        username,
        email,
        password,
      });

      const { token, user } = response.data;

      // Save token
      localStorage.setItem('vishubh_token', token);

      setCurrentUser(user);
      setIsAuthenticated(true);

      // Initialize socket
      const socket = initializeSocket(token);
      setupSocketListeners(user.id);

      // Fetch friends and requests
      await fetchFriends();
      await fetchFriendRequests();

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      // Save token
      localStorage.setItem('vishubh_token', token);

      setCurrentUser(user);
      setIsAuthenticated(true);

      // Initialize socket
      const socket = initializeSocket(token);
      setupSocketListeners(user.id);

      // Fetch friends and requests
      await fetchFriends();
      await fetchFriendRequests();

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('vishubh_token');
    localStorage.removeItem('vishubh_selected_user');
    disconnectSocket();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSelectedUser(null);
    setMessages({});
    setFriends([]);
    setFriendRequests([]);
  };

  const sendMessage = async (content, type = 'text', file = null) => {
    if (!selectedUser || !currentUser) return;

    try {
      const chatId = `${Math.min(currentUser.id, selectedUser.id)}-${Math.max(currentUser.id, selectedUser.id)}`;

      const messageData = {
        receiverId: selectedUser.id,
        content,
        messageType: type,
        fileId: file?.id || null,
      };

      // Save to database
      const response = await messageAPI.send(messageData);

      const message = {
        ...response.data,
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        file,
      };

      // Add to local state
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      }));

      // Send via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('send-message', {
          id: message.id,
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: message.content,
          type: message.message_type,
          message_type: message.message_type,
          file: file,
          timestamp: message.created_at,
          created_at: message.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 403) {
        alert('You can only send messages to friends');
      }
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await messageAPI.getMessages(userId);
      const chatId = `${Math.min(currentUser.id, userId)}-${Math.max(currentUser.id, userId)}`;
      
      // Process messages and add file URLs
      const processedMessages = response.data.map(msg => {
        let processedMsg = {
          ...msg,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          created_at: msg.created_at,
          message_type: msg.message_type,
        };

        // If message has a file, construct the file object
        if (msg.file_id && (msg.original_name || msg.filename)) {
          processedMsg.file = {
            id: msg.file_id,
            name: msg.original_name,
            type: msg.file_type,
            size: msg.file_size,
            filename: msg.filename || msg.encrypted_path?.split('/').pop(),
            url: msg.filename ? fileAPI.getFileUrl(msg.filename) : null,
          };
        }

        return processedMsg;
      });
      
      setMessages(prev => ({
        ...prev,
        [chatId]: processedMessages
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (error.response?.status === 403) {
        alert('You can only view messages from friends');
      }
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await friendAPI.searchUsers(query);
      return response.data;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await friendAPI.sendRequest(userId);
      
      // Notify via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('friend-request-sent', {
          senderId: currentUser.id,
          receiverId: userId,
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send friend request' 
      };
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await friendAPI.acceptRequest(requestId);
      await fetchFriends();
      await fetchFriendRequests();
      return { success: true };
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return { success: false };
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await friendAPI.rejectRequest(requestId);
      await fetchFriendRequests();
      return { success: true };
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      return { success: false };
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await friendAPI.removeFriend(friendId);
      await fetchFriends();
      setSelectedUser(null);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return { success: false };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Vishubh...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      darkMode, setDarkMode, currentUser, friends, friendRequests, selectedUser, setSelectedUser,
      messages, sendMessage, register, login, logout, isAuthenticated,
      isSidebarOpen, setIsSidebarOpen, loadMessages, searchUsers, sendFriendRequest,
      acceptFriendRequest, rejectFriendRequest, removeFriend, fetchFriends, fetchFriendRequests
    }}>
      {children}
    </AppContext.Provider>
  );
};