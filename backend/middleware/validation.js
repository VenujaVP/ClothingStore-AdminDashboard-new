//middleware/validation.js

import { body } from 'express-validator';

export const validateOwnerRegister = [
  // Validate firstName
  body('firstName')
    .isString()
    .withMessage('First Name must be a string')
    .isLength({ min: 3 })
    .withMessage('First Name must be at least 3 characters')
    .notEmpty()
    .withMessage('First Name is required'),

  // Validate lastName
  body('lastName')
    .isString()
    .withMessage('Last Name must be a string')
    .isLength({ min: 3 })
    .withMessage('Last Name must be at least 3 characters')
    .notEmpty()
    .withMessage('Last Name is required'),

  // Validate email
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),

  // Validate phone
  body('phone')
    .isString()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone Number must be 10 digits')
    .notEmpty()
    .withMessage('Phone Number is required'),

  // Validate password
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character')
    .notEmpty()
    .withMessage('Password is required'),

  // Validate confirmPassword
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm Password is required')
];

export const validateCustomerRegister = [
  // Validate firstName
  body('fullName')
    .isString()
    .withMessage('First Name must be a string')
    .isLength({ min: 3 })
    .withMessage('First Name must be at least 3 characters')
    .notEmpty()
    .withMessage('First Name is required'),

  // Validate email
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),

  // Validate phone
  body('phone')
    .isString()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone Number must be 10 digits')
    .notEmpty()
    .withMessage('Phone Number is required'),

  // Validate password
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character')
    .notEmpty()
    .withMessage('Password is required'),

  // Validate confirmPassword
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm Password is required')
];

export const validateLogin = [
  // Validate email
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),

  // Validate password
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateForgotPassword = [
  // Validate email
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required'),
];

export const validateResetPassword = [
  // Validate password
  body('newPassword')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character')
    .notEmpty()
    .withMessage('Password is required'),

  // Validate confirmPassword
  body('confirmNewPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm Password is required')
];


//Owner Inpage Validations
export const ownerEmployeeAddValidate = [
  // Validate password
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character')
    .notEmpty()
    .withMessage('Password is required'),

  // Validate confirmPassword
  body('com_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm Password is required')
];

export const ownerProductAddValidate = (req, res, next) => {
  // For multipart/form-data, req.body.product_variations will be a string
  // Parse it to convert to JSON
  if (req.body.product_variations && typeof req.body.product_variations === 'string') {
    try {
      req.body.product_variations = JSON.parse(req.body.product_variations);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid product variations format',
        Status: 'error'
      });
    }
  }
  
  // Check for required fields
  const { product_id, product_name, unit_price, date_added, category1 } = req.body;
  
  if (!product_id || !product_name || !unit_price || !date_added || !category1) {
    return res.status(400).json({ 
      message: 'Required fields are missing',
      Status: 'error'
    });
  }
  
  // Check if product variations exist
  const variations = req.body.product_variations;
  if (!Array.isArray(variations) || variations.length === 0) {
    return res.status(400).json({ 
      message: 'At least one product variation is required',
      Status: 'error'
    });
  }
  
  // Continue to the controller
  next();
};

export const ownerExpensesAddValidate = [
  // Validate and sanitize expenses_id
  body('expenses_id')
    .notEmpty()
    .withMessage('Expense ID is required')
    .isAlphanumeric()
    .withMessage('Expense ID must be alphanumeric')
    .isLength({ min: 3, max: 20 })
    .withMessage('Expense ID must be between 3 and 20 characters')
    .trim()
    .escape(),

  // Validate and sanitize date
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in ISO8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const inputDate = new Date(value);
      const currentDate = new Date();
      return inputDate <= currentDate;
    })
    .withMessage('Date cannot be in the future')
    .trim()
    .escape(),

  // Validate and sanitize expenses_name
  body('expenses_name')
    .notEmpty()
    .withMessage('Expense Name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Expense Name must be between 3 and 50 characters')
    .trim()
    .escape(),

  // Validate and sanitize cost
  body('cost')
    .notEmpty()
    .withMessage('Cost is required')
    .isFloat({ gt: 0 })
    .withMessage('Cost must be a positive number')
    .trim()
    .escape(),

  // Validate and sanitize description
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .trim()
    .escape(),
];

