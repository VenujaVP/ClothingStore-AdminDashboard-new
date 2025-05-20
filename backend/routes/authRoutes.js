// routes/authRoutes.js

import express from 'express';
import { 
    customerhandleLogin, 
    customerrequestPasswordReset, 
    customerresetPassword, 
    customerRegister,
    ownerEmployeehandleLogin,
    ownerEmployeerequestPasswordReset,
    ownerEmployeeresetPassword,
    OwnerRegister, logout,
} from '../controllers/authController.js';
import { 
    validateLogin, 
    validateForgotPassword, 
    validateResetPassword, 
    validateCustomerRegister,
    validateOwnerRegister
} from '../middleware/validation.js';

const router = express.Router();

router.post('/owner-register', validateOwnerRegister, OwnerRegister);

// Owner and Employee Auth Routes
router.post('/owner-employee-login', validateLogin, ownerEmployeehandleLogin);
router.post('/owner-employee-forgot-password', validateForgotPassword, ownerEmployeerequestPasswordReset);
router.post('/owner-employee-reset-password', validateResetPassword, ownerEmployeeresetPassword);

// Customer Auth Routes
router.post('/customer-register', validateCustomerRegister, customerRegister);
router.post('/customer-login', validateLogin, customerhandleLogin);
router.post('/customer-forgot-password', validateForgotPassword, customerrequestPasswordReset);
router.post('/customer-reset-password', validateResetPassword, customerresetPassword);


//Logout route
// backend/routes/authRoutes.js
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ Status: "Success", message: "Logged out successfully" });
});

export default router;
