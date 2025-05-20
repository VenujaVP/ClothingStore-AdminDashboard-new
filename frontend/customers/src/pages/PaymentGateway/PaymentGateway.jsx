// pages/PaymentGateway/PaymentGateway.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement,
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import withAuth from '../withAuth';
import { FaLock, FaCreditCard, FaCheckCircle, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './PaymentGateway.css';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51ROgpS2aAuwJgETxqUpGNXVKw0bs1UUBxulydbSzOr2LCxFbsOSNs93G35rkDINZrXEywTCncilPjfLKhiktOmMA00FUB1471v');

// Card element custom styling
const cardElementStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'Arial, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#23b893',
    },
    invalid: {
      color: '#e5424d',
      ':focus': {
        color: '#303238',
      },
    },
  },
};

const StripeCardForm = ({ orderData, orderIds, paymentMethod, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName) {
      setError("Please enter the cardholder's name");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Ensure we have the proper amount format
      const amount = orderData.totalAmount || orderData.total_amount;
      
      // Display processing message to user
      toast.info("Processing your payment...");
      
      // 1. Create payment intent on your server
      const paymentIntentResponse = await axios.post('http://localhost:8082/api/userpayement/create-payment-intent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'lkr',
        orderIds: orderIds,
        // Make sure we're using the correct ID property that matches your database
        paymentMethodId: paymentMethod.payment_method_id || paymentMethod._id
      });

      if (!paymentIntentResponse.data.success) {
        throw new Error(paymentIntentResponse.data.message || 'Failed to initialize payment');
      }

      const { clientSecret } = paymentIntentResponse.data;

      // 2. Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: cardholderName
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // 3. Update your backend with payment success
        const updateResponse = await axios.put('http://localhost:8082/api/userpayement/update-payment-status', {
          orderIds,
          paymentId: paymentIntent.id,
          status: 'completed'
        });

        // Even if the update request fails, we can verify payment status directly
        if (!updateResponse.data.success) {
          console.warn('Payment succeeded but database update failed. Verifying directly...');
          
          // Verify payment directly with Stripe
          try {
            await axios.get(`http://localhost:8082/api/userpayement/verify-payment/${paymentIntent.id}`);
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            // Continue anyway since the payment was successful on Stripe's end
          }
        }

        // Notify parent component of success
        onPaymentSuccess(paymentIntent.id);
        
        // Show success message
        toast.success('Payment successful!');
      } else {
        throw new Error('Payment processing failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
      
      // Update payment status to failed
      try {
        await axios.put('http://localhost:8082/api/userpayement/update-payment-status', {
          orderIds,
          status: 'failed'
        });
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-card-form">
      <div className="form-group">
        <label htmlFor="cardholder-name">Cardholder Name</label>
        <input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Name on card"
          required
          autoComplete="cc-name"
        />
      </div>

      <div className="form-group">
        <label>Card Information</label>
        
        <div className="custom-card-fields">
          <div className="card-number-field">
            <div className="card-field-container">
              <span className="card-field-label">Card Number</span>
              <CardNumberElement options={cardElementStyle} />
              <FaCreditCard className="card-icon" />
            </div>
          </div>
          
          <div className="card-row">
            <div className="card-expiry-field">
              <div className="card-field-container">
                <span className="card-field-label">Expiry Date (MM/YY)</span>
                <CardExpiryElement options={cardElementStyle} />
                <FaCalendarAlt className="card-icon" />
              </div>
            </div>
            
            <div className="card-cvc-field">
              <div className="card-field-container">
                <span className="card-field-label">CVC</span>
                <CardCvcElement options={cardElementStyle} />
                <FaShieldAlt className="card-icon" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-brands">
          <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945b31.svg" alt="Visa" />
          <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130d8670b61c1c35b55edb1.svg" alt="Mastercard" />
          <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="order-amount">
        <span>Total Payment:</span>
        <span className="amount">LKR {(orderData.totalAmount || orderData.total_amount).toFixed(2)}</span>
      </div>

      <button
        type="submit"
        className="pay-button"
        disabled={!stripe || processing}
      >
        {processing ? (
          <span className="processing">
            Processing <span className="dots"><span>.</span><span>.</span><span>.</span></span>
          </span>
        ) : (
          <span>Pay Now</span>
        )}
      </button>
      
      <div className="secure-payment">
        <FaLock /> Payments are secure and encrypted
      </div>
    </form>
  );
};

const PaymentGateway = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderIds, setOrderIds] = useState([]);

  // Add this function to the PaymentGateway component
  const verifyPayment = async (paymentIntentId) => {
    try {
      const response = await axios.get(`http://localhost:8082/api/user/verify-payment/${paymentIntentId}`);
      if (response.data.success && response.data.paymentStatus === 'succeeded') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  };

  // Update the useEffect in the PaymentGateway component
  useEffect(() => {
    if (!location.state) {
      toast.error('Missing payment information');
      navigate('/cart');
      return;
    }

    const { orderId, orderIds, orderData, paymentMethod } = location.state;
    
    if (!orderData || !paymentMethod) {
      toast.error('Invalid payment information');
      navigate('/cart');
      return;
    }
    
    // Log received data for debugging
    console.log('Payment gateway received data:', {
      orderId,
      orderIds,
      orderData,
      paymentMethod
    });
    
    // Ensure paymentMethod has payment_method_id property
    if (paymentMethod && !paymentMethod.payment_method_id && paymentMethod._id) {
      paymentMethod.payment_method_id = paymentMethod._id;
    }
    
    setOrderData(orderData);
    setPaymentMethod(paymentMethod);
    setOrderId(orderId);
    setOrderIds(orderIds || [orderId]);
  }, [location, navigate]);

  // Then add this to the handlePaymentSuccess function
  const handlePaymentSuccess = async (paymentId) => {
    setPaymentSuccess(true);
    
    // Double check payment status after a short delay
    setTimeout(async () => {
      try {
        // This is an extra safeguard in case the initial update failed
        await verifyPayment(paymentId);
      } catch (error) {
        console.error('Final payment verification failed:', error);
        // Continue anyway - we'll assume the payment went through
      }
      
      // Redirect to confirmation
      navigate('/order-confirmation', {
        state: {
          orderId,
          orderIds,
          paymentId,
          total: orderData.totalAmount || orderData.total_amount,
          paymentMethod,
          isPaid: true
        }
      });
    }, 2000);
  };

  if (!orderData || !paymentMethod) {
    return <div className="payment-loading">Loading payment information...</div>;
  }

  if (paymentSuccess) {
    return (
      <div className="payment-success">
        <div className="success-card">
          <FaCheckCircle className="success-icon" />
          <h2>Payment Successful!</h2>
          <p>Your payment has been processed successfully.</p>
          <p>You will be redirected to your order confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h1>Payment Details</h1>
          <p>Order #{orderId}</p>
        </div>
        
        <Elements stripe={stripePromise}>
          <StripeCardForm 
            orderData={orderData}
            orderIds={orderIds}
            paymentMethod={paymentMethod}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </Elements>
      </div>
    </div>
  );
};

const AuthenticatedPaymentGateway = withAuth(PaymentGateway);
export default AuthenticatedPaymentGateway;