import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, Briefcase, Mail, AlertCircle, MoreVertical } from 'lucide-react';
import api from '../../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up a polling interval to check for new notifications
    const interval = setInterval(() => {
      if (!showDropdown) { // Only poll when dropdown is closed
        fetchNotifications();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [showDropdown]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      
      // Update local state
      setNotifications(notifications.map(note => 
        note.id === id ? { ...note, is_read: true } : note
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      // Update local state
      setNotifications(notifications.map(note => ({ ...note, is_read: true })));
      setUnreadCount(0);
      setShowMenu(false);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      // Update local state
      const deletedNotification = notifications.find(note => note.id === id);
      setNotifications(notifications.filter(note => note.id !== id));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications/all');
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      setShowMenu(false);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_match':
        return <Briefcase size={16} />;
      case 'application_update':
        return <Mail size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  // Get notification class based on read status
  const getNotificationClass = (isRead) => {
    return isRead ? 'notification-item' : 'notification-item notification-unread';
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        className="notifications-bell"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3 className="notifications-title">Notifications</h3>
            <div className="notifications-header-actions">
              <button 
                className="notifications-menu-button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div className="notifications-menu" ref={menuRef}>
                  <button 
                    className="notifications-menu-item"
                    onClick={markAllAsRead}
                  >
                    <Check size={16} />
                    <span>Mark all as read</span>
                  </button>
                  <button 
                    className="notifications-menu-item"
                    onClick={deleteAllNotifications}
                  >
                    <X size={16} />
                    <span>Delete all</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="notifications-content">
            {loading ? (
              <div className="notifications-loading">
                <div className="loading-spinner-small"></div>
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notifications-error">
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <Bell size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={getNotificationClass(notification.is_read)}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      
                      // Handle notification click based on type
                      if (notification.type === 'job_match' && notification.related_id) {
                        // Navigate to the job details
                        window.location.href = `/jobs/${notification.related_id}`;
                      } else if (notification.type === 'application_update' && notification.related_id) {
                        // Navigate to the application details
                        window.location.href = `/applications/${notification.related_id}`;
                      }
                    }}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatDate(notification.created_at)}</div>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the parent click handler
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="notifications-footer">
            <Link 
              to="/notifications"
              className="notifications-view-all"
              onClick={() => setShowDropdown(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;