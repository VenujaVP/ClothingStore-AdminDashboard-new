// component/Navbar/Navbar.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */


import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { FaBell, FaUserCircle, FaBars, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { jwtDecode } from 'jwt-decode'; // Correct import with named export

const Navbar = ({ onMobileMenuClick, isMobile, isMenuOpen }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  // Get user info from token instead of directly from localStorage
  const [userInfo, setUserInfo] = useState({
    id: null,
    name: "User",
    role: ""
  });

  // Extract user info from token when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    console.log( "nvhgbvchgvgvvtoken", storedRole)
    
    if (token) {
      try {
        // Decode the JWT token to get user information
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);
        
        setUserInfo({
          id: decoded.id || decoded.userId || decoded.user_id, // Try different possible field names
          name: decoded.name || decoded.username || "User",
          role: storedRole || decoded.role || ""
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch notifications when component mounts and every 30 seconds
  useEffect(() => {
    if (userInfo.id) {
      console.log("User ID for notifications:", userInfo.id);
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo.id]); // Depend on userInfo.id instead of userId

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    if (!userInfo.id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8082/api/owner/notifications`, {
        params: { userId: userInfo.id, role: userInfo.role },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.Status === "Success") {
        setNotifications(response.data.notifications);
        
        // Count unread notifications
        const unread = response.data.notifications.filter(
          notification => notification.status === 'unread'
        ).length;
        
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:8082/api/owner/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read', readAt: new Date().toISOString() } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:8082/api/owner/notifications/read-all`, 
        { userId: userInfo.id }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: 'read', 
          readAt: new Date().toISOString() 
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* Mobile Menu Button */}
      <div className="mobile-menu-btn" onClick={onMobileMenuClick}>
        <FaBars />
      </div>

      {/* Logo - Always show in center */}
      <div className="navbar-logo">
        {logo ? (
          <img src={logo} alt="Logo" className="nav-logo-img" />
        ) : (
          <span className="logo-text">LOGO</span>
        )}
      </div>

      {/* Right Section */}
      <div className="nav-right">
        <div className="nav-item" ref={notificationRef}>
          <div 
            className="notification-icon" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="notifications-list">
                {loading && <div className="notification-loading">Loading...</div>}
                
                {!loading && notifications.length === 0 && (
                  <div className="no-notifications">No notifications yet</div>
                )}
                
                {!loading && notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.status === 'unread' ? 'unread' : ''}`}
                    onClick={() => notification.status === 'unread' && markAsRead(notification.id)}
                  >
                    <div className="notification-status">
                      {notification.status === 'unread' ? (
                        <FaRegCircle className="unread-icon" />
                      ) : (
                        <FaCheckCircle className="read-icon" />
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatNotificationTime(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="notifications-footer">
                <a href="/notifications">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        <div className="nav-item user-profile">
          {!isMobile && <span className="user-name">{userInfo.name}</span>}
          <FaUserCircle className="user-avatar" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
