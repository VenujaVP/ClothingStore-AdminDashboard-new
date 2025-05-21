/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { loginValidationSchema } from '../validationSchema';
import { FaEnvelope, FaLock, FaGoogle, FaFacebookF, FaLinkedinIn, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Snackbar, Alert, Slide } from "@mui/material";
import { GoogleLogin } from '@react-oauth/google';


const Login = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false); // For managing the Snackbar visibility
  const [message, setMessage] = useState(''); // To store the message displayed in the Snackbar
  const [alertSeverity, setAlertSeverity] = useState(''); // To handle success or error severity
  const [showPassword, setShowPassword] = useState(false); // For toggling password visibility

  const handleClose = () => {
    setOpen(false); // Close the Snackbar
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  function SlideTransition(props) {
    return <Slide {...props} direction="left" />;
  }
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    loginValidationSchema
      .validate(formData)
      .then(() => {
        axios.post('http://localhost:8082/api/auth/owner-employee-login', formData, {
          withCredentials: true,
        })
          .then(res => {
            if (res.data && res.data.Status === "Success") {
              console.log("JWT Token Received:", res.data.token);
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("userRole", res.data.role); // Store role in localStorage
              console.log('Login successful:', res.data);
              
              // Simplified role-based navigation - only admin and onlineorderchecker
              switch(res.data.role) {
                case 'admin':
                  navigate('/products/list');
                  break;
                case 'onlineorderchecker':
                  navigate('/onlineorderchecker-dashboard');
                  break;
                default:
                  // This shouldn't happen due to backend restriction, but just in case
                  setMessage('Unauthorized role. Please contact administrator.');
                  setAlertSeverity("error");
                  setOpen(true);
                  break;
              }
            } else {
              console.error('Login error:', res);
              setMessage(res.data.Error || 'Invalid login credentials. Please try again.');
              setAlertSeverity("error");
              setOpen(true);
            }
          })
          .catch(err => {
            if (err.response) {
              console.error('Server Error:', err.response.data);
              setMessage(err.response.data.Error || err.response.data.message || 'Server error. Please try again.');
              setAlertSeverity('error'); 
              setOpen(true);
            } else {
              console.error('API Error:', err);
              setMessage('An error occurred. Please try again.');
              setAlertSeverity('error');
              setOpen(true);
            }
          });
      })
      .catch(err => {
        const validationErrors = {};
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
        console.error('Validation Error:', validationErrors);
      });
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Image Section */}
        <div className="login-image-section">
          <div className="image-wrapper">
            <h1>Welcome Back!</h1>
            <p>Login to continue your journey with us</p>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="login-form-section">
          <div className="form-wrapper">
            <h2>Sign In</h2>
            <p className="text-muted">Please sign in to continue</p>

            {/* <div className="social-login">
                <GoogleLogin
                  className="social-btn google"
                  // onClick={() => googleLogin()}
                >
                </GoogleLogin>
            </div> */}

            <div className="divider">
              <span>or continue with</span>
            </div>

            <form onSubmit={handleSubmit}>
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
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div className="password-toggle" onClick={togglePasswordVisibility}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              <div className="remember-forgot">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/owner-forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" className="login-btn">
                Sign In
              </button>
            </form>

            {/* <p className="signup-link">
              Don&apos;t have an account? <Link to="/owner-register">Sign Up</Link>
            </p> */}
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

export default Login;
