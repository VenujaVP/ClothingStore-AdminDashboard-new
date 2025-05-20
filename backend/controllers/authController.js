//controllers/authController.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sqldb from '../config/sqldb.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { console } from 'inspector/promises';

const saltRounds = 10;
dotenv.config();


// Owner registration Part - Updated for Polocity_Panel_Users table
export const OwnerRegister = (req, res) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // Check if the user already exists by email in the new table
    const checkUserExistence = 'SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ?';
    
    sqldb.query(checkUserExistence, [email], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Error checking for existing user" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords must match" });
        }

        // Generate a username (you can adjust this logic as needed)
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, passwordHash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ message: "Error hashing password" });
            }

            // SQL query to insert a new user into the Polocity_Panel_Users table
            const sql = `INSERT INTO Polocity_Panel_Users 
                        (USERNAME, EMAIL, F_NAME, L_NAME, PHONE_NUM1, PASSWORD, ROLE) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

            // Set role as "admin" for owner registration
            const values = [username, email, firstName, lastName, phone, passwordHash, 'admin'];

            sqldb.query(sql, values, (err, result) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).json({ message: "Error inserting data into the server", error: err.message });
                }

                console.log("Admin user registered successfully");
                return res.status(201).json({ Status: "Success" });
            });
        });
    });
};

//------------------------------------------------------------------------
// customer Authentication Part
//------------------------------------------------------------------------

// Customer registration Part
export const customerRegister = (req, res) => {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Check if the customer already exists by email
    const checkCustomerExistence = 'SELECT * FROM customers WHERE EMAIL = ?';
    
    sqldb.query(checkCustomerExistence, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error checking for existing user" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords must match" });
        }

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, passwordHash) => {
            if (err) {
                console.log("Error hashing password:", err);
                return res.status(500).json({ message: "Error hashing password" });
            }

            // SQL query to insert a new customer into the database
            const sql = `INSERT INTO customers 
                        (NAME, EMAIL, PHONE_NUM, PASSWORD) 
                        VALUES (?, ?, ?, ?)`;

            const values = [fullName, email, phone, passwordHash];

            sqldb.query(sql, values, (err, result) => {
                if (err) {
                    console.log("Error inserting data:", err);
                    return res.status(500).json({ message: "Error inserting data into the server" });
                }

                console.log("Registered successfully");
                return res.status(201).json({ Status: "Success" });
            });
        });
    });
};

// Customer login function (direct implementation)
export const customerhandleLogin = (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ Error: "Email and password are required" });
    }

    const sql = `SELECT * FROM customers WHERE EMAIL = ?`;
    sqldb.query(sql, [email], (err, result) => {
        console.log(result);
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ Error: "Database query error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ Error: "Email not registered" });
        }

        const hashedPassword = result[0].PASSWORD;

        // Compare passwords
        bcrypt.compare(password, hashedPassword, (err, match) => {
            console.log(match);
            if (err) {
                console.error("Error during password comparison:", err);
                return res.status(500).json({ Error: "Error during password comparison" });
            }

            if (match) {
                const user = {
                    id: result[0].ID,
                    email: result[0].EMAIL,
                    name: result[0].NAME
                };

                if (!process.env.JWT_SECRET) {
                    console.error("JWT_SECRET is not defined");
                    return res.status(500).json({ Error: "Server configuration error" });
                }

                jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
                    if (err) {
                        console.error("Error creating JWT token:", err);
                        return res.status(500).json({ Error: "Error creating token" });
                    }

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Lax',
                        maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
                    });

                    console.log("Token created and sent:", token);
                    return res.status(200).json({ Status: "Success", token });
                });
            } else {
                return res.status(401).json({ message: "Invalid password" });
            }
        });
    });
};

// Customer password reset request (direct implementation)
export const customerrequestPasswordReset = (req, res) => {
    const { email } = req.body;

    // Step 1: Find customer by email
    const findUserQuery = `SELECT * FROM customers WHERE EMAIL = ?`;
    sqldb.query(findUserQuery, [email], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const user = results[0];

        // Step 2: Generate password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Step 3: Update token in database
        const updateTokenQuery = `UPDATE customers SET resetToken = ?, resetTokenExpiry = ? WHERE ID = ?`;
        sqldb.query(updateTokenQuery, [resetToken, resetTokenExpiry, user.ID], (err, updateResult) => {
            if (err) {
                console.error("Error updating reset token:", err);
                return res.status(500).json({ message: "Error saving reset token" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Failed to update reset token" });
            }

            // Step 4: Generate reset link
            const resetLink = `http://localhost:5173/user-reset-password/${resetToken}`;

            // Step 5: Create email message
            const emailSubject = "Password Reset Assistance - POLOCITY";
            const emailMessage = `
                <h2>Password Reset Assistance</h2>
                <p>Hello ${user.NAME},</p>
                <p>We received a request to reset your password for your account at <strong>POLOCITY</strong>.</p>
                <p>Click the link below to securely reset your password:</p>
                <a href="${resetLink}" style="background: #28a745; padding: 10px 15px; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>If this request was not made by you, please disregard this email.</p>
                <p>For assistance, feel free to contact our support team.</p>
                <p>Best regards,<br>POLOCITY Customer Support</p>
            `;

            // Step 6: Send password reset email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: emailSubject,
                html: emailMessage
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error("Error sending email:", err);
                    return res.status(500).json({ message: "Error sending email", error: err });
                }
                console.log("Email sent:", info.response);
                res.status(200).json({ message: "Password reset email sent successfully" });
            });
        });
    });
};

