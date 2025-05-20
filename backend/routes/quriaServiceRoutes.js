import express from 'express';
import {
  getShippedOrders,
  getDeliveredOrders,
  markOrderAsDelivered
} from '../controllers/quriaServiceControllers.js';

const router = express.Router();

// Order fetching routes
router.get('/orders/shipped', getShippedOrders);
router.get('/orders/delivered', getDeliveredOrders);

// Order status update route
router.post('/orders/:orderId/deliver', markOrderAsDelivered);

export default router;