// pages/userPayments/Payments.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheck, FaExclamationCircle, FaSpinner, FaMoneyBillWave, 
         FaCreditCard, FaChevronDown, FaEye, FaCalendarAlt, 
         FaShoppingBag, FaArrowLeft, FaArrowRight, FaHistory,
         FaBox, FaTruckMoving, FaShippingFast, FaReceipt, 
         FaTimes } from 'react-icons/fa';
import withAuth from '../../withAuth';
import './Payments.css';

// Payment Details Modal Component
const PaymentDetailsModal = ({ payment, isOpen, onClose, formatDate, getOrderStatusIcon }) => {
  if (!isOpen || !payment) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="payment-details-modal">
        <div className="modal-header">
          <h3>Payment Details #{payment.payment_id}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-content">
          {/* Payment Information */}
          <div className="modal-section">
            <div className="section-header">
              <FaReceipt className="section-icon" />
              <h4>Payment Information</h4>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Payment Method</span>
                <span className="info-value">{payment.payment_method_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date & Time</span>
                <span className="info-value">{formatDate(payment.payment_date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Transaction Reference</span>
                <span className="info-value">{payment.transaction_reference || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className={`info-value status-${payment.payment_status}`}>
                  {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Amount</span>
                <span className="info-value">Rs. {payment.amount.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Type</span>
                <span className="info-value">{payment.is_online_payment ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="modal-section">
            <div className="section-header">
              <FaShoppingBag className="section-icon" />
              <h4>Order Items ({payment.order_summary.length})</h4>
            </div>
            
            {payment.order_summary.map((item, index) => (
              <div key={index} className="order-item">
                <div className="order-details">
                  <div className="order-number">Order #{item.order_id}</div>
                  <div className="product-details">
                    <span className="product-id">Product ID: {item.product_id}</span>
                    <span className="product-quantity">× {item.quantity}</span>
                  </div>
                </div>
                
                <div className="order-status-price">
                  <div className="order-status">
                    {getOrderStatusIcon(item.status)}
                    <span className={`status-label ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="item-price">Rs. {parseFloat(item.total_price).toFixed(2)}</div>
                </div>
              </div>
            ))}
            
            <div className="order-total">
              <span>Total Amount</span>
              <span className="total-amount">Rs. {payment.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Payment Item Component
const PaymentItem = ({ userId }) => {
  const [allPayments, setAllPayments] = useState([]);
  const [displayedPayments, setDisplayedPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchAllPaymentHistory();
  }, [userId]);

  useEffect(() => {
    if (allPayments.length > 0) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setDisplayedPayments(allPayments.slice(startIndex, endIndex));
    }
  }, [currentPage, allPayments]);

  const fetchAllPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8082/api/user/payment-history/${userId}`);
      
      if (response.data.success) {
        const payments = response.data.payments;
        setAllPayments(payments);
        setTotalPages(Math.ceil(payments.length / ITEMS_PER_PAGE));
        
        const startIndex = 0;
        const endIndex = ITEMS_PER_PAGE;
        setDisplayedPayments(payments.slice(startIndex, endIndex));
      } else {
        setError('Failed to fetch payment history');
        toast.error('Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('An error occurred while fetching your payment history');
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="status-icon success" />;
      case 'pending':
        return <FaSpinner className="status-icon pending" />;
      case 'failed':
        return <FaExclamationCircle className="status-icon failed" />;
      default:
        return null;
    }
  };

  const getOrderStatusIcon = (status) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('shipped')) {
      return <FaTruckMoving className="order-status-icon shipped" />;
    } else if (statusLower.includes('delivered')) {
      return <FaCheck className="order-status-icon delivered" />;
    } else if (statusLower.includes('to be shipped')) {
      return <FaBox className="order-status-icon to-be-shipped" />;
    } else if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
      return <FaExclamationCircle className="order-status-icon failed" />;
    } else {
      return <FaShippingFast className="order-status-icon pending" />;
    }
  };

  const getPaymentMethodIcon = (isOnline) => {
    return isOnline ? 
      <FaCreditCard className="payment-method-icon card" /> : 
      <FaMoneyBillWave className="payment-method-icon cash" />;
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    // Re-enable scrolling
    document.body.style.overflow = 'unset';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="payments-container payments-loading">
        <div className="loading-spinner">
          <FaSpinner className="spinner" />
          <p>Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payments-container payments-error">
        <FaExclamationCircle className="error-icon" />
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchAllPaymentHistory}>
          Retry
        </button>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="payments-container payments-empty">
        <div className="empty-state">
          <FaMoneyBillWave className="empty-icon" />
          <h3>No Payment History</h3>
          <p>You haven't made any payments yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-wrapper">
      <div className="payments-container">
        <div className="payments-header">
          <div className="payments-title">
            <FaReceipt className="header-icon" />
            <h2>Payment History</h2>
          </div>
          <div className="payments-summary">
            <span>{allPayments.length} {allPayments.length === 1 ? 'payment' : 'payments'} found</span>
          </div>
        </div>

        <div className="payments-list">
          {displayedPayments.map((payment) => (
            <div key={payment.payment_id} className="payment-item">
              <div className="payment-summary">
                <div className="payment-left">
                  <div className="payment-icon">
                    {getPaymentMethodIcon(payment.is_online_payment)}
                  </div>
                  <div className="payment-basic-info">
                    <div className="payment-id">Payment #{payment.payment_id}</div>
                    <div className="payment-date">
                      <FaCalendarAlt className="date-icon" /> {formatDate(payment.payment_date)}
                    </div>
                  </div>
                </div>
                
                <div className="payment-center">
                  <div className="payment-method">{payment.payment_method_name}</div>
                  <div className="order-count">{payment.order_summary.length} {payment.order_summary.length === 1 ? 'item' : 'items'}</div>
                </div>
                
                <div className="payment-right">
                  <div className="payment-amount">Rs. {payment.amount.toFixed(2)}</div>
                  <div className={`payment-status ${payment.payment_status}`}>
                    {getStatusIcon(payment.payment_status)}
                    <span>{payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}</span>
                  </div>
                </div>
                
                <button 
                  className="view-details-btn"
                  onClick={() => openPaymentModal(payment)}
                >
                  <FaEye /> <span className="btn-text">Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn prev-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaArrowLeft />
              <span>Previous</span>
            </button>
            
            <div className="page-indicator">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            
            <button 
              className="page-btn next-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>

      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={closePaymentModal}
        formatDate={formatDate}
        getOrderStatusIcon={getOrderStatusIcon}
      />
    </div>
  );
};

const AuthenticatedPayments = withAuth(PaymentItem);
export default AuthenticatedPayments;