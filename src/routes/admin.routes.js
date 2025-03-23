// src/routes/admin.routes.js
const express = require('express');
const AdminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const sellerMiddleware = require('../middleware/seller');
const superadminMiddleware = require('../middleware/superadmin');
const router = express.Router();

// Seller & SuperAdmin routes (dashboard)
router.get('/products', authMiddleware, sellerMiddleware, AdminController.getAllProducts);

// SuperAdmin only routes
router.use('/users', authMiddleware, superadminMiddleware);
router.get('/users', AdminController.getAllUsers);
router.get('/users/seller-requests', AdminController.getPendingSellerRequests);
router.post('/users/:userId/seller-request', AdminController.processSellerRequest);
router.post('/users/:userId/role', AdminController.changeUserRole);

// Currency management (SuperAdmin only)
router.use('/currencies', authMiddleware, superadminMiddleware);
router.get('/currencies', AdminController.getAllCurrencies);
router.post('/currencies', AdminController.updateCurrencyRates);
router.post('/currencies/:currency', AdminController.updateCurrencyRate);
router.post('/currencies/refresh', AdminController.refreshRates);

module.exports = router;