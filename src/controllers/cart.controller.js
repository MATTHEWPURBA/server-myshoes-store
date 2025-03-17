// src/controllers/cart.controller.js
const CartModel = require('../models/cart.model');

class CartController {
  async getUserCart(req, res) {
    try {
      const cartItems = await CartModel.getUserCart(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async syncCart(req, res) {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid cart data' });
      }
      
      const cartItems = await CartModel.updateCart(req.user.id, items);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async clearCart(req, res) {
    try {
      await CartModel.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CartController();