// Customer reset password (direct implementation)
export const customerresetPassword = (req, res) => {
    const { resetToken, newPassword, confirmNewPassword } = req.body;

    if (!resetToken || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "Passwords must match" });
    }

    const currentTime = new Date();

    // Step 1: Find the customer with the reset token and check expiry
    const findUserQuery = `SELECT * FROM customers WHERE resetToken = ? AND resetTokenExpiry > ?`;

    sqldb.query(findUserQuery, [resetToken, currentTime], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) return res.status(400).json({ message: "Invalid or expired reset token" });

        const user = result[0];

        // Step 2: Hash the new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: "Error hashing password" });

            // Step 3: Update password and clear reset token
            const updatePasswordQuery = `UPDATE customers SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE ID = ?`;

            sqldb.query(updatePasswordQuery, [hashedPassword, user.ID], (err) => {
                if (err) return res.status(500).json({ message: "Error updating password" });

                res.status(200).json({ message: "Customer password reset successful" });
            });
        });
    });
};

//------------------------------------------------------------------------

//------------------------------------------------------------------------
// Owner and Employee Authentication Part
//------------------------------------------------------------------------

// Reusable function to handle login for both owners and customers
export const ownerEmployeehandleLogin = (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ Error: "Email and password are required" });
    }

    const sql = `SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ?`;
    sqldb.query(sql, [email], (err, result) => {
        console.log(result);
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ Error: "Database query error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ Error: "Email not registered" });
        }

        const hashedPassword = result[0].PASSWORD;
        const userRole = result[0].ROLE;

        // Check if user has allowed role
        if (userRole !== 'admin' && userRole !== 'onlineorderchecker') {
            return res.status(403).json({ Error: "Access denied. You don't have permission to access this system." });
        }

        // Compare passwords
        bcrypt.compare(password, hashedPassword, (err, match) => {
            console.log(match);
            if (err) {
                console.error("Error during password comparison:", err);
                return res.status(500).json({ Error: "Error during password comparison" });
            }

            if (match) {
                const user = {
                    id: result[0].ID,
                    email: result[0].EMAIL,
                    name: `${result[0].F_NAME} ${result[0].L_NAME}`,
                    role: result[0].ROLE // Include role in the token
                };

                if (!process.env.JWT_SECRET) {
                    console.error("JWT_SECRET is not defined");
                    return res.status(500).json({ Error: "Server configuration error" });
                }

                jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
                    if (err) {
                        console.error("Error creating JWT token:", err);
                        return res.status(500).json({ Error: "Error creating token" });
                    }

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Lax',
                        maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
                    });

                    console.log("Token created and sent:", token);
                    
                    // Return role information along with the token
                    return res.status(200).json({ 
                        Status: "Success", 
                        token,
                        role: user.role // Return role for frontend routing
                    });
                });
            } else {
                return res.status(401).json({ message: "Invalid password" });
            }
        });
    });
};

