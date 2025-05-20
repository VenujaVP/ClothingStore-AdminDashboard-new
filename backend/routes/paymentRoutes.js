// routes/paymentRoutes.js

import express from 'express';
import { 
  createPaymentIntent, 
  updatePaymentStatus, 
  getPaymentDetails,
  verifyPaymentStatus,
  updateCashOnDeliveryOrder,
  getOrderDetails
} from '../controllers/paymentController.js';

const router = express.Router();

// Payment intent creation route
router.post('/create-payment-intent', createPaymentIntent);

// Update payment status route
router.put('/update-payment-status', updatePaymentStatus);

// Get payment details
router.get('/payment/:paymentId', getPaymentDetails);

// Verify payment status from Stripe
router.get('/verify-payment/:paymentIntentId', verifyPaymentStatus);

// Cash on Delivery order processing
router.put('/update-cod-order', updateCashOnDeliveryOrder);

// Get order details for confirmation page
router.get('/orders/details', getOrderDetails);

export default router;

