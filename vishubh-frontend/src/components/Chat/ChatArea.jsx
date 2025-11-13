import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Users, MoreVertical, Menu, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useApp } from '../../context/AppContext';
import MessageBubble from './MessageBubble';
import { fileAPI } from '../../utils/api';

const ChatArea = () => {
  const { selectedUser, messages, sendMessage, currentUser, setIsSidebarOpen } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const chatId = selectedUser && currentUser 
    ? `${Math.min(currentUser.id, selectedUser.id)}-${Math.max(currentUser.id, selectedUser.id)}`
    : null;
  
  const chatMessages = chatId ? messages[chatId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (inputMessage.trim()) {
      await sendMessage(inputMessage.trim());
      setInputMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fileAPI.upload(formData);
        
        const fileData = {
          id: response.data.fileId,
          name: response.data.originalName,
          size: response.data.fileSize,
          type: response.data.fileType,
          filename: response.data.filename,
          url: fileAPI.getFileUrl(response.data.filename),
        };

        // Determine message type based on file type
        let messageType = 'file';
        if (fileData.type.startsWith('image/')) messageType = 'image';
        else if (fileData.type.startsWith('video/')) messageType = 'video';
        else if (fileData.type.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';

        await sendMessage(file.name, messageType, fileData);
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface dark:bg-surface-dark">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-soft">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Vishubh</h3>
          <p className="text-gray-500 dark:text-gray-400">Select a friend to start messaging</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">🔒 All messages are secure and private</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface dark:bg-surface-dark">
      {/* Chat Header */}
      <div className="bg-card dark:bg-card-dark border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-surface dark:hover:bg-surface-dark rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg">
                {selectedUser.avatar || '👤'}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                selectedUser.status === 'online' ? 'bg-green-500' : selectedUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.username}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedUser.status === 'online' ? '🟢 Active now' : selectedUser.status === 'away' ? '🟡 Away' : '⚫ Offline'}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-surface dark:hover:bg-surface-dark rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Messages */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          chatMessages.map(message => (
            <MessageBubble key={message.id} message={message} currentUserId={currentUser?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
  <div className="bg-card dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-20 right-4 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              width={350}
              height={400}
            />
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-3 rounded-full hover:bg-surface dark:hover:bg-surface-dark transition-colors disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 rounded-full hover:bg-surface dark:hover:bg-surface-dark transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 rounded-2xl bg-surface dark:bg-surface-dark border-none focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={uploading}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || uploading}
            className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatArea;