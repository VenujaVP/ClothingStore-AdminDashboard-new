// routes/employeeRoutes.js

import express from 'express';
import {
  getEmployeeProfile,
  updateEmployeeProfile,
  verifyCurrentPassword,
  initiatePasswordChange,
  verifyCodeAndUpdatePassword,
  initiateEmailChange,
  verifyCurrentEmail ,
  completeEmailChange
} from '../controllers/employeeControllers_1_auth.js';

import {
  getOrdersToBeShipped,
  getShippedOrders,
  getOrderDetails,
  processOrderShipping,
  updateTrackingNumber
} from '../controllers/employeeControllers_2_process.js';


const router = express.Router();

// Profile routes
router.get('/profile', getEmployeeProfile);
router.put('/profile/update', updateEmployeeProfile);

// Password change routes
router.post('/profile/verify-current-password', verifyCurrentPassword);
router.post('/profile/initiate-password-change', initiatePasswordChange);
router.post('/profile/verify-and-update-password', verifyCodeAndUpdatePassword);

// Email change routes
router.post('/profile/initiate-email-change', initiateEmailChange);
router.post('/profile/verify-current-email', verifyCurrentEmail);
router.post('/profile/complete-email-change', completeEmailChange);

// Order processing routes
router.get('/orders/to-be-shipped', getOrdersToBeShipped);
router.get('/orders/shipped', getShippedOrders);
router.get('/orders/details/:orderId', getOrderDetails);
router.post('/orders/process-shipping', processOrderShipping);
router.post('/orders/update-tracking', updateTrackingNumber);

export default router;
