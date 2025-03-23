// src/middleware/seller.js
const sellerMiddleware = (req, res, next) => {
    try {
      // Check if user is a seller or superadmin
      if (!req.user || (req.user.role !== 'SELLER' && req.user.role !== 'SUPERADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Seller access required' });
      }
      
      // User is a seller or superadmin, proceed
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  
  module.exports = sellerMiddleware;