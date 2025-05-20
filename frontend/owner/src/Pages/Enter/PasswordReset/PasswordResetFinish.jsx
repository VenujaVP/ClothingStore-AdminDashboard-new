/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

//pages/Enter/PasswordReset/PasswordResetFinish.jsx

import React from 'react';
import { FaCheckCircle, FaSignInAlt } from 'react-icons/fa';
import './PasswordResetFinish.css';

const PasswordResetFinish = () => {
  const handleLoginClick = () => {
    window.location.href = '/owner-login';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-image-section">
          <div className="image-wrapper">
            <h1>Password Reset Complete</h1>
            <p>Your password has been successfully updated.</p>
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-wrapper reset-finish-wrapper">
            <div className="reset-success-icon">
              <FaCheckCircle />
            </div>

            <div className="reset-finish-content">
              <h2>Password Reset Successful!</h2>
              <div className="success-message">
                <p className="primary-message">
                  Your password has been successfully reset.
                </p>
                <p className="secondary-message">
                  You can now use your new password to log in to your account.
                </p>
              </div>

              <div className="action-buttons">
                <button 
                  className="login-btn"
                  onClick={handleLoginClick}
                >
                  <FaSignInAlt className="button-icon" />
                  Go to Login
                </button>
              </div>

              <div className="additional-info">
                <p>
                  If you didn&apos;t request this password reset or need assistance,
                  please contact our support team.
                </p>
                <a href="/support" className="support-link">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetFinish;