//controllers/ownerControllers_3_emp.js

import bcrypt from 'bcrypt';
import sqldb from '../config/sqldb.js';
import nodemailer from 'nodemailer';
import { connectToDatabase } from '../config/mongodb.js';
import { ObjectId } from 'mongodb'; // Make sure this is imported
import multer from 'multer';

const saltRounds = 10;

export const ownerCreateEmployee = (req, res) => {
    const { employee_uname, email, f_name, l_name, password, com_password, phone_1, phone_2, role } = req.body;

    // Validation for empty fields
    if (!employee_uname || !email || !f_name || !l_name || !password || !com_password || !phone_1 || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Validation for password mismatch
    if (password !== com_password) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['employee', 'cashier', 'onlineorderchecker'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
            message: "Invalid role. Must Employee, Cashier, or Online Order Checker",
            Status: "error" 
        });
    }

    // First check if email already exists in the database
    const checkEmailQuery = "SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ?";
    
    sqldb.query(checkEmailQuery, [email], (emailCheckErr, emailCheckResult) => {
        if (emailCheckErr) {
            console.error("Error checking existing email:", emailCheckErr);
            return res.status(500).json({ message: "Error checking email in database" });
        }
        
        // If email already exists, return an error
        if (emailCheckResult && emailCheckResult.length > 0) {
            return res.status(409).json({ 
                message: "Email address already registered. Please use a different email.", 
                Status: "error" 
            });
        }
        
        // Also check if username already exists
        const checkUsernameQuery = "SELECT * FROM Polocity_Panel_Users WHERE USERNAME = ?";
        
        sqldb.query(checkUsernameQuery, [employee_uname], (usernameCheckErr, usernameCheckResult) => {
            if (usernameCheckErr) {
                console.error("Error checking existing username:", usernameCheckErr);
                return res.status(500).json({ message: "Error checking username in database" });
            }
            
            // If username already exists, return an error
            if (usernameCheckResult && usernameCheckResult.length > 0) {
                return res.status(409).json({ 
                    message: "Username already taken. Please choose a different username.",
                    Status: "error" 
                });
            }
            
            // If email and username are unique, proceed with creating the employee account
            // Hash the password
            bcrypt.hash(password, saltRounds, (err, passwordHash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                    return res.status(500).json({ message: "Error hashing password" });
                }

                // SQL query to insert a new employee into the database
                const sql = `INSERT INTO Polocity_Panel_Users 
                            (USERNAME, EMAIL, F_NAME, L_NAME, PASSWORD, PHONE_NUM1, PHONE_NUM2, ROLE) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                const values = [
                    employee_uname, 
                    email,          
                    f_name,         
                    l_name,         
                    passwordHash,   
                    phone_1,        
                    phone_2 || null,
                    role            
                ];

                // Execute the SQL query
                sqldb.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("Error inserting data:", err);
                        return res.status(500).json({ message: "Error inserting data into the database" });
                    }

                    console.log("Employee added successfully");

                    // Only send email if role is onlineorderchecker
                    if (role === 'onlineorderchecker') {
                        // Create a Nodemailer transporter
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            }
                        });

                        // Define email content
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: 'Your Online Order Checker Account Details',
                            html: `
                                <h1>Hello ${f_name} ${l_name},</h1>
                                <p>Your online order checker account has been successfully created. Below are your login details:</p>
                                <ul>
                                    <li><strong>Username:</strong> ${employee_uname}</li>
                                    <li><strong>Email:</strong> ${email}</li>
                                    <li><strong>Password:</strong> ${password}</li>
                                </ul>
                                <p>Please use these credentials to log in to your account.</p>
                                <p>Best regards,<br>Your Company Name</p>
                            `
                        };

                        // Send the email
                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                console.error("Error sending email:", err);
                                return res.status(500).json({ 
                                    message: "Employee created successfully, but failed to send email", 
                                    Status: "Success" 
                                });
                            }

                            console.log("Email sent:", info.response);
                            res.status(200).json({ 
                                message: "Employee created successfully and email sent", 
                                Status: "Success"
                            });
                        });
                    } else {
                        // For other roles, just return success without sending email
                        res.status(200).json({ 
                            message: "Employee created successfully", 
                            Status: "Success"
                        });
                    }
                });
            });
        });
    });
};

export const getAllEmployees = (req, res) => {
  const sql = `
    SELECT 
      ID as id,
      USERNAME as username, 
      EMAIL as email,
      F_NAME as first_name, 
      L_NAME as last_name,
      PHONE_NUM1 as phone_1,
      PHONE_NUM2 as phone_2,
      ROLE as role,
      createdAt,
      updatedAt
    FROM Polocity_Panel_Users
    ORDER BY ID DESC
  `;
  
  sqldb.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ 
        message: 'Error fetching employees from database',
        Status: 'error',
        error: err.message
      });
    }
    
    // Format dates for consistency
    const formattedEmployees = result.map(employee => ({
      ...employee,
      createdAt: new Date(employee.createdAt).toISOString(),
      updatedAt: new Date(employee.updatedAt).toISOString()
    }));
    
    res.status(200).json({
      Status: 'success',
      count: formattedEmployees.length,
      employees: formattedEmployees
    });
  });
};

export const getEmployeeById = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      message: 'Employee ID is required', 
      Status: 'error' 
    });
  }
  
  const sql = `
    SELECT 
      ID as id,
      USERNAME as username, 
      EMAIL as email,
      F_NAME as first_name, 
      L_NAME as last_name,
      PHONE_NUM1 as phone_1,
      PHONE_NUM2 as phone_2,
      ROLE as role,
      createdAt,
      updatedAt
    FROM Polocity_Panel_Users
    WHERE ID = ?
  `;
  
  sqldb.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ 
        message: 'Error fetching employee from database',
        Status: 'error',
        error: err.message
      });
    }
    
    if (!result || result.length === 0) {
      return res.status(404).json({ 
        message: 'Employee not found',
        Status: 'error'
      });
    }
    
    // Format dates for consistency
    const employee = {
      ...result[0],
      createdAt: new Date(result[0].createdAt).toISOString(),
      updatedAt: new Date(result[0].updatedAt).toISOString()
    };
    
    res.status(200).json({
      Status: 'success',
      employee
    });
  });
};

export const updateEmployee = (req, res) => {
  const { id } = req.params;
  const { 
    first_name, 
    last_name, 
    email, 
    phone_1, 
    phone_2, 
    role 
  } = req.body;
  
  // Validate role is one of the allowed values
  const allowedRoles = ['admin', 'employee', 'cashier', 'onlineorderchecker'];
  if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ 
          message: "Invalid role. Must be admin, employee, cashier, or onlineorderchecker",
          Status: "error" 
      });
  }
  
  if (!id) {
    return res.status(400).json({ 
      message: 'Employee ID is required', 
      Status: 'error' 
    });
  }
  
  // Check if email is changed and if so, check if the new email is already in use
  const checkEmailQuery = "SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ? AND ID != ?";
  
  sqldb.query(checkEmailQuery, [email, id], (emailCheckErr, emailCheckResult) => {
    if (emailCheckErr) {
      console.error("Error checking existing email:", emailCheckErr);
      return res.status(500).json({ 
        message: "Error checking email in database",
        Status: "error" 
      });
    }
    
    // If email already exists, return an error
    if (emailCheckResult && emailCheckResult.length > 0) {
      return res.status(409).json({ 
        message: "Email address already registered to another employee. Please use a different email.", 
        Status: "error" 
      });
    }
    
    // If email is unique or unchanged, proceed with update
    const updateSql = `
      UPDATE Polocity_Panel_Users
      SET 
        F_NAME = ?,
        L_NAME = ?,
        EMAIL = ?,
        PHONE_NUM1 = ?,
        PHONE_NUM2 = ?,
        ROLE = ?
      WHERE ID = ?
    `;
    
    const updateValues = [
      first_name,
      last_name,
      email,
      phone_1,
      phone_2 || null,
      role,
      id
    ];
    
    sqldb.query(updateSql, updateValues, (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating employee:", updateErr);
        return res.status(500).json({ 
          message: "Error updating employee in database",
          Status: "error",
          error: updateErr.message
        });
      }
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ 
          message: "Employee not found or no changes made",
          Status: "error" 
        });
      }
      
      res.status(200).json({ 
        message: "Employee updated successfully", 
        Status: "success",
        affectedRows: updateResult.affectedRows
      });
    });
  });
};

export const deleteEmployee = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      message: 'Employee ID is required', 
      Status: 'error' 
    });
  }
  
  const sql = 'DELETE FROM Polocity_Panel_Users WHERE ID = ?';
  
  sqldb.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ 
        message: 'Error deleting employee from database',
        Status: 'error',
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Employee not found',
        Status: 'error'
      });
    }
    
    res.status(200).json({
      message: 'Employee deleted successfully',
      Status: 'success',
      affectedRows: result.affectedRows
    });
  });
};