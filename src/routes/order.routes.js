//src/routes/order.routes.js
const express = require('express');
const OrderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// New route to get orders for the authenticated user
router.get('/', authMiddleware, OrderController.getAllOrders);
router.post('/', authMiddleware, OrderController.createOrder);
router.get('/user/:userId', authMiddleware, OrderController.getUserOrders);
router.get('/:orderId', authMiddleware, OrderController.getOrderById);
router.patch('/:orderId/status', authMiddleware, OrderController.updateOrderStatus);
// Add this new route for deleting orders
router.delete('/:orderId', authMiddleware, OrderController.deleteOrder);

module.exports = router;