// controllers/employeeControllers.js

import bcrypt from 'bcrypt';
import sqldb from '../config/sqldb.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const saltRounds = 10;

// Get employee profile information
export const getEmployeeProfile = (req, res) => {
  const userId = req.query.userId;
  console.log(userId)
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const sql = 'SELECT ID, USERNAME, EMAIL, F_NAME, L_NAME, PHONE_NUM1, PHONE_NUM2, ROLE FROM Polocity_Panel_Users WHERE ID = ? AND ROLE = "onlineorderchecker"';
  
  sqldb.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching employee profile:', err);
      return res.status(500).json({ message: 'Error fetching employee profile' });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json(result[0]);
  });
};

// Update employee profile details
export const updateEmployeeProfile = (req, res) => {
  const { userId, firstName, lastName, phoneNum1, phoneNum2 } = req.body;
  
  if (!userId || !firstName || !lastName || !phoneNum1) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const sql = 'UPDATE Polocity_Panel_Users SET F_NAME = ?, L_NAME = ?, PHONE_NUM1 = ?, PHONE_NUM2 = ? WHERE ID = ? AND ROLE = "onlineorderchecker"';
  
  sqldb.query(sql, [firstName, lastName, phoneNum1, phoneNum2 || null, userId], (err, result) => {
    if (err) {
      console.error('Error updating employee profile:', err);
      return res.status(500).json({ message: 'Error updating employee profile' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found or no changes made' });
    }
    
    res.status(200).json({ message: 'Profile updated successfully' });
  });
};

// Verify current password
export const verifyCurrentPassword = (req, res) => {
  const { userId, currentPassword } = req.body;
  
  if (!userId || !currentPassword) {
    return res.status(400).json({ message: 'User ID and password are required' });
  }
  
  // Get user password from database
  const sql = 'SELECT PASSWORD FROM Polocity_Panel_Users WHERE ID = ? AND ROLE = "onlineorderchecker"';
  
  sqldb.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const hashedPassword = result[0].PASSWORD;
    
    // Compare passwords
    bcrypt.compare(currentPassword, hashedPassword, (err, match) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Error verifying password' });
      }
      
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Password matches
      res.status(200).json({ message: 'Current password verified' });
    });
  });
};

// Send verification code for password change
export const initiatePasswordChange = (req, res) => {
  const { userId, currentEmail } = req.body;
  
  if (!userId || !currentEmail) {
    return res.status(400).json({ message: 'User ID and email are required' });
  }
  
  // Generate a verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
  
  // Save verification code to database
  const saveCodeQuery = 'UPDATE Polocity_Panel_Users SET resetToken = ?, resetTokenExpiry = ? WHERE ID = ? AND ROLE = "onlineorderchecker"';
  
  sqldb.query(saveCodeQuery, [verificationCode, codeExpiry, userId], (err) => {
    if (err) {
      console.error('Error saving verification code:', err);
      return res.status(500).json({ message: 'Error saving verification code' });
    }
    
    // Send email with verification code
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: currentEmail,
      subject: 'Password Change Verification - POLOCITY Employee Portal',
      html: `
        <h2>Password Change Request</h2>
        <p>You've requested to change your password for your POLOCITY Employee account.</p>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this change, please secure your account immediately.</p>
        <p>Best regards,<br>POLOCITY Team</p>
      `
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending verification email' });
      }
      
      res.status(200).json({ message: 'Verification code sent to your email' });
    });
  });
};

// Verify code and update password
export const verifyCodeAndUpdatePassword = (req, res) => {
  const { userId, verificationCode, newPassword } = req.body;
  
  if (!userId || !verificationCode || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check if the verification code is valid
  const checkCodeQuery = 'SELECT * FROM Polocity_Panel_Users WHERE ID = ? AND resetToken = ? AND resetTokenExpiry > NOW() AND ROLE = "onlineorderchecker"';
  
  sqldb.query(checkCodeQuery, [userId, verificationCode], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Error processing your password' });
      }
      
      // Update the password and clear the reset token
      const updatePasswordQuery = 'UPDATE Polocity_Panel_Users SET PASSWORD = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE ID = ? AND ROLE = "onlineorderchecker"';
      
      sqldb.query(updatePasswordQuery, [hashedPassword, userId], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ message: 'Error updating password' });
        }
        
        res.status(200).json({ message: 'Password updated successfully' });
      });
    });
  });
};

