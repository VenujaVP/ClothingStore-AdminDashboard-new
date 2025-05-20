// routes/ownerRoutes.js

import multer from 'multer';
import { connectToDatabase } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

import express from 'express';
import { ownerEmployeeAddValidate, ownerProductAddValidate, ownerExpensesAddValidate } from '../middleware/validation.js';
import { 
  fetchSizes, 
  fetchColors, 
  getUserProfile, 
  updateUserProfile, 
  verifyCurrentPassword, // Added this
  initiatePasswordChange, 
  verifyCodeAndUpdatePassword,
  initiateEmailChange, // Added this
  verifyCurrentEmailAndSendToNew, // Added this
  completeEmailChange // Added this
} from '../controllers/ownerControllers_1.js';

import { 
  ownerAddExpenses,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseFiles,
  getExpenseFileById,
  checkExpenseIdExists,
} from '../controllers/ownerControllers_4_expenses.js';

import { 
  ownerCreateProduct, 
  getProductWithImages, 
  getProductImageById, 
  getProductImages,
  getAllProducts,
  toggleProductStatus,
  updateProduct
} from '../controllers/ownerControllers_2_product.js';

import { 
  getAllColors, 
  addColor, 
  updateColor, 
  deleteColor,
  getAllSizes,
  addSize,
  updateSize,
  deleteSize,
  getAllDeliveryOptions,
  addDeliveryOption,
  updateDeliveryOption,
  deleteDeliveryOption,
  toggleDeliveryOptionStatus
} from '../controllers/ownerControllers_5_mng.js';
// Add these imports at the top of the file with other imports
import { 
  getPendingRefunds, 
  getCompletedRefunds, 
  processRefund,
  getRefundStats
} from '../controllers/ownerControllers_6_return_orders.js';


import { ownerCreateEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee  } from '../controllers/ownerControllers_3_emp.js';

const router = express.Router();

// Configure multer to handle file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
});

// Configure multer for expense file uploads - restrict to images and PDFs
const expenseUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
    files: 2 // Max 2 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed!'), false);
    }
  }
});

// Employee routes
router.post('/owner-create-employee', ownerEmployeeAddValidate, ownerCreateEmployee);
router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Expense routes
//Add Expenses
router.post('/owner-add-expenses', expenseUpload.array('files', 2), ownerExpensesAddValidate, ownerAddExpenses);
router.get('/check-expense-id/:customId', checkExpenseIdExists);

router.get('/expenses', getAllExpenses);      //fetch expenses
router.get('/expenses/:id', getExpenseById);  //Fetch expense details including files 
router.put('/expenses/:id', expenseUpload.array('files', 2), updateExpense);   // Update expense details
router.delete('/expenses/:id', deleteExpense); // Delete expense
router.get('/expenses/:expenseId/files', getExpenseFiles);  //// First fetch files for this expense
router.get('/expenses/:expenseId/files/:fileIndex', getExpenseFileById); //// View file - Set the file URL properly

// Product-related routes
router.get('/fetch-sizes', fetchSizes);
router.get('/fetch-colors', fetchColors);
router.post(
  '/owner-add-product',
  upload.array('images', 10), // This handles file uploads
  ownerProductAddValidate,    // Validation middleware
  ownerCreateProduct          // Controller function
);
// Product image routes
router.get('/products/:productId/images/:imageIndex', getProductImageById);
router.get('/products/:productId', getProductWithImages); // Add this new route
router.get('/product/images/:imageId', getProductImageById);
router.get('/product-images/:productId', getProductImages);

// Product listing and management routes
router.get('/products', getAllProducts);
router.patch('/products/:productId/status', toggleProductStatus);

// Product editing route
router.post('/products/:productId/update', upload.array('images', 10), updateProduct);

//Account Update routes
// Profile management routes - removed verifyToken middleware
router.get('/profile', getUserProfile);
router.put('/profile/update', updateUserProfile);

// Password update routes
router.post('/profile/verify-current-password', verifyCurrentPassword);
router.post('/profile/initiate-password-change', initiatePasswordChange);
router.post('/profile/verify-and-update-password', verifyCodeAndUpdatePassword);

// Email update routes
router.post('/profile/initiate-email-change', initiateEmailChange);
router.post('/profile/verify-current-email', verifyCurrentEmailAndSendToNew);
router.post('/profile/complete-email-change', completeEmailChange);

// Colors management routes
router.get('/colors', getAllColors);
router.post('/colors', addColor);
router.put('/colors/:colorId', updateColor);
router.delete('/colors/:colorId', deleteColor);

// Sizes management routes
router.get('/sizes', getAllSizes);
router.post('/sizes', addSize);
router.put('/sizes/:sizeId', updateSize);
router.delete('/sizes/:sizeId', deleteSize);

// Delivery options management routes
router.get('/delivery-options', getAllDeliveryOptions);
router.post('/delivery-options', addDeliveryOption);
router.put('/delivery-options/:deliveryId', updateDeliveryOption);
router.delete('/delivery-options/:deliveryId', deleteDeliveryOption);
router.patch('/delivery-options/:deliveryId/status', toggleDeliveryOptionStatus);

// Refund management routes
router.get('/refunds/pending', getPendingRefunds);
router.get('/refunds/completed', getCompletedRefunds);
router.post('/refunds/process/:orderId', processRefund);
router.get('/refunds/stats', getRefundStats);

export default router;
