/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaShoppingBag, FaStore, FaMapMarkerAlt, FaCreditCard, FaSpinner } from 'react-icons/fa';
import withAuth from '../withAuth';
import { toast } from 'react-toastify';
import './OrderConfirmationPage.css';

const OrderConfirmationPage = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      
      try {
        // Check if we have orderId or orderIds from different payment flows
        const { orderId, orderIds, paymentId, total, paymentMethod, isPaid, address, deliveryMethod, orderItems } = location.state || {};
        
        if (!orderId && !orderIds) {
          toast.error('Order information missing');
          navigate('/');
          return;
        }
        
        // If we have order items directly from checkout or payment process
        if (orderItems) {
          // Ensure total is a valid number
          const parsedTotal = typeof total === 'number' ? total : parseFloat(total || 0);
          
          setOrderData({
            orderId: orderId,
            orderIds: orderIds || [orderId],
            orderItems: orderItems,
            paymentId: paymentId,
            total: parsedTotal,
            paymentMethod: paymentMethod,
            isPaid: isPaid || false,
            address: address,
            deliveryMethod: deliveryMethod
          });
          setLoading(false);
          return;
        }
        
        // Otherwise fetch order details from backend
        const ids = orderIds || [orderId];
        const response = await axios.get(`http://localhost:8082/api/userpayement/orders/details`, {
          params: { orderIds: ids.join(',') }
        });
        
        if (response.data.success) {
          // Ensure total is a valid number
          const responseTotal = response.data.total || total;
          const parsedTotal = typeof responseTotal === 'number' ? responseTotal : parseFloat(responseTotal || 0);
          
          setOrderData({
            orderId: orderId || ids[0],
            orderIds: ids,
            orderItems: response.data.orderItems,
            paymentId: paymentId,
            total: parsedTotal,
            paymentMethod: response.data.paymentMethod || paymentMethod,
            isPaid: response.data.isPaid || isPaid || false,
            address: response.data.address || address,
            deliveryMethod: response.data.deliveryMethod || deliveryMethod
          });
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="order-loading">
        <FaSpinner className="spinner" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-error">
        <div className="error-message">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="go-home-btn">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="order-error">
        <div className="error-message">
          <h2>Order information not available</h2>
          <p>We couldn't find the details for your order.</p>
          <button onClick={() => navigate('/')} className="go-home-btn">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const { orderId, orderIds, orderItems, paymentId, total, paymentMethod, isPaid, address, deliveryMethod } = orderData;

  // Safety checks to prevent errors
  const safeTotal = typeof total === 'number' ? total : 0;
  const safeDeliveryCost = deliveryMethod && typeof deliveryMethod.cost === 'number' ? deliveryMethod.cost : 0;
  const safeSubtotal = safeTotal - safeDeliveryCost;

  const formatDate = (daysToAdd) => {
    const date = new Date();
    date.setDate(date.getDate() + (daysToAdd || 3));
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <h1>Order Confirmation</h1>
          <div className="confirmation-steps">
            <div className="step completed">Shipping</div>
            <div className="step completed">Payment</div>
            <div className="step active">Confirmation</div>
          </div>
        </div>

        <div className="confirmation-content">
          {/* Success Message */}
          <div className="success-message">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h2>Thank you for your order!</h2>
            <p>Your order has been placed successfully. We've sent a confirmation email with all the details.</p>
            <div className="order-number">
              Order {orderIds.length > 1 ? 'Numbers' : 'Number'}: <span>{orderIds.join(', ')}</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            <div className="order-items">
              {orderItems && orderItems.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl}
                        alt={item.productName} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        {item.productName ? item.productName.charAt(0) : 'P'}
                      </div>
                    )}
                    <div className="item-quantity">{item.quantity}</div>
                  </div>
                  <div className="item-details">
                    <h4>{item.productName}</h4>
                    <p>Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}</p>
                    <p className="item-price">LKR {formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>LKR {formatCurrency(safeSubtotal)}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee</span>
                <span>LKR {formatCurrency(safeDeliveryCost)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span>LKR {formatCurrency(safeTotal)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="info-sections">
            <div className="info-section">
              <div className="section-header">
                <FaMapMarkerAlt className="section-icon" />
                <h3>Delivery Information</h3>
              </div>
              <div className="section-content">
                <p><strong>Delivery Method:</strong> {deliveryMethod?.name || 'Standard Delivery'}</p>
                <p><strong>Estimated Delivery:</strong> {formatDate(deliveryMethod?.estimatedDays)}</p>
                {address && (
                  <>
                    <p><strong>Shipping Address:</strong></p>
                    <div className="address-details">
                      <p>{address.contact_name}</p>
                      <p>{address.street_address}</p>
                      {address.apt_suite_unit && <p>{address.apt_suite_unit}</p>}
                      <p>{address.district}, {address.province}</p>
                      <p>{address.zip_code}</p>
                      <p>Phone: {address.mobile_number}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="info-section">
              <div className="section-header">
                <FaCreditCard className="section-icon" />
                <h3>Payment Information</h3>
              </div>
              <div className="section-content">
                <p><strong>Payment Method:</strong> {paymentMethod?.name || 'Cash on Delivery'}</p>
                {paymentMethod?.isOnlinePayment ? (
                  isPaid ? (
                    <div className="payment-status paid">
                      <FaCheckCircle /> Your payment has been processed successfully
                      {paymentId && <p>Payment Reference: {paymentId.substring(0, 8)}...</p>}
                    </div>
                  ) : (
                    <p>Payment processing...</p>
                  )
                ) : (
                  <div className="payment-status cod">
                    You'll pay LKR {formatCurrency(safeTotal)} when your order arrives.
                  </div>
                )}
                <p><strong>Total Amount:</strong> LKR {formatCurrency(safeTotal)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="continue-shopping" onClick={() => navigate('/')}>
              <FaStore /> Continue Shopping
            </button>
            <button className="view-orders" onClick={() => navigate('/user-order-details')}>
              <FaShoppingBag /> View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedOrderConfirmationPage = withAuth(OrderConfirmationPage);
export default AuthenticatedOrderConfirmationPage;