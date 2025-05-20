/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { ResetPasswordValidationSchema } from '../validationSchema'; // Import schema from the appropriate path
import axios from 'axios';
import './SetNewPassword.css';

const SetNewPassword = () => {
  const { resetToken } = useParams(); // Extract token from URL
  const navigate = useNavigate();

  // Initial form data state
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState({});
  
  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success/Error messages
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);

  // Form submission handler
  const handleSubmit = (event) => {
    event.preventDefault();

    ResetPasswordValidationSchema
      .validate(formData, { abortEarly: false })
      .then(() => {
        setIsSubmitting(true);

        // Make API call to reset password
        axios.post('http://localhost:8082/api/auth/customer-reset-password', {
          resetToken,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword,
        })
          .then((res) => {
            if (res.status === 200) {
              setResetSuccess(true);
            } else {
              setResetError(res.data.message || 'An error occurred');
            }
          })
          .catch((err) => {
            if (err.response) {
              console.error('Server Error:', err.response.data);
              setResetError(err.response.data.message || 'Failed to reset password');
            } else {
              console.error('API Error:', err);
              setResetError('An error occurred. Please try again.');
            }
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      })
      .catch((err) => {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message; // Collect validation errors
        });
        setErrors(validationErrors); // Set errors to state for display
        console.error('Validation Error:', validationErrors);
      });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the error for the field being updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const ValidationIcon = ({ isValid }) => (
    <span className={`validation-icon ${isValid ? 'valid' : 'invalid'}`}>
      {isValid ? <FaCheckCircle /> : <FaTimesCircle />}
    </span>
  );

  // Reset success page
  if (resetSuccess) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-image-section">
            <div className="image-wrapper">
              <h1>Password Reset Successful!</h1>
              <p>Your password has been successfully updated.</p>
            </div>
          </div>
          <div className="login-form-section">
            <div className="form-wrapper success-wrapper">
              <div className="success-icon">✓</div>
              <h2>All Done!</h2>
              <p>Your password has been reset successfully. You can now log in with your new password.</p>
              <button
                className="login-btn"
                onClick={() => navigate('/user-login')}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Reset Password page
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-image-section">
          <div className="image-wrapper">
            <h1>Reset Password</h1>
            <p>Create a strong password for your account</p>
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-wrapper">
            <h2>Create New Password</h2>
            <p className="text-muted">
              Please create a secure password that meets all the requirements below.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type={showPassword.password ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}

              <div className="input-group">
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  name="confirmNewPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmNewPassword && <div className="error-message">{errors.confirmNewPassword}</div>}

              <div className="password-validations">
                <div className={`validation-item ${formData.newPassword.length >= 8 ? 'valid' : ''}`}>
                  <ValidationIcon isValid={formData.newPassword.length >= 8} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`validation-item ${/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}`}>
                  <ValidationIcon isValid={/[A-Z]/.test(formData.newPassword)} />
                  <span>One uppercase letter</span>
                </div>
                <div className={`validation-item ${/[a-z]/.test(formData.newPassword) ? 'valid' : ''}`}>
                  <ValidationIcon isValid={/[a-z]/.test(formData.newPassword)} />
                  <span>One lowercase letter</span>
                </div>
                <div className={`validation-item ${/[0-9]/.test(formData.newPassword) ? 'valid' : ''}`}>
                  <ValidationIcon isValid={/[0-9]/.test(formData.newPassword)} />
                  <span>One number</span>
                </div>
                <div className={`validation-item ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? 'valid' : ''}`}>
                  <ValidationIcon isValid={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)} />
                  <span>One special character</span>
                </div>
                <div className={`validation-item ${formData.newPassword && formData.confirmNewPassword && formData.newPassword === formData.confirmNewPassword ? 'valid' : ''}`}>
                  <ValidationIcon isValid={formData.newPassword === formData.confirmNewPassword && formData.newPassword && formData.confirmNewPassword} />
                  <span>Passwords match</span>
                </div>
              </div>

              {resetError && (
                <div className="error-message">
                  <p>{resetError}</p>
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="signup-link">
                Remember your password? <a href="/user-login">Back to Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetNewPassword;