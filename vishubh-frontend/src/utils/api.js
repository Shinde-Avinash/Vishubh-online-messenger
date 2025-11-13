import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vishubh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Friend APIs
export const friendAPI = {
  searchUsers: (query) => api.get('/friends/search', { params: { query } }),
  sendRequest: (receiverId) => api.post('/friends/request', { receiverId }),
  getFriendRequests: () => api.get('/friends/requests'),
  acceptRequest: (requestId) => api.post(`/friends/requests/${requestId}/accept`),
  rejectRequest: (requestId) => api.post(`/friends/requests/${requestId}/reject`),
  getFriends: () => api.get('/friends/list'),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
};

// Message APIs
export const messageAPI = {
  send: (data) => api.post('/messages', data),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  getConversations: () => api.get('/messages/conversations/all'),
};

// File APIs
export const fileAPI = {
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (fileId) => `${API_URL.replace('/api', '')}/api/files/download/${fileId}`,
  getFileUrl: (filename) => `http://localhost:5000/uploads/${filename}`,
};

export default api;