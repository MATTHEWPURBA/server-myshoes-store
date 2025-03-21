// src/routes/payment.routes.js
const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get payment status for an order - requires authentication
router.get('/status/:orderId', authMiddleware, PaymentController.getPaymentStatus);

// Generate a new payment for an existing order - requires authentication
router.post('/generate/:orderId', authMiddleware, PaymentController.generatePayment);

// Cancel payment for an order - requires authentication
router.post('/cancel/:orderId', authMiddleware, PaymentController.cancelPayment);

// Handle notification from Midtrans - no authentication required
// This is a webhook endpoint that Midtrans will call
router.post('/notification', PaymentController.handleNotification);

module.exports = router;