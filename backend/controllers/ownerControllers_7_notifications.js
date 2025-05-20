// Notification controllers

import sqldb from '../config/sqldb.js';

// Get notifications for a user
export const getNotifications = (req, res) => {
  const { userId, role } = req.query;
  
  if (!userId && !role) {
    return res.status(400).json({
      Status: 'error',
      message: 'User ID or role is required'
    });
  }
  
  // Query to get notifications for a specific user or role-based notifications
  let query = `
    SELECT 
      ID as id,
      TITLE as title, 
      MESSAGE as message,
      STATUS as status,
      createdAt,
      readAt
    FROM Polocity_Notifications
    WHERE 
      (USER_ID = ? OR USER_ID IS NULL) 
  `;
  
  // Add role filter if provided
  if (role) {
    query += ` OR (ROLE = ? AND USER_ID IS NULL)`;
  } else {
    query += ` OR (ROLE IS NULL AND USER_ID IS NULL)`;
  }
  
  query += ` ORDER BY createdAt DESC LIMIT 30`;
  
  sqldb.query(query, [userId, role], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to fetch notifications'
      });
    }
    
    res.status(200).json({
      Status: 'Success',
      count: results.length,
      notifications: results
    });
  });
};

// Mark a notification as read
export const markNotificationAsRead = (req, res) => {
  const { id } = req.params;
  
  const query = `
    UPDATE Polocity_Notifications
    SET STATUS = 'read', readAt = NOW()
    WHERE ID = ?
  `;
  
  sqldb.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error marking notification as read:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to mark notification as read'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      Status: 'Success',
      message: 'Notification marked as read'
    });
  });
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      Status: 'error',
      message: 'User ID is required'
    });
  }
  
  const query = `
    UPDATE Polocity_Notifications
    SET STATUS = 'read', readAt = NOW()
    WHERE USER_ID = ? AND STATUS = 'unread'
  `;
  
  sqldb.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error marking all notifications as read:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to mark all notifications as read'
      });
    }
    
    res.status(200).json({
      Status: 'Success',
      message: 'All notifications marked as read',
      count: result.affectedRows
    });
  });
};

// Create a notification for a specific user
export const createNotification = (req, res) => {
  const { userId, title, message } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({
      Status: 'error',
      message: 'Title and message are required'
    });
  }
  
  const query = `
    INSERT INTO Polocity_Notifications
    (USER_ID, TITLE, MESSAGE)
    VALUES (?, ?, ?)
  `;
  
  sqldb.query(query, [userId, title, message], (err, result) => {
    if (err) {
      console.error('Error creating notification:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to create notification'
      });
    }
    
    res.status(201).json({
      Status: 'Success',
      message: 'Notification created successfully',
      id: result.insertId
    });
  });
};

// Create a notification for a role
export const createRoleNotification = (req, res) => {
  const { role, title, message } = req.body;
  
  if (!role || !title || !message) {
    return res.status(400).json({
      Status: 'error',
      message: 'Role, title, and message are required'
    });
  }
  
  const query = `
    INSERT INTO Polocity_Notifications
    (ROLE, TITLE, MESSAGE)
    VALUES (?, ?, ?)
  `;
  
  sqldb.query(query, [role, title, message], (err, result) => {
    if (err) {
      console.error('Error creating role notification:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to create role notification'
      });
    }
    
    res.status(201).json({
      Status: 'Success',
      message: 'Role notification created successfully',
      id: result.insertId
    });
  });
};

// Get unread notification count for a user or role
export const getUnreadCount = (req, res) => {
  const { userId, role } = req.query;
  
  if (!userId && !role) {
    return res.status(400).json({
      Status: 'error',
      message: 'User ID or role is required'
    });
  }
  
  let query = `
    SELECT COUNT(*) as count
    FROM Polocity_Notifications
    WHERE STATUS = 'unread' AND 
    (
      (USER_ID = ? OR USER_ID IS NULL)
  `;
  
  // Add role filter if provided
  if (role) {
    query += ` OR (ROLE = ? AND USER_ID IS NULL)`;
  } else {
    query += ` OR (ROLE IS NULL AND USER_ID IS NULL)`;
  }
  
  query += `)`;
  
  sqldb.query(query, [userId, role], (err, results) => {
    if (err) {
      console.error('Error getting unread count:', err);
      return res.status(500).json({
        Status: 'error',
        message: 'Failed to get unread count'
      });
    }
    
    res.status(200).json({
      Status: 'Success',
      count: results[0].count
    });
  });
};

// Helper function to create a notification programmatically (not exposed as an API)
export const createNotificationInternal = (userId, title, message, callback) => {
  const query = `
    INSERT INTO Polocity_Notifications
    (USER_ID, TITLE, MESSAGE)
    VALUES (?, ?, ?)
  `;
  
  sqldb.query(query, [userId, title, message], (err, result) => {
    if (callback) {
      callback(err, result);
    } else if (err) {
      console.error('Error creating notification:', err);
    }
  });
};

// Helper function to create a role notification programmatically (not exposed as an API)
export const createRoleNotificationInternal = (role, title, message, callback) => {
  const query = `
    INSERT INTO Polocity_Notifications
    (ROLE, TITLE, MESSAGE)
    VALUES (?, ?, ?)
  `;
  
  sqldb.query(query, [role, title, message], (err, result) => {
    if (callback) {
      callback(err, result);
    } else if (err) {
      console.error('Error creating role notification:', err);
    }
  });
};