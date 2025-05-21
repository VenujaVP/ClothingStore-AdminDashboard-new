/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

//Account.jsx

import React, { useState, useEffect } from 'react';
import './Account.css';
import withAuth from '../../withAuth';
import { FaUser, FaShoppingCart, FaCreditCard, FaUndo, FaComment, 
         FaCog, FaTruck, FaEnvelope, FaQuestionCircle, FaBell, 
         FaHeart, FaSearch, FaSpinner, FaMoneyBillWave, 
         FaBoxOpen, FaCheck, FaExclamationCircle, 
         FaRegTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Status mapping to icons
const statusIcons = {
  'Unpaid': <FaMoneyBillWave className="status-icon unpaid" />,
  'To be Shipped': <FaBoxOpen className="status-icon to-be-shipped" />,
  'Shipped': <FaTruck className="status-icon shipped" />,
  'Delivered': <FaCheck className="status-icon delivered" />,
  'Processing': <FaSpinner className="status-icon processing spin" />,
  'Failed': <FaExclamationCircle className="status-icon failed" />,
  'Cancelled': <FaRegTimesCircle className="status-icon cancelled" />,
  'Refunded': <FaMoneyBillWave className="status-icon refunded" />
};

const Account = ({ userId }) => {
  const [orderCounts, setOrderCounts] = useState({
    'Unpaid': 0,
    'To be Shipped': 0,
    'Shipped': 0,
    'Delivered': 0,
    'Processing': 0,
    'Failed': 0,
    'Cancelled': 0,
    'Refunded': 0
  });
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch order counts on component mount
  useEffect(() => {
    fetchOrderCounts();
  }, [userId]);

  const fetchOrderCounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8082/api/user/order-status-counts/${userId}`);
      
      if (response.data.success) {
        setOrderCounts(response.data.statusCounts);
        setTotalOrders(response.data.totalCount);
      } else {
        setError('Failed to fetch order counts');
        toast.error('Failed to fetch order information');
      }
    } catch (err) {
      console.error('Error fetching order counts:', err);
      setError('An error occurred while fetching your order information');
      toast.error('Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to navigate when an icon is clicked
  const handleNavigation = (path, status = null) => {
    if (status) {
      navigate(`${path}?status=${status}`);
    } else {
      navigate(path);
    }
  };

  // Get the top 4 statuses with highest counts
  const getTopStatusCounts = () => {
    const statusEntries = Object.entries(orderCounts);
    const sortedStatuses = statusEntries.sort((a, b) => b[1] - a[1]);
    return sortedStatuses.slice(0, 4);
  };

  // Add CSS for spinning animation
  const styles = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .status-icon.spin {
      animation: spin 1s linear infinite;
    }

    .status-icon.processing { color: #9c27b0; }
    .status-icon.refunded { color: #00bcd4; }
  `;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  return (
    <div className="account-page">
      {/* Left Sidebar */}
      <div className="sidebar">
        <h2 className="sidebar-title">Account</h2>
        <nav className="sidebar-nav">
          <a href="#overview" className="nav-item active">
            <FaUser /> Overview
          </a>
          <a href="#orders" className="nav-item" onClick={() => handleNavigation('/user-order-details')}>
            <FaShoppingCart /> Orders
          </a>
          <a href="#payment" className="nav-item" onClick={() => handleNavigation('/user-payments')}>
            <FaCreditCard /> Payment
          </a>                    
          {/* <a href="#orders" className="nav-item">
            <FaShoppingCart /> Payment methods
          </a> */}
          <a href="#refund" className="nav-item" onClick={() => handleNavigation('/return-order')}>
            <FaUndo /> Refund and Return
          </a>
          <a href="#feedback" className="nav-item">
            <FaComment /> Feedback
          </a>
          <a href="#settings" className="nav-item">
            <FaCog /> Settings
          </a>
          <a href="#shipping" className="nav-item" onClick={() => handleNavigation('/user-shipping-address')}>
            <FaTruck /> Shipping Address
          </a>
          <a href="#messages" className="nav-item">
            <FaEnvelope /> Message Center
          </a>
          <a href="#help" className="nav-item" onClick={() => handleNavigation('/user-shopping-cart')}>
            <FaQuestionCircle /> Help Center
          </a>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* User Section */}
        <div className="user-section">
          <div className="user-info">
            <div className="profile-image">
              <img src="profile-placeholder.jpg" alt="Profile" />
            </div>
            <div className="user-details">
              <h2>Welcome User</h2>
              <div className="user-actions">
                <a className="action-link" onClick={() => handleNavigation('/user-wishlist')}>
                  <FaHeart /> Wish List
                </a>
                <a href="#notifications" className="action-link">
                  <FaBell /> Notifications
                </a>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="orders-section">
            <div className="orders-header">
              <h3>My Orders</h3>
              <a onClick={() => handleNavigation('/user-order-details')} className="view-all">
                View All
              </a>
            </div>
            
            {isLoading ? (
              <div className="orders-loading">
                <FaSpinner className="spinner" />
                <p>Loading order information...</p>
              </div>
            ) : error ? (
              <div className="orders-error">
                <FaExclamationCircle className="error-icon" />
                <p>{error}</p>
                <button onClick={fetchOrderCounts} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : totalOrders === 0 ? (
              <div className="no-orders">
                <p>You haven't placed any orders yet.</p>
                <button onClick={() => navigate('/shop')} className="shop-now-btn">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="order-status-cards">
                {getTopStatusCounts().map(([status, count]) => (
                  <div 
                    key={status} 
                    className="status-card" 
                    onClick={() => handleNavigation('/user-order-details', status)}
                  >
                    <div className="status-icon-wrapper">
                      {statusIcons[status]}
                    </div>
                    <span className="status-number">{count}</span>
                    <span className="status-text">{status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedAccount = withAuth(Account);  
export default AuthenticatedAccount;