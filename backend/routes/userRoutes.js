//routes/userRoutes.js

import express from 'express';
import {placeOrder} from '../controllers/orderControllers.js';

import { getDashboardData, getExpensesSummary } from '../controllers/userControllers_1_dashboard.js';

import { 
    searchProducts, 
    filterProducts, 
    fetchProductDetails, 
    addToCart, 
    fetchCartItems,
    updateCartItem,
    removeCartItem,
    checkStock,
    addUserAddress,
    getUserAddresses,
    deleteUserAddress,
    updateUserAddress,
    fetchDeliveryOptions,
    fetchPaymentMethods,
 
    } from '../controllers/userControllers_1.js';

import {
    getAllUserPaymentHistory,
    getUserOrderHistory,
    getOrderStatusCounts,
    cancelOrder,
    getUserOrderById,           // Add this
    submitReturnRequest,getReturnImageById, getUserReturnRequests
} from '../controllers/userAccountController.js';

import {
    filterByFirstLevelCategory,
    getTrendingProducts,    // Add this import
    getNewArrivals, 
} from '../controllers/dashboardControllers.js'

import {
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
    getUserWishlist,
} from '../controllers/userControllers_2.js'; 


// Add the multer import for file uploads
import multer from 'multer';
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Existing routes
router.post('/product-search', searchProducts);
router.post('/category-filter', filterProducts);
router.get('/fetch-product-details/:productId', fetchProductDetails);
router.post('/add-to-cart', addToCart);
router.get('/cart-items/:userId', fetchCartItems);
router.put('/update-cart-item', updateCartItem);
router.post('/remove-cart-item/:userId/:cartItemId', removeCartItem);
router.get('/check-stock/:variationId', checkStock);
router.post('/shipping-address', addUserAddress);
router.get('/addresses/:userId', getUserAddresses);
router.delete('/address/:userId/:addressId', deleteUserAddress);
router.put('/address/:userId/:addressId', updateUserAddress);
router.get('/delivery-options', fetchDeliveryOptions);
router.get('/payment-methods', fetchPaymentMethods);
router.post('/place-order', placeOrder);


router.get('/order-status-counts/:userId', getOrderStatusCounts);

// Add the new route
router.post('/category-filter-simple', filterByFirstLevelCategory);

// Add these new routes
router.get('/trending-products', getTrendingProducts);
router.get('/new-arrivals', getNewArrivals);

// Add new wishlist routes
router.post('/wishlist/add', addToWishlist);
router.post('/wishlist/remove', removeFromWishlist);
router.get('/wishlist/check/:userId/:productId', checkWishlistStatus);
router.get('/wishlist/:userId', getUserWishlist);

// Payment history routes
router.get('/payment-history/:userId', getAllUserPaymentHistory);


// Order history routes
router.get('/order-history/:userId', getUserOrderHistory);
router.post('/orders/:orderId/cancel', cancelOrder);       // Order cancellation route

// Add these routes at the end of the file before export default router

// Return order routes
// Return order routes
router.get('/order/:orderId', getUserOrderById);
router.post('/submit-return-request', upload.array('images', 3), submitReturnRequest);
router.get('/return-requests/:userId', getUserReturnRequests);
router.get('/return-image/:imageId', getReturnImageById);


// Dashboard routes
router.get('/dashboard-data', getDashboardData);
router.get('/expenses-summary', getExpensesSummary);
export default router;
