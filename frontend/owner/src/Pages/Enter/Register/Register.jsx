/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

// pages/Enter/Register/Register.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import { useNavigate, Link } from 'react-router-dom';
import { registerValidationSchema } from '../validationSchema';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaFacebookF, FaLinkedinIn, FaPhone } from 'react-icons/fa';
import { Snackbar, Alert, Slide } from "@mui/material";
import { GoogleOAuthProvider, googleLogout, useGoogleLogin , GoogleLogin} from '@react-oauth/google';

const Register = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false); // For managing the Snackbar visibility
  const [message, setMessage] = useState(''); // To store the message displayed in the Snackbar
  const [alertSeverity, setAlertSeverity] = useState(''); // To handle success or error severity

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };


  const handleClose = () => {
    setOpen(false); // Close the Snackbar
  };
  function SlideTransition(props) {
    return <Slide {...props} direction="left" />;
  }
  
  const handleSubmit = (event) => {
    event.preventDefault();

    registerValidationSchema
      .validate(formData, { abortEarly: false })
      .then(() => {
        axios.post('http://localhost:8082/api/auth/owner-register', formData)
          .then(res => {
            if (res.status === 201) {
              console.log('Registration successful:', res.data);
              setMessage('Registration successful!');
              setAlertSeverity('success'); // Show success
              setOpen(true);
              navigate('/owner-login');
            } else {
              console.error('Unexpected response:', res);
              setMessage('Registration failed. Please try again.');
              setAlertSeverity('error'); // Show error
              setOpen(true);
            }
          })
          .catch(err => {
            if (err.response) {
              console.error('Server Error:', err.response.data);
              setMessage(err.response.data.message || 'Server error. Please try again.');
              setAlertSeverity('error'); // Show error
              setOpen(true);
            } else {
              console.error('API Error:', err);
              setMessage('An error occurred. Please try again.');
              setAlertSeverity('error'); // Show error
              setOpen(true);
            }
          });
      })
      .catch(err => {
        const validationErrors = {};
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message; // Collect validation errors
        });
        setErrors(validationErrors); // Set errors to state for display
        console.error('Validation Error:', validationErrors);
      });
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (response) => {
      const { credential } = response; // Extract the Google credential (JWT)
      console.log(response)
      axios
        .post('http://localhost:8082/auth/google-login', { token: credential })
        .then((res) => {
          setMessage('Login successful with Google!');
          setAlertSeverity('success');
          setOpen(true);
          navigate('/dashboard'); // Redirect user after successful login
        })
        .catch((err) => {
          setMessage('Google login failed. Try again.');
          setAlertSeverity('error');
          setOpen(true);
        });
    },
    onError: () => {
      setMessage('Google login failed. Try again.');
      setAlertSeverity('error');
      setOpen(true);
    }
  });

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Side - Form Section */}
        <div className="register-form-section">
          <div className="form-wrapper">
            <h2>Create Account</h2>
            <p className="text-muted">Get started with your free account</p>

            <div className="social-login">
                <GoogleLogin
                  className="social-btn google"
                  onClick={() => googleLogin()}
                >
                </GoogleLogin>
            </div>

            <div className="divider">
              <span>or register with email</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <div className="input-icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
              <div className="input-group">
                <div className="input-icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaPhone />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
              </div>

              <div className="terms-check">
                <label>
                  <input type="checkbox" required />
                  <span>I agree to the Terms & Conditions</span>
                </label>
              </div>

              <button type="submit" className="register-btn">
                Create Account
              </button>
            </form>

            <p className="login-link">
              Already have an account? <Link to="/owner-login">Sign In</Link>
            </p>
          </div>
        </div>

        {/* Right Side - Image Section */}
        <div className="register-image-section">
          <div className="image-wrapper">
            <h1>Join Our Community</h1>
            <p>Start your journey with us today</p>
          </div>
        </div>
      </div>
      <Snackbar
        open={open}
        autoHideDuration={6000} // Automatically hide after 6 seconds
        onClose={handleClose} // Close the Snackbar
        TransitionComponent={SlideTransition} // Slide transition from left
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Top-right position
      >
      <Alert 
        onClose={handleClose} 
        severity="error" 
        sx={{
          backgroundColor: '#f44336', // Bright red background
          color: '#ffffff', // White text for contrast
          fontWeight: 'bold', // Bold text for better visibility
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // Add a subtle shadow for better visibility
        }}
      >
        {message}
      </Alert>
      </Snackbar>
    </div>
  );
};

export default Register;
