// src/routes/shoe.routes.js
const express = require('express');
const ShoeController = require('../controllers/shoe.controller');
const authMiddleware = require('../middleware/auth');
const sellerMiddleware = require('../middleware/seller'); // New middleware
const productOwnerMiddleware = require('../middleware/productOwner'); // New middleware
const router = express.Router();

// Public routes
router.get('/', ShoeController.getAllShoes);
router.get('/:id', ShoeController.getShoeById);

// Seller-only routes
router.post('/', authMiddleware, sellerMiddleware, ShoeController.createShoe);

// Product owner routes (only creators or superadmins can edit/delete)
router.put('/:id', authMiddleware, productOwnerMiddleware, ShoeController.updateShoe);
router.delete('/:id', authMiddleware, productOwnerMiddleware, ShoeController.deleteShoe);

module.exports = router;