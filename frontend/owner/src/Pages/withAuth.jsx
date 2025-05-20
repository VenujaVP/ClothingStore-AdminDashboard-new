/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './withAuth.css';  // Add styles for login expired message

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
      axios.get('http://localhost:8082/tokenverification', { withCredentials: true })
        .then(res => {
          if (res.data.Status === "Success") {
            setIsAuthenticated(true);
            const newUserId = res.data.id;
            setUserId(newUserId);
            // localStorage.setItem('userId', newUserId);
          } else {
            setIsAuthenticated(false);
            setMessage(res.data.err || "Session expired. Please log in again.");
            localStorage.removeItem('userId');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Authentication error:", err);
          setIsAuthenticated(false);
          setMessage("An error occurred during authentication. Please try again.");
          setLoading(false);
        });
    }, []);

    if (loading) {
      return (
        <div className="loading-spinner">
          <p>Loading...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="login-now-container">
          <div className="login-now-section">
            <h3 className="login-title">Login Expired</h3>
            <p className="login-subtitle">{message}</p>
            <button className="login-button" onClick={() => navigate('/owner-login')} aria-label="Log in now">
              Log In Now
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} userId={userId} />;
  };

  // ✅ Set display name for better debugging
  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return AuthComponent;
};

export default withAuth;
