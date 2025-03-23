// src/middleware/productOwner.js
const prisma = require('../lib/prisma');

const productOwnerMiddleware = async (req, res, next) => {
  try {
    // This middleware assumes the route has a shoeId parameter
    const shoeId = parseInt(req.params.id || req.params.shoeId);
    
    if (!shoeId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Get the product
    const shoe = await prisma.shoe.findUnique({
      where: { id: shoeId }
    });
    
    if (!shoe) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // SuperAdmins can access any product
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }
    
    // Check if user is the creator of the product
    if (shoe.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only manage your own products' });
    }
    
    // User is the product owner, proceed
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = productOwnerMiddleware;