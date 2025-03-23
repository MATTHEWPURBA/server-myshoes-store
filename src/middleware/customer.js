// src/middleware/customer.js
const customerMiddleware = (req, res, next) => {
    try {
      // All authenticated users can access customer routes
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // User is authenticated, proceed
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  
  module.exports = customerMiddleware;