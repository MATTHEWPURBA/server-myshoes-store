// src/routes/user.routes.js
const express = require('express');
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/profile', authMiddleware, UserController.getUserProfile);
router.put('/profile', authMiddleware, UserController.updateUserProfile);

// New routes for seller requests
router.post('/request-seller', authMiddleware, UserController.requestSellerStatus);
router.get('/seller-status', authMiddleware, UserController.checkSellerStatus);

module.exports = router;