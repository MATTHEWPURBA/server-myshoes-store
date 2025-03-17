// src/routes/cart.routes.js
const express = require('express');
const CartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', CartController.getUserCart);
router.post('/', CartController.syncCart);
router.delete('/', CartController.clearCart);

module.exports = router;