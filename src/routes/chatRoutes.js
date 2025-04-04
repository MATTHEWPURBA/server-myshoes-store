const express = require('express');
const { indexProducts, getChatHistoryById } = require('../controllers/chatController');

// Simple middleware for demonstration
const isAuthenticated = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // In a real app, verify the token here
  // For now, we'll just assume it's valid
  req.user = { id: 1, role: 'ADMIN' };
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const router = express.Router();

// Admin routes
router.post('/index', isAuthenticated, isAdmin, indexProducts);
router.get('/history/:sessionId', isAuthenticated, isAdmin, getChatHistoryById);
router.get('/status', (req, res) => {
  // Check if socket.io is initialized
  if (global.io) {
    res.json({ 
      status: 'ok', 
      message: 'WebSocket server is running',
      connections: Object.keys(global.io.sockets.sockets).length
    });
  } else {
    res.status(503).json({ 
      status: 'error', 
      message: 'WebSocket server is not running' 
    });
  }
});
// WebSocket status check endpoint
router.get('/socket-status', (req, res) => {
  const io = require('../services/websocketService').getIOInstance();
  
  if (io) {
    const connections = Object.keys(io.sockets.sockets).length;
    const actualPort = global.SERVER_PORT || '(unknown)';
    
    res.json({
      status: 'available',
      connections: connections,
      port: actualPort,
      transport: io.engine?.transport?.name || 'unknown',
      uptime: process.uptime()
    });
  } else {
    res.status(503).json({
      status: 'unavailable',
      message: 'WebSocket server is not initialized'
    });
  }
});

module.exports = router;