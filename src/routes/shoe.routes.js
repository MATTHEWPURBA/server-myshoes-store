// File: src/routes/shoe.routes.js
const express = require('express');
const ShoeController = require('../controllers/shoe.controller');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', ShoeController.getAllShoes);
router.get('/:id', ShoeController.getShoeById);
router.post('/', authMiddleware, ShoeController.createShoe);
router.put('/:id', authMiddleware, ShoeController.updateShoe);
router.delete('/:id', authMiddleware, ShoeController.deleteShoe);

module.exports = router;