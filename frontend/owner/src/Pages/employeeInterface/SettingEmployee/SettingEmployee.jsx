// Pages/employeeInterface/SettingEmployee/SettingEmployee.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SettingEmployee.css';

// Icons - using react-icons
import { FaUser, FaLock, FaEdit, FaSignOutAlt, FaEnvelope, FaEye, FaEyeSlash, FaSync, FaUserCog } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';

const SettingEmployee = ({ userId }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchRetries, setFetchRetries] = useState(0);
  
  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [emailStep, setEmailStep] = useState(1);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Modal refs for preventing outside clicks from closing
  const profileModalRef = useRef(null);
  const passwordModalRef = useRef(null);
  const emailModalRef = useRef(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNum1: '',
    phoneNum2: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [emailForm, setEmailForm] = useState({
    currentEmail: '',
    newEmail: '',
    currentEmailCode: '',
    newEmailCode: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
    hasSpecial: false,
    passwordsMatch: false
  });
  
  // Fetch user profile with retry mechanism
  const fetchUserProfile = async (retry = false) => {
    if (retry) {
      setFetchRetries(prev => prev + 1);
    } else {
      setLoading(true);
      setError(null); // Clear any existing errors
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/owner-login');
        return;
      }
      
      const response = await axios.get(`http://localhost:8082/api/employee/profile?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data) {
        setUserProfile(response.data);
        setProfileForm({
          firstName: response.data.F_NAME || '',
          lastName: response.data.L_NAME || '',
          phoneNum1: response.data.PHONE_NUM1 || '',
          phoneNum2: response.data.PHONE_NUM2 || ''
        });
        setEmailForm({
          currentEmail: response.data.EMAIL || '',
          newEmail: '',
          currentEmailCode: '',
          newEmailCode: ''
        });
        setError(null);
      } else {
        throw new Error("Received empty response");
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Don't set global error - create a fallback profile instead
      setUserProfile({
        F_NAME: 'Profile',
        L_NAME: 'Unavailable',
        EMAIL: 'Contact admin',
        PHONE_NUM1: '',
        PHONE_NUM2: ''
      });
      
      // Store the error for modal display only
      const errorMessage = err.response?.data?.message || 'Failed to load profile data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
    
    // Handle click outside modal to close
    const handleClickOutside = (event) => {
      if (profileModalRef.current && !profileModalRef.current.contains(event.target)) {
        setShowProfileModal(false);
      }
      if (passwordModalRef.current && !passwordModalRef.current.contains(event.target)) {
        resetPasswordModal();
      }
      if (emailModalRef.current && !emailModalRef.current.contains(event.target)) {
        resetEmailModal();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userId]);
  
  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => {
      const newForm = {
        ...prev,
        [name]: value
      };
      
      // Check passwords match when either newPassword or confirmPassword changes
      if (name === 'newPassword' || name === 'confirmPassword') {
        validatePassword(name === 'newPassword' ? value : newForm.newPassword, 
                       name === 'confirmPassword' ? value : newForm.confirmPassword);
      }
      
      return newForm;
    });
  };
  
  // Handle email form change 
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate password
  const validatePassword = (password, confirmPassword) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password !== ''
    });
  };
  
  // Check if password meets all criteria
  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };
  
  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!profileForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!profileForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profileForm.phoneNum1.trim()) errors.phoneNum1 = 'Primary phone is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:8082/api/employee/profile/update', {
        userId,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNum1: profileForm.phoneNum1,
        phoneNum2: profileForm.phoneNum2
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the user profile state with the new lastName
      setUserProfile(prev => ({
        ...prev,
        F_NAME: profileForm.firstName,
        L_NAME: profileForm.lastName,
        PHONE_NUM1: profileForm.phoneNum1,
        PHONE_NUM2: profileForm.phoneNum2
      }));
      
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        setShowProfileModal(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setFormErrors({ general: err.response?.data?.message || 'Failed to update profile. Please try again.' });
    }
  };
  
  // Verify current password
  const handleVerifyCurrentPassword = async (e) => {
    e.preventDefault();
    
    // Validate current password
    if (!passwordForm.currentPassword) {
      setFormErrors({ currentPassword: 'Current password is required' });
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8082/api/employee/profile/verify-current-password', {
        userId,
        currentPassword: passwordForm.currentPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Move to next step
      setPasswordStep(2);
    } catch (err) {
      console.error('Error verifying password:', err);
      setFormErrors({ 
        currentPassword: err.response?.data?.message || 'Current password is incorrect' 
      });
    }
  };
  
  // Handle new password submission
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate new password
    const errors = {};
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!isPasswordValid()) {
      if (!passwordValidation.passwordsMatch) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        errors.newPassword = 'Password does not meet all requirements';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Send verification code
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8082/api/employee/profile/initiate-password-change', {
        userId,
        currentEmail: userProfile.EMAIL || emailForm.currentEmail
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPasswordStep(3);
      setSuccessMessage('Verification code sent to your email');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error initiating password change:', err);
      setFormErrors({ 
        general: err.response?.data?.message || 'Failed to send verification code. Please try again.' 
      });
    }
  };
  
  // Complete password change with verification code
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate verification code
    if (!passwordForm.verificationCode.trim()) {
      setFormErrors({ verificationCode: 'Verification code is required' });
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8082/api/employee/profile/verify-and-update-password', { 
        userId,
        verificationCode: passwordForm.verificationCode,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Password updated successfully');
      
      // Clear success message and close modal after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        resetPasswordModal();
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setFormErrors({ 
        verificationCode: err.response?.data?.message || 'Invalid or expired verification code' 
      });
    }
  };
  
  // Initiate email change - step 1: verify current email
  const handleInitiateEmailChange = async (e) => {
    e.preventDefault();
    
    // Validate current email
    if (!emailForm.currentEmail.trim()) {
      setFormErrors({ currentEmail: 'Current email is required' });
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8082/api/employee/profile/initiate-email-change', {
        userId,
        currentEmail: emailForm.currentEmail
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setEmailStep(2);
      setSuccessMessage('Verification code sent to your current email');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error initiating email change:', err);
      setFormErrors({ 
        currentEmail: err.response?.data?.message || 'Email verification failed' 
      });
    }
  };
  
  // Verify current email and proceed to new email - step 2
  const handleVerifyCurrentAndNewEmail = async (e) => {
    e.preventDefault();
    
    // Validate verification code and new email
    const errors = {};
    if (!emailForm.currentEmailCode.trim()) {
      errors.currentEmailCode = 'Verification code is required';
    }
    
    if (!emailForm.newEmail.trim()) {
      errors.newEmail = 'New email address is required';
    } else if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    } else if (emailForm.newEmail === emailForm.currentEmail) {
      errors.newEmail = 'New email must be different from current email';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8082/api/employee/profile/verify-current-email', {
        userId,
        verificationCode: emailForm.currentEmailCode,
        newEmail: emailForm.newEmail
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setEmailStep(3);
      setSuccessMessage(`Verification code sent to ${emailForm.newEmail}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error verifying current email:', err);
      setFormErrors({ 
        currentEmailCode: err.response?.data?.message || 'Invalid verification code' 
      });
    }
  };
  
  // Complete email change - step 3
  const handleCompleteEmailChange = async (e) => {
    e.preventDefault();
    
    // Validate new email verification code
    if (!emailForm.newEmailCode.trim()) {
      setFormErrors({ newEmailCode: 'Verification code is required' });
      return;
    }
    
    try {
      setFormErrors({});
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8082/api/employee/profile/complete-email-change', {
        userId,
        verificationCode: emailForm.newEmailCode
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update user profile with new email
      setUserProfile(prev => ({
        ...prev,
        EMAIL: response.data.newEmail
      }));
      
      setEmailForm(prev => ({
        ...prev,
        currentEmail: response.data.newEmail
      }));
      
      setSuccessMessage('Email address updated successfully');
      
      // Clear success message and close modal after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        resetEmailModal();
      }, 3000);
    } catch (err) {
      console.error('Error completing email change:', err);
      setFormErrors({ 
        newEmailCode: err.response?.data?.message || 'Invalid verification code' 
      });
    }
  };
  
  // Reset password modal
  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordStep(1);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      verificationCode: ''
    });
    setFormErrors({});
    setSuccessMessage('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };
  
  // Reset email modal
  const resetEmailModal = () => {
    setShowEmailModal(false);
    setEmailStep(1);
    setEmailForm(prev => ({
      ...prev,
      newEmail: '',
      currentEmailCode: '',
      newEmailCode: ''
    }));
    setFormErrors({});
    setSuccessMessage('');
  };
  
  // Handle sign out with proper server-side token invalidation
  const handleSignOut = async () => {
    try {
      // 1. Get the token from localStorage for the request header
      const token = localStorage.getItem('token');
      
      // 2. Call the server logout endpoint to invalidate the token
      await axios.post('http://localhost:8082/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true // Important for cookie operations
      });
      
      console.log("Server-side logout successful");
    } catch (error) {
      console.error('Error during server logout:', error);
      // Continue with client-side logout even if server request fails
    } finally {
      // 3. Clear all authentication data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      
      // 4. Clear all cookies including auth cookies
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.split("=");
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // 5. Redirect to login page
      window.location.href = '/owner-login';
    }
  };
  
  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Employee Settings</h2>
        <p>Manage your account settings and preferences</p>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your account information...</p>
        </div>
      )}
      
      {/* Main Settings Cards with row-based layout in specific order */}
      {!loading && (
        <div className="settings-cards-container">
          {/* Profile Information - First row */}
          <div className="settings-card" onClick={() => setShowProfileModal(true)}>
            <div className="settings-card-icon">
              <FaUser />
            </div>
            <div className="settings-card-content">
              <h3>Profile Information</h3>
              <p>Update your personal details and contact information</p>
              <div className="settings-card-summary">
                <p><strong>{userProfile?.F_NAME} {userProfile?.L_NAME}</strong></p>
                <p>{userProfile?.PHONE_NUM1 || 'No phone number'}</p>
              </div>
            </div>
          </div>
          
          {/* Email Settings - Second row */}
          <div className="settings-card" onClick={() => setShowEmailModal(true)}>
            <div className="settings-card-icon">
              <FaEnvelope />
            </div>
            <div className="settings-card-content">
              <h3>Email Settings</h3>
              <p>Update your email address for account notifications</p>
            </div>
          </div>
          
          {/* Password Update - Third row */}
          <div className="settings-card" onClick={() => setShowPasswordModal(true)}>
            <div className="settings-card-icon">
              <FaLock />
            </div>
            <div className="settings-card-content">
              <h3>Password Update</h3>
              <p>Change your account password and security settings</p>
            </div>
          </div>
          
          {/* Sign Out - Fourth row */}
          <div className="settings-card signout-card" onClick={handleSignOut}>
            <div className="settings-card-icon">
              <FaSignOutAlt />
            </div>
            <div className="settings-card-content">
              <h3>Sign Out</h3>
              <p>Log out of your account and end your current session</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Update Modal - Improved styling */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={profileModalRef}>
            <div className="modal-header">
              <h3 className="modal-title">Update Profile</h3>
              <button 
                className="close-button"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close"
              >
                <AiOutlineClose />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Modal loading state */}
              {loading && (
                <div className="modal-loading">
                  <div className="loading-spinner-small"></div>
                  <p>Loading profile data...</p>
                </div>
              )}
              
              {/* Modal error state */}
              {!loading && error && (
                <div className="modal-error">
                  <p>Failed to load profile data. Please try again.</p>
                  <button 
                    className="action-button primary-button"
                    onClick={() => fetchUserProfile()}
                  >
                    <FaSync /> Retry
                  </button>
                </div>
              )}
              
              {/* Modal content */}
              {!loading && !error && (
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-control"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      placeholder="Enter your first name"
                      required
                    />
                    {formErrors.firstName && (
                      <div className="error-message">{formErrors.firstName}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-control"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      placeholder="Enter your last name"
                      required
                    />
                    {formErrors.lastName && (
                      <div className="error-message">{formErrors.lastName}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phoneNum1">Primary Phone</label>
                    <input
                      type="text"
                      id="phoneNum1"
                      name="phoneNum1"
                      className="form-control"
                      value={profileForm.phoneNum1}
                      onChange={handleProfileChange}
                      placeholder="Enter your primary phone number"
                      required
                    />
                    {formErrors.phoneNum1 && (
                      <div className="error-message">{formErrors.phoneNum1}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phoneNum2">Secondary Phone (Optional)</label>
                    <input
                      type="text"
                      id="phoneNum2"
                      name="phoneNum2"
                      className="form-control"
                      value={profileForm.phoneNum2}
                      onChange={handleProfileChange}
                      placeholder="Enter your secondary phone number (optional)"
                    />
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">{successMessage}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={() => setShowProfileModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Password Change Modal - Multi-step process with improved styling */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={passwordModalRef}>
            <div className="modal-header">
              <h3 className="modal-title">
                {passwordStep === 1 ? 'Verify Current Password' : 
                 passwordStep === 2 ? 'Set New Password' : 
                 'Verify Your Email'}
              </h3>
              <button 
                className="close-button"
                onClick={resetPasswordModal}
                aria-label="Close"
              >
                <AiOutlineClose />
              </button>
            </div>
            
            <div className="modal-body">
              {passwordStep === 1 && (
                <form onSubmit={handleVerifyCurrentPassword}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-container">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        className="form-control"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                      />
                      <button 
                        type="button"
                        className="password-toggle-button"
                        onClick={() => togglePasswordVisibility('current')}
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {formErrors.currentPassword && (
                      <div className="error-message">{formErrors.currentPassword}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={resetPasswordModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Verify Password
                    </button>
                  </div>
                </form>
              )}
              
              {passwordStep === 2 && (
                <form onSubmit={handleNewPasswordSubmit}>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-container">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        className="form-control"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button 
                        type="button"
                        className="password-toggle-button"
                        onClick={() => togglePasswordVisibility('new')}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    
                    <div className="password-requirements">
                      <p>Password must include:</p>
                      <ul>
                        <li className={passwordValidation.minLength ? 'valid' : 'invalid'}>
                          At least 8 characters
                        </li>
                        <li className={passwordValidation.hasUppercase ? 'valid' : 'invalid'}>
                          At least one uppercase letter (A-Z)
                        </li>
                        <li className={passwordValidation.hasNumber ? 'valid' : 'invalid'}>
                          At least one number (0-9)
                        </li>
                        <li className={passwordValidation.hasSpecial ? 'valid' : 'invalid'}>
                          At least one special character (!@#$%^&*...)
                        </li>
                      </ul>
                    </div>
                    
                    {formErrors.newPassword && (
                      <div className="error-message">{formErrors.newPassword}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="form-control"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <button 
                        type="button"
                        className="password-toggle-button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    
                    {/* Password match status */}
                    {passwordForm.confirmPassword && (
                      <div className={passwordValidation.passwordsMatch ? 'passwords-match match' : 'passwords-match mismatch'}>
                        {passwordValidation.passwordsMatch ? 'Passwords match ✓' : 'Passwords do not match ✗'}
                      </div>
                    )}
                    
                    {formErrors.confirmPassword && (
                      <div className="error-message">{formErrors.confirmPassword}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={() => setPasswordStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                      disabled={!isPasswordValid()}
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}
              
              {passwordStep === 3 && (
                <form onSubmit={handlePasswordUpdate}>
                  <div className="form-info">
                    <p>A verification code has been sent to your email address ({userProfile?.EMAIL || "your registered email"}).</p>
                    <p>Please enter the code below to complete your password change.</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="verificationCode">Verification Code</label>
                    <input
                      type="text"
                      id="verificationCode"
                      name="verificationCode"
                      className="form-control"
                      value={passwordForm.verificationCode}
                      onChange={handlePasswordChange}
                      placeholder="Enter the code sent to your email"
                    />
                    {formErrors.verificationCode && (
                      <div className="error-message">{formErrors.verificationCode}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">{successMessage}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={() => setPasswordStep(2)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Email Change Modal - Multi-step process with improved styling */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={emailModalRef}>
            <div className="modal-header">
              <h3 className="modal-title">
                {emailStep === 1 ? 'Verify Current Email' : 
                 emailStep === 2 ? 'Enter New Email' : 
                 'Verify New Email'}
              </h3>
              <button 
                className="close-button"
                onClick={resetEmailModal}
                aria-label="Close"
              >
                <AiOutlineClose />
              </button>
            </div>
            
            <div className="modal-body">
              {emailStep === 1 && (
                <form onSubmit={handleInitiateEmailChange}>
                  <div className="form-group">
                    <label htmlFor="currentEmail">Current Email</label>
                    <input
                      type="email"
                      id="currentEmail"
                      name="currentEmail"
                      className="form-control"
                      value={emailForm.currentEmail}
                      onChange={handleEmailChange}
                      placeholder="Enter your current email address"
                      readOnly={userProfile?.EMAIL ? true : false}
                    />
                    <p className="form-hint">We'll send a verification code to this email address</p>
                    {formErrors.currentEmail && (
                      <div className="error-message">{formErrors.currentEmail}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">{successMessage}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={resetEmailModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Send Verification Code
                    </button>
                  </div>
                </form>
              )}
              
              {emailStep === 2 && (
                <form onSubmit={handleVerifyCurrentAndNewEmail}>
                  <div className="form-group">
                    <label htmlFor="currentEmailCode">Verification Code</label>
                    <input
                      type="text"
                      id="currentEmailCode"
                      name="currentEmailCode"
                      className="form-control"
                      value={emailForm.currentEmailCode}
                      onChange={handleEmailChange}
                      placeholder="Enter verification code from your current email"
                    />
                    {formErrors.currentEmailCode && (
                      <div className="error-message">{formErrors.currentEmailCode}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newEmail">New Email Address</label>
                    <input
                      type="email"
                      id="newEmail"
                      name="newEmail"
                      className="form-control"
                      value={emailForm.newEmail}
                      onChange={handleEmailChange}
                      placeholder="Enter your new email address"
                    />
                    {formErrors.newEmail && (
                      <div className="error-message">{formErrors.newEmail}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">{successMessage}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={() => setEmailStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}
              
              {emailStep === 3 && (
                <form onSubmit={handleCompleteEmailChange}>
                  <div className="form-info">
                    <p>A verification code has been sent to your new email address ({emailForm.newEmail}).</p>
                    <p>Please enter the code below to complete your email change.</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newEmailCode">Verification Code</label>
                    <input
                      type="text"
                      id="newEmailCode"
                      name="newEmailCode"
                      className="form-control"
                      value={emailForm.newEmailCode}
                      onChange={handleEmailChange}
                      placeholder="Enter verification code from your new email"
                    />
                    {formErrors.newEmailCode && (
                      <div className="error-message">{formErrors.newEmailCode}</div>
                    )}
                  </div>
                  
                  {formErrors.general && (
                    <div className="error-message">{formErrors.general}</div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message">{successMessage}</div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="action-button secondary-button"
                      onClick={() => setEmailStep(2)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="action-button primary-button"
                    >
                      Update Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingEmployee;
