/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

// pages/Enter/ForgotPassword/ForgotPassword.jsx

import React, { useState } from 'react';
import { FaEnvelope, FaRedo, FaArrowLeft } from 'react-icons/fa';
import { Snackbar, Alert, Slide } from '@mui/material'; // Import Material-UI components
import { mailValidationSchema } from '../validationSchema';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false); // State for resend success message
  const [snackbarOpen, setSnackbarOpen] = useState(false); // State to control Snackbar visibility

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
  
    // Validate form using Yup schema
    mailValidationSchema
      .validate({ email }, { abortEarly: false }) // Validate only the email field
      .then(async () => {
        setIsLoading(true);
        setResendSuccess(false); // Reset resend success message
  
        try {
          const response = await fetch('http://localhost:8082/api/auth/owner-forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          console.log(response)
          if (response.ok) {
            setIsSubmitted(true);
            setResendSuccess(true); // Show success message after resend
            setSnackbarOpen(true); // Open Snackbar
          } else {
            alert('Email not found or failed to send reset link');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
        } finally {
          setIsLoading(false);
        }
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
  

  const handleResendEmail = (e) => {
    e.preventDefault(); // Prevent default button behavior
    handleSubmit(e); // Reuse the handleSubmit function to resend the email
  };

  const handleBackToLogin = () => {
    window.location.href = '/owner-login';
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return; // Don't close Snackbar if the user clicks away
    }
    setSnackbarOpen(false); // Close Snackbar
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-image-section">
          <div className="image-wrapper">
            {!isSubmitted ? (
              <>
                <h1 style={{ color: 'black' }}>Forgot Password?</h1>
                <p style={{ color: 'black' }}>Don&apos;t worry! It happens. Please enter the email associated with your account.</p>
              </>
            ) : (
              <>
                <h1 style={{ color: 'black' }}>Check Your Email</h1>
                <p style={{ color: 'black' }}>We&apos;ve sent you instructions to reset your password</p>
              </>
            )}
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-wrapper">
            {!isSubmitted ? (
              <>
                <h2>Password Recovery</h2>
                <p className="text-muted">
                  Enter your email and we&apos;ll send you instructions to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <span className="input-icon">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                  </div>

                  <button
                    type="submit"
                    className={`login-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <div className="signup-link">
                    Remember your password? <a href="/owner-login">Back to Login</a>
                  </div>
                </form>
              </>
            ) : (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h2 style={{ color: 'black' }}>Check Your Inbox</h2>
                <div className="email-message">
                  <p className="primary-text" style={{ color: 'black' }}>
                    We sent a password reset link to:
                  </p>
                  <p className="email-address" style={{ color: '#23b893' }}>
                    {email}
                  </p>
                  <p className="secondary-text" style={{ color: 'black' }}>
                    Click the link in the email to reset your password.
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>

                <div className="action-buttons">
                  <button
                    className="resend-btn"
                    onClick={handleResendEmail}
                    disabled={isLoading} // Disable button while loading
                  >
                    <FaRedo className="button-icon" />
                    {isLoading ? 'Resending...' : 'Resend Email'}
                  </button>

                  <button
                    className="back-to-login"
                    onClick={handleBackToLogin}
                  >
                    <FaArrowLeft className="button-icon" />
                    Back to Login
                  </button>
                </div>

                <div className="help-text">
                  <p style={{ color: 'black' }}>
                    Didn&apos;t receive the email? Check your spam filter, or
                  </p>
                  <a href="/support" className="support-link">
                    Contact Support
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snackbar for Resend Success Message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000} // Snackbar will close after 6 seconds
        onClose={handleCloseSnackbar}
        TransitionComponent={Slide} // Slide animation
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Position at the top-right corner
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success" // Green success alert
          sx={{
            backgroundColor: '#4caf50', // Green background
            color: '#ffffff', // White text
            fontWeight: 'bold', // Bold text
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // Subtle shadow
          }}
        >
          Email resent successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ForgotPassword;