// src/server.js
const http = require('http');
const app = require('./index');
const { setupWebSocketServer } = require('./services/websocketService');
const { initializeChatServices, setChatWebSocketService } = require('./controllers/chatController');
const { initializeServices, startHealthChecks } = require('./services/healthService');
const logger = require('./utils/logger');
const PORT = process.env.PORT || 5000;




// Improved error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
  logger.error(error.stack);

  // Give the logger time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! 💥', error);

  // Don't crash the application, just log it
  // This allows the reconnection mechanisms to work
});


// Create HTTP server
const server = http.createServer(app);

// Initialize all services
async function startServer() {
  try {
    // Initialize dependency services
    await initializeServices();

    // Start health checks
    startHealthChecks();

    // Set up WebSocket server
    const wsService = setupWebSocketServer(server);
    global.io = wsService.io; // Store io instance globally
    setChatWebSocketService(wsService);
    logger.info('WebSocket server initialized on port ' + PORT);

    // Initialize chat services
    await initializeChatServices().catch((error) => {
      logger.error('Failed to initialize chat services:', error);
      // Continue despite errors - let reconnection mechanisms handle it
    });

    // Don't start listening here - we'll do that in bin/www
    logger.info('Server initialization complete');
  } catch (error) {
// Log the full error details including stack trace
logger.error('Failed to initialize chat services:', error);
logger.error(error.stack || 'No stack trace available');
  }
}

// Start the initialization process
startServer();

// Export the server
module.exports = server;
