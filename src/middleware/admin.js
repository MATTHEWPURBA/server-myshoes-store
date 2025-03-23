// src/middleware/admin.js
const adminMiddleware = (req, res, next) => {
    try {
      // Check if user is admin from the JWT payload
      // This assumes your user object has an isAdmin property
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      
      // User is admin, proceed
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  
  module.exports = adminMiddleware;