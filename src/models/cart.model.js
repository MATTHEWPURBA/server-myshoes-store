// src/models/cart.model.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Add this near the top of cart.model.js
console.log('Available Prisma models:', Object.keys(prisma));


class CartModel {
  async getUserCart(userId) {
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: parseInt(userId) },
        include: { shoe: true }
      });
      
      return cartItems.map(item => ({
        quantity: item.quantity,
        shoe: item.shoe
      }));
    } catch (error) {
      throw new Error(`Error fetching cart: ${error.message}`);
    }
  }
  
  async updateCart(userId, items) {
    try {
      // First delete all existing items for this user
      await prisma.cartItem.deleteMany({
        where: { userId: parseInt(userId) }
      });
      
      // Then create new cart items
      const cartItems = [];
      for (const item of items) {
        const cartItem = await prisma.cartItem.create({
          data: {
            userId: parseInt(userId),
            shoeId: parseInt(item.shoe.id),
            quantity: parseInt(item.quantity)
          },
          include: { shoe: true }
        });
        
        cartItems.push({
          quantity: cartItem.quantity,
          shoe: cartItem.shoe
        });
      }
      
      return cartItems;
    } catch (error) {
      throw new Error(`Error updating cart: ${error.message}`);
    }
  }
  
  async clearCart(userId) {
    try {
      await prisma.cartItem.deleteMany({
        where: { userId: parseInt(userId) }
      });
    } catch (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
  }
}

module.exports = new CartModel();