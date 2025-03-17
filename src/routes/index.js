//src/routes/index.js
const express = require('express');
const shoeRoutes = require('./shoe.routes');
const orderRoutes = require('./order.routes');
const userRoutes = require('./user.routes');
const cartRoutes = require('./cart.routes'); // Add this line

const router = express.Router();

router.use('/shoes', shoeRoutes);
router.use('/orders', orderRoutes);
router.use('/auth', userRoutes);
router.use('/cart', cartRoutes); // Add this line

module.exports = router;