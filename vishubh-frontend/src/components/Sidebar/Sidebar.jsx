import React, { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, LogOut, UserPlus, Bell, Users, X, Check, XCircle, Settings, UserCircle, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { 
    friends, 
    friendRequests, 
    selectedUser, 
    setSelectedUser, 
    currentUser, 
    darkMode, 
    setDarkMode, 
    logout, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    loadMessages,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const profileMenuRef = useRef(null);

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.length >= 2 && showSearch) {
        setSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, showSearch]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFriend = async (friend) => {
  setSelectedUser(friend);
  setIsSidebarOpen(false);
  setShowSearch(false);
  setShowRequests(false);
  setShowProfileMenu(false);
  
  // Load messages for this friend
  await loadMessages(friend.id);
};

  const handleSendRequest = async (userId) => {
    const result = await sendFriendRequest(userId);
    if (result.success) {
      setSearchResults(prev => prev.map(user => 
        user.id === userId ? { ...user, sent_request_status: 'pending' } : user
      ));
    } else {
      alert(result.error || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    await acceptFriendRequest(requestId);
  };

  const handleRejectRequest = async (requestId) => {
    await rejectFriendRequest(requestId);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setShowRequests(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowProfileMenu(false);
  };

  const toggleRequests = () => {
    setShowRequests(!showRequests);
    setShowSearch(false);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <>
  <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 z-30 h-full w-80 bg-surface dark:bg-surface-dark border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {/* User Profile Section */}
            <div className="relative flex-1" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 hover:bg-surface dark:hover:bg-surface-dark rounded-lg p-2 transition-colors w-full"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {currentUser?.avatar}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{currentUser?.username}</h2>
                  <p className="text-xs text-green-500 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border py-2 z-50 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-4 py-2 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-black'}`}>{currentUser?.username}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Add profile settings functionality here
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-50 text-black'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-50 text-black'}`}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className={`border-t mt-2 pt-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors ${darkMode ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-gray-50 text-red-600'}`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={toggleSearch}
                className="p-2 rounded-lg hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                title="Add Friend"
              >
                <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <button
                onClick={toggleRequests}
                className="relative p-2 rounded-lg hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                title="Friend Requests"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {friendRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search */}
          {!showSearch && !showRequests && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="    Search friends..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface dark:bg-surface-dark border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Friend Requests Panel */}
        {showRequests && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Friend Requests
              </h3>
              <button 
                onClick={() => setShowRequests(false)}
                className="p-1 hover:bg-surface dark:hover:bg-surface-dark rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface dark:bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map(request => (
                  <div key={request.id} className="p-3 bg-card dark:bg-card-dark rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                        {request.avatar || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{request.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Users Panel */}
        {showSearch && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Add Friend
              </h3>
              <button 
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-surface dark:hover:bg-surface-dark rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="    Search by username or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface dark:bg-surface-dark border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                autoFocus
              />
            </div>
            {searching ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Searching...</p>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Search className="" />
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-card dark:bg-card-dark rounded-lg hover:bg-surface dark:hover:bg-surface-dark transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                        {user.avatar || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {user.is_friend ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                          Friends
                        </span>
                      ) : user.sent_request_status === 'pending' ? (
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      ) : user.received_request_status === 'pending' ? (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                          Respond
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends List */}
        {!showSearch && !showRequests && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-2">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Friends ({filteredFriends.length})
              </h3>
              
              {filteredFriends.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No friends yet</p>
                  <p className="text-xs mt-1">Click <UserPlus className="w-3 h-3 inline" /> to add friends</p>
                </div>
              ) : (
                filteredFriends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleSelectFriend(friend)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      selectedUser?.id === friend.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
            : 'hover:bg-surface dark:hover:bg-surface-dark'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl">
                        {friend.avatar || '👤'}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        friend.status === 'online' ? 'bg-green-500' : friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">{friend.username}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.email}</p>
                    </div>
                    {friend.unread_count > 0 && (
                      <span className="flex-shrink-0 px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">
                        {friend.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            <p>🔒 Secure Messaging</p>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;