// Updated ownerEmployeerequestPasswordReset for Polocity_Panel_Users
export const ownerEmployeerequestPasswordReset = (req, res) => {
    const { email } = req.body;

    // Step 1: Find user by email
    const findUserQuery = `SELECT * FROM Polocity_Panel_Users WHERE EMAIL = ?`;
    sqldb.query(findUserQuery, [email], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];

        // Step 2: Generate password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Step 3: Update token in database
        const updateTokenQuery = `UPDATE Polocity_Panel_Users SET resetToken = ?, resetTokenExpiry = ? WHERE ID = ?`;
        sqldb.query(updateTokenQuery, [resetToken, resetTokenExpiry, user.ID], (err, updateResult) => {
            if (err) {
                console.error("Error updating reset token:", err);
                return res.status(500).json({ message: "Error saving reset token" });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Failed to update reset token" });
            }

            // Step 4: Generate reset link
            const resetLink = `http://localhost:5173/panel-reset-password/${resetToken}`;

            // Step 5: Create email message
            const emailSubject = "Password Reset Request - POLOCITY";
            const emailMessage = `
                <h2>Password Reset Request</h2>
                <p>Hello ${user.F_NAME} ${user.L_NAME},</p>
                <p>We noticed that you requested a password reset for your ${user.ROLE} account on <strong>POLOCITY</strong>.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" style="background: #007bff; padding: 10px 15px; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>If you did not request this, please ignore this email or contact support.</p>
                <p>This link will expire in 15 minutes.</p>
                <p>Best regards,<br>POLOCITY Team</p>
            `;

            // Step 6: Send password reset email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: emailSubject,
                html: emailMessage
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error("Error sending email:", err);
                    return res.status(500).json({ message: "Error sending email", error: err });
                }
                console.log("Email sent:", info.response);
                res.status(200).json({ message: "Password reset email sent successfully" });
            });
        });
    });
};

// Updated ownerEmployeeresetPassword for Polocity_Panel_Users
export const ownerEmployeeresetPassword = (req, res) => {
    const { resetToken, newPassword, confirmNewPassword } = req.body;

    if (!resetToken || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "Passwords must match" });
    }

    const currentTime = new Date();

    // Step 1: Find the user with the reset token and check expiry
    const findUserQuery = `SELECT * FROM Polocity_Panel_Users WHERE resetToken = ? AND resetTokenExpiry > ?`;

    sqldb.query(findUserQuery, [resetToken, currentTime], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) return res.status(400).json({ message: "Invalid or expired reset token" });

        const user = result[0];

        // Step 2: Hash the new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: "Error hashing password" });

            // Step 3: Update password and clear reset token
            const updatePasswordQuery = `UPDATE Polocity_Panel_Users SET PASSWORD = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE ID = ?`;

            sqldb.query(updatePasswordQuery, [hashedPassword, user.ID], (err) => {
                if (err) return res.status(500).json({ message: "Error updating password" });

                res.status(200).json({ message: "Password reset successful" });
            });
        });
    });
};

export const logout = (req, res) => {
  // In a stateless JWT setup, there's no session to destroy on the server
  // You might want to implement token blacklisting in a production app
  
  res.status(200).json({ message: 'Logout successful' });
};