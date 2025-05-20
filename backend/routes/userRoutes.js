//routes/userRoutes.js

import express from 'express';
import {placeOrder} from '../controllers/orderControllers.js';
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


export default router;
