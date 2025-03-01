const express = require('express');
const OrderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, OrderController.createOrder);
router.get('/user/:userId', authMiddleware, OrderController.getUserOrders);
router.get('/:orderId', authMiddleware, OrderController.getOrderById);
router.patch('/:orderId/status', authMiddleware, OrderController.updateOrderStatus);

module.exports = router;