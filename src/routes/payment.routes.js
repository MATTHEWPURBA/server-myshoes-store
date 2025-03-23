// src/routes/payment.routes.js
const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get payment status for an order - requires authentication
router.get('/status/:orderId', authMiddleware, PaymentController.getPaymentStatus);

// Generate a new payment for an existing order - requires authentication
// Changed from /generate/:orderId to /generate to accept both orderId and currency in the request body
router.post('/generate', authMiddleware, PaymentController.generatePayment);

// Generate a new payment for an existing order - requires authentication
// router.post('/generate/:orderId', authMiddleware, PaymentController.generatePayment);

// Cancel payment for an order - requires authentication
router.post('/cancel/:orderId', authMiddleware, PaymentController.cancelPayment);

// Handle notification from Midtrans - no authentication required
// This is a webhook endpoint that Midtrans will call
router.post('/notification', PaymentController.handleNotification);


// Add this new route for getting available currencies
router.get('/currencies', PaymentController.getAvailableCurrencies);


module.exports = router;