// Initiate email change - verify current email first
export const initiateEmailChange = (req, res) => {
  const { userId, currentEmail } = req.body;
  
  if (!userId || !currentEmail) {
    return res.status(400).json({ message: 'User ID and current email are required' });
  }
  
  // Verify email matches user's current email
  const checkEmailQuery = 'SELECT EMAIL FROM Polocity_Panel_Users WHERE ID = ? AND ROLE = "onlineorderchecker"';
  
  sqldb.query(checkEmailQuery, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    if (result[0].EMAIL !== currentEmail) {
      return res.status(400).json({ message: 'Email does not match current email' });
    }
    
    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    
    // Save verification code to database
    const saveCodeQuery = 'UPDATE Polocity_Panel_Users SET resetToken = ?, resetTokenExpiry = ? WHERE ID = ? AND ROLE = "onlineorderchecker"';
    
    sqldb.query(saveCodeQuery, [verificationCode, codeExpiry, userId], (err) => {
      if (err) {
        console.error('Error saving verification code:', err);
        return res.status(500).json({ message: 'Error saving verification code' });
      }
      
      // Send email with verification code
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: currentEmail,
        subject: 'Email Change Verification - POLOCITY Employee Portal',
        html: `
          <h2>Email Change Request</h2>
          <p>You've requested to change the email address for your POLOCITY Employee account.</p>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this change, please secure your account immediately.</p>
          <p>Best regards,<br>POLOCITY Team</p>
        `
      };
      
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error sending email:', err);
          return res.status(500).json({ message: 'Error sending verification email' });
        }
        
        res.status(200).json({ message: 'Verification code sent to your current email' });
      });
    });
  });
};

// Verify current email code and send verification to new email - RENAMED to match frontend call
export const verifyCurrentEmail = (req, res) => {
  const { userId, verificationCode, newEmail } = req.body;
  
  if (!userId || !verificationCode || !newEmail) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check if the verification code is valid
  const checkCodeQuery = 'SELECT * FROM Polocity_Panel_Users WHERE ID = ? AND resetToken = ? AND resetTokenExpiry > NOW() AND ROLE = "onlineorderchecker"';
  
  sqldb.query(checkCodeQuery, [userId, verificationCode], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Check if new email already exists
    const checkEmailExistsQuery = 'SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ? AND ID != ?';
    
    sqldb.query(checkEmailExistsQuery, [newEmail, userId], (err, emailExists) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (emailExists.length > 0) {
        return res.status(400).json({ message: 'This email is already in use by another account' });
      }
      
      // Generate a new verification code
      const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
      
      // Store new verification code and new email temporarily
      const saveNewCodeQuery = 'UPDATE Polocity_Panel_Users SET resetToken = ?, resetTokenExpiry = ?, tempEmail = ? WHERE ID = ? AND ROLE = "onlineorderchecker"';
      
      sqldb.query(saveNewCodeQuery, [newVerificationCode, codeExpiry, newEmail, userId], (err) => {
        if (err) {
          console.error('Error saving new verification code:', err);
          return res.status(500).json({ message: 'Error saving new verification code' });
        }
        
        // Send email with verification code to new email
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
        });
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: newEmail,
          subject: 'Complete Email Change - POLOCITY Employee Portal',
          html: `
            <h2>Complete Your Email Change</h2>
            <p>You've requested to change your email address for your POLOCITY Employee account.</p>
            <p>Your verification code is: <strong>${newVerificationCode}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this change, please secure your account immediately.</p>
            <p>Best regards,<br>POLOCITY Team</p>
          `
        };
        
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({ message: 'Error sending verification email to new address' });
          }
          
          res.status(200).json({ 
            message: 'Verification code sent to your new email address',
            newEmail: newEmail // Return the new email to display on frontend
          });
        });
      });
    });
  });
};

// Complete email change with verification of new email
export const completeEmailChange = (req, res) => {
  const { userId, verificationCode } = req.body;
  
  if (!userId || !verificationCode) {
    return res.status(400).json({ message: 'User ID and verification code are required' });
  }
  
  // Retrieve the user with the verification code
  const checkCodeQuery = 'SELECT * FROM Polocity_Panel_Users WHERE ID = ? AND resetToken = ? AND resetTokenExpiry > NOW() AND ROLE = "onlineorderchecker"';
  
  sqldb.query(checkCodeQuery, [userId, verificationCode], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Get the new email from tempEmail field
    const newEmail = result[0].tempEmail;
    
    if (!newEmail) {
      return res.status(400).json({ message: 'New email address not found' });
    }
    
    // Update the email and clear temporary fields
    const updateEmailQuery = 'UPDATE Polocity_Panel_Users SET EMAIL = ?, resetToken = NULL, resetTokenExpiry = NULL, tempEmail = NULL WHERE ID = ? AND ROLE = "onlineorderchecker"';
    
    sqldb.query(updateEmailQuery, [newEmail, userId], (err) => {
      if (err) {
        console.error('Error updating email:', err);
        return res.status(500).json({ message: 'Error updating email address' });
      }
      
      res.status(200).json({ 
        message: 'Email address updated successfully',
        newEmail: newEmail
      });
    });
  });
};
