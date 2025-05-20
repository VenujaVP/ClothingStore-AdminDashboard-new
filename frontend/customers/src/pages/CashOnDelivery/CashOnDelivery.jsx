/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaMoneyBillWave, FaTruck, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './CashOnDelivery.css';

const CashOnDelivery = ({ orderData, orderIds, paymentMethod, onOrderSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      toast.error("Please agree to the terms and conditions to continue");
      return;
    }

    setProcessing(true);

    try {
      // Update order status to "to be shipped" but not paid
      const response = await axios.put('http://localhost:8082/api/userpayement/update-cod-order', {
        orderIds,
        paymentMethodId: paymentMethod.payment_method_id || paymentMethod._id
      });
      
      if (response.data.success) {
        toast.success("Order placed successfully!");
        onOrderSuccess();
      } else {
        throw new Error(response.data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing COD order:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="cod-container">
      <div className="cod-header">
        <FaMoneyBillWave className="cod-icon" />
        <h2>Cash On Delivery</h2>
      </div>

      <div className="cod-content">
        <div className="info-box">
          <div className="info-header">
            <FaInfoCircle />
            <h3>How Cash on Delivery Works</h3>
          </div>
          <ol className="cod-instructions">
            <li>We'll prepare and ship your order</li>
            <li>Our delivery partner will bring your package to your address</li>
            <li>Pay the exact amount in cash when you receive your order</li>
            <li>A receipt will be provided as proof of payment</li>
          </ol>
        </div>

        <div className="warning-box">
          <div className="warning-header">
            <FaExclamationTriangle />
            <h3>Important Information</h3>
          </div>
          <ul className="warning-list">
            <li>Please ensure someone is available to receive the package and make the payment</li>
            <li>Prepare the exact amount to avoid change issues</li>
            <li>Verify your order before making the payment</li>
            <li>Cash on delivery orders cannot be canceled once shipped</li>
          </ul>
        </div>

        <div className="order-summary-small">
          <h3>Order Summary</h3>
          <div className="order-summary-details">
            <div className="summary-row">
              <span>Items:</span>
              <span>{orderData?.orderItems?.length || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span>Total Amount:</span>
              <span className="total-amount">LKR {(orderData?.totalAmount || orderData?.total_amount)?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="terms-container">
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>I agree to the terms and conditions of Cash on Delivery</span>
          </label>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="place-order-btn"
          disabled={!agreeTerms || processing}
        >
          {processing ? (
            <span className="processing-text">Processing...</span>
          ) : (
            <>
              <FaTruck /> Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CashOnDelivery;