/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState } from 'react';
import './AddEmployee.css';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUserTag, FaIdCard, FaSpinner, FaRandom } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import withAuth from '../withAuth';
import {addEmployeeValidationSchema} from '../inputValidations';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Define inline styles to avoid class conflicts
const styles = {
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  inputIcon: {
    position: 'absolute',
    left: '15px',
    color: '#23b893',
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    zIndex: 1,
    pointerEvents: 'none',
    backgroundColor: 'transparent',
  },
  input: {
    width: '100%',
    padding: '12px 15px 12px 50px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
  },
  usernameInput: {
    width: '100%',
    padding: '12px 15px 12px 50px',
    paddingRight: '100px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
  },
  generateBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#23b893',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '12px',
    display: 'block',
    position: 'absolute',
    bottom: '-18px',
    left: '2px',
    width: '100%',
  }
};

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    employee_uname: '',
    email: '',
    f_name: '',
    l_name: '',
    password: '',
    com_password: '',
    role: '',
    phone_1: '',
    phone_2: ''
  });

  const [errors, setErrors] = useState({});
  const [alertSeverity, setAlertSeverity] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Generate a random username based on first name, last name, and random characters
  const generateUsername = () => {
    const { f_name, l_name } = formData;
    let username = '';
    
    // Use first name and last name if available
    if (f_name && l_name) {
      // Take first 3 characters of first name (or less if name is shorter)
      const firstPart = f_name.substring(0, Math.min(3, f_name.length)).toLowerCase();
      // Take first 3 characters of last name (or less if name is shorter)
      const lastPart = l_name.substring(0, Math.min(3, l_name.length)).toLowerCase();
      
      // Combine with random numbers
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      username = `${firstPart}${lastPart}${randomNum}`;
    } else {
      // Generate a completely random username if names aren't provided
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const randomChars = Array(6).fill().map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      username = `emp${randomChars}${randomNum}`;
    }
    
    // Update the form data with the generated username
    setFormData(prevState => ({
      ...prevState,
      employee_uname: username
    }));
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      employee_uname: '',
      email: '',
      f_name: '',
      l_name: '',
      password: '',
      com_password: '',
      phone_1: '',
      phone_2: '',
      role: ''
    });
    
    // Clear errors
    setErrors({});
    
    // Navigate back to employees list
    navigate('/employees');
  };

  const resetForm = () => {
    setFormData({
      employee_uname: '',
      email: '',
      f_name: '',
      l_name: '',
      password: '',
      com_password: '',
      phone_1: '',
      phone_2: '',
      role: ''
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Create a validation object that conditionally checks phone_2 only if it's not empty
    const dataToValidate = {...formData};
    if (!dataToValidate.phone_2) {
      delete dataToValidate.phone_2; // Remove from validation if empty
    }

    // Validate the form data
    addEmployeeValidationSchema
      .validate(dataToValidate, { abortEarly: false })
      .then(() => {
        // Send data to the backend
        axios.post('http://localhost:8082/api/owner/owner-create-employee', formData)
          .then(res => {
            setIsLoading(false);
            if (res.data && res.data.Status === "Success") {
              console.log('Employee added successfully:', res.data);
              resetForm();
              setAlertSeverity("success");
              
              // Customize message based on role
              if (formData.role === 'onlineorderchecker') {
                setMessage('Employee added successfully and login details sent to their email!');
              } else {
                setMessage('Employee added successfully!');
              }
              
              setOpen(true);
              // No navigation, just reset the form
            } else {
              console.error('Error adding employee:', res);
              setAlertSeverity("error");
              setMessage(res.data.message || 'An error occurred while adding employee');
              setOpen(true);
            }
          })
          .catch(err => {
            setIsLoading(false);
            console.error('Error:', err);
            setAlertSeverity('error');
            setMessage(err.response?.data?.message || 'Server error. Please try again.');
            setOpen(true);
          });
      })
      .catch(err => {
        setIsLoading(false);
        const validationErrors = {};
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message; // Collect validation errors
        });
        setErrors(validationErrors); // Set errors to state for display
        console.error('Validation Error:', validationErrors);
      });
  };

  return (
    <div className="add-employee-container">
      <div className="add-employee-card">
        <h2>Add New Employee</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Employee User Name</label>
              <div style={styles.inputGroup}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  type="text"
                  name="employee_uname"
                  placeholder="Enter Employee User Name"
                  value={formData.employee_uname}
                  onChange={handleChange}
                  required
                  style={styles.usernameInput}
                />
                <button 
                  type="button" 
                  style={styles.generateBtn}
                  onClick={generateUsername}
                  title="Generate Username"
                >
                  Generate
                </button>
                {errors.employee_uname && <span style={styles.errorText}>{errors.employee_uname}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <div style={styles.inputGroup}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* First and Last Name */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <div style={styles.inputGroup}>
                <FaUser style={styles.inputIcon} />
                <input
                  type="text"
                  name="f_name"
                  placeholder="Enter first name"
                  value={formData.f_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.f_name && <span style={styles.errorText}>{errors.f_name}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <div style={styles.inputGroup}>
                <FaUser style={styles.inputIcon} />
                <input
                  type="text"
                  name="l_name"
                  placeholder="Enter last name"
                  value={formData.l_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.l_name && <span style={styles.errorText}>{errors.l_name}</span>}
              </div>
            </div>
          </div>

          {/* Password fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <div style={styles.inputGroup}>
                <FaLock style={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.password && <span style={styles.errorText}>{errors.password}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div style={styles.inputGroup}>
                <FaLock style={styles.inputIcon} />
                <input
                  type="password"
                  name="com_password"
                  placeholder="Re-enter password"
                  value={formData.com_password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.com_password && <span style={styles.errorText}>{errors.com_password}</span>}
              </div>
            </div>
          </div>

          {/* Role selection */}
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <div style={styles.inputGroup}>
                <FaUserTag style={styles.inputIcon} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select role</option>
                  <option value="employee">Employee</option>
                  <option value="cashier">Cashier</option>
                  <option value="onlineorderchecker">Online Order Checker</option>
                </select>
                {errors.role && <span style={styles.errorText}>{errors.role}</span>}
              </div>
            </div>
          </div>

          {/* Phone numbers */}
          <div className="form-row">
            <div className="form-group">
              <label>Primary Phone</label>
              <div style={styles.inputGroup}>
                <FaPhone style={styles.inputIcon} />
                <input
                  type="tel"
                  name="phone_1"
                  placeholder="Enter primary phone"
                  value={formData.phone_1}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.phone_1 && <span style={styles.errorText}>{errors.phone_1}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Secondary Phone (Optional)</label>
              <div style={styles.inputGroup}>
                <FaPhone style={styles.inputIcon} />
                <input
                  type="tel"
                  name="phone_2"
                  placeholder="Enter secondary phone (optional)"
                  value={formData.phone_2}
                  onChange={handleChange}
                  style={styles.input}
                />
                {errors.phone_2 && <span style={styles.errorText}>{errors.phone_2}</span>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel} disabled={isLoading}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinner-icon" /> 
                  Processing...
                </>
              ) : (
                'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Alert message */}
      <Snackbar 
        open={open} 
        autoHideDuration={6000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

const AuthenticatedAddEmployee = withAuth(AddEmployee);
export default AuthenticatedAddEmployee;