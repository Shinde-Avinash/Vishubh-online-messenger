import React, { useState } from 'react';
import { Check, CheckCheck, Image as ImageIcon, File, Video, Music, FileText, Download, X, Eye } from 'lucide-react';
import { fileAPI } from '../../utils/api';

const MessageBubble = ({ message, currentUserId }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isSent = message.sender_id === currentUserId || message.senderId === currentUserId;

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type?.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type?.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type?.includes('pdf') || type?.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDownload = async () => {
    const fileId = message.file?.id || message.file_id;
    if (fileId) {
      try {
        const token = localStorage.getItem('vishubh_token');
        const response = await fetch(`http://localhost:5000/api/files/download/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = message.file?.name || message.original_name || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download file. Please try again.');
      }
    }
  };

  const isImage = message.message_type === 'image' || message.file?.type?.startsWith('image/') || message.file_type?.startsWith('image/');
  const isVideo = message.message_type === 'video' || message.file?.type?.startsWith('video/') || message.file_type?.startsWith('video/');
  const isAudio = message.message_type === 'audio' || message.file?.type?.startsWith('audio/') || message.file_type?.startsWith('audio/');
  const isFile = message.message_type === 'file' || message.message_type === 'document';

  // Get file URL - try multiple sources
  const fileUrl = message.file?.url || 
                  (message.filename ? fileAPI.getFileUrl(message.filename) : null) ||
                  (message.file?.filename ? fileAPI.getFileUrl(message.file.filename) : null);

  const fileName = message.file?.name || message.original_name || message.content || 'File';
  const fileSize = message.file?.size || message.file_size;
  const fileType = message.file?.type || message.file_type;

  return (
    <>
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isSent ? 'order-2' : 'order-1'}`}>
          {message.message_type === 'text' || (!message.file && !message.file_id && message.content) ? (
            <div className={`rounded-2xl px-4 py-2 ${
              isSent
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-card dark:bg-card-dark text-gray-900 dark:text-white rounded-bl-none shadow'
            }`}>
              <p className="break-words whitespace-pre-wrap">{message.content}</p>
              <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                isSent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span>{formatTime(message.timestamp || message.created_at)}</span>
                {isSent && (message.is_read || message.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl p-3 ${
              isSent
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-card dark:bg-card-dark text-gray-900 dark:text-white rounded-bl-none shadow'
            }`}>
              {/* Image Preview */}
              {isImage && fileUrl && !imageError && (
                <div className="mb-2">
                  <img 
                    src={fileUrl} 
                    alt={fileName}
                    className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowPreview(true)}
                    onError={() => {
                      console.error('Image load failed:', fileUrl);
                      setImageError(true);
                    }}
                  />
                </div>
              )}

              {/* Video Preview */}
              {isVideo && fileUrl && (
                <div className="mb-2">
                  <video 
                    src={fileUrl} 
                    controls
                    className="rounded-lg max-w-full h-auto max-h-64"
                  />
                </div>
              )}

              {/* Audio Preview */}
              {isAudio && fileUrl && (
                <div className="mb-2">
                  <audio 
                    src={fileUrl} 
                    controls
                    className="w-full"
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isSent ? 'bg-white/20' : 'bg-surface dark:bg-surface-dark'}`}>
                  {getFileIcon(fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileName}</p>
                  <p className={`text-xs ${isSent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatFileSize(fileSize)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  {isImage && fileUrl && !imageError && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className={`p-2 rounded-lg transition-colors ${isSent ? 'hover:bg-white/20' : 'hover:bg-surface dark:hover:bg-surface-dark'}`}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className={`p-2 rounded-lg transition-colors ${isSent ? 'hover:bg-white/20' : 'hover:bg-surface dark:hover:bg-surface-dark'}`}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`flex items-center justify-end space-x-1 mt-2 text-xs ${
                isSent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span>{formatTime(message.timestamp || message.created_at)}</span>
                {isSent && (message.is_read || message.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && isImage && fileUrl && !imageError && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 p-2 bg-card/10 hover:bg-card/20 dark:bg-card-dark/10 dark:hover:bg-card-dark/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="absolute bottom-4 right-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        </div>
      )}
    </>
  );
};

export default MessageBubble;