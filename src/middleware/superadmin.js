// src/middleware/superadmin.js
const superadminMiddleware = (req, res, next) => {
    try {
      // Check if user is a superadmin
      if (!req.user || req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
      }
      
      // User is a superadmin, proceed
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  
  module.exports = superadminMiddleware;