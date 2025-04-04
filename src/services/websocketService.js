const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../utils/auth');
const { publishMessage } = require('./queueService');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const activeUsers = new Map();
let ioInstance = null;

/**
 * Set up WebSocket server
 * @param {Object} server - HTTP server
 * @returns {Object} - WebSocket server and helper functions
 */
function setupWebSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // For debugging, allow all origins temporarily
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Support both transport mechanisms
  });

  // Store instance for reference
  ioInstance = io;

  // Log a clear message with details
  console.log(`WebSocket server initialized and awaiting connections`);

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        // Allow anonymous users
        return next();
      }

      // Verify token and attach user to socket
      const user = await verifyToken(token);
      if (user) {
        socket.data.user = user;
      }

      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`New WebSocket connection: ${socket.id}`);

    // Generate session token
    const sessionToken = uuidv4();

    // Create or retrieve chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        id: uuidv4(),
        sessionToken,
        userId: socket.data.user?.id,
        active: true,
      },
    });

    // Store session ID in socket
    socket.data.sessionId = chatSession.id;

    // If user is authenticated, map their ID to socket
    if (socket.data.user?.id) {
      activeUsers.set(socket.data.user.id.toString(), socket.id);

      // Send personalized greeting
      socket.emit('chat:message', {
        id: uuidv4(),
        content: `Welcome back, ${socket.data.user.name}! How can I help you find the perfect shoes today?`,
        isFromUser: false,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Send anonymous greeting
      socket.emit('chat:message', {
        id: uuidv4(),
        content: 'Welcome to our shoe store! How can I help you find your perfect pair today?',
        isFromUser: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle incoming messages
    socket.on('chat:message', async (data) => {
      try {
        logger.info(`Message from ${socket.id}: ${data.content}`);

        const now = new Date();

        // Create message record
        const message = await prisma.chatMessage.create({
          data: {
            id: data.id || uuidv4(),
            sessionId: socket.data.sessionId,
            content: data.content,
            isFromUser: true,
            timestamp: now,
          },
        });

        // Update session last active time
        await prisma.chatSession.update({
          where: { id: socket.data.sessionId },
          data: { lastActiveAt: now },
        });

        // Queue message for processing
        await publishMessage('chat_requests', {
          messageId: message.id,
          sessionId: socket.data.sessionId,
          userId: socket.data.user?.id,
          content: data.content,
          timestamp: now.toISOString(),
        });

        // Send typing indicator
        socket.emit('chat:typing', { isTyping: true });
      } catch (error) {
        logger.error('Error handling message:', error);
        socket.emit('chat:error', { message: 'Failed to process your message. Please try again.' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Disconnected: ${socket.id}`);

      // Remove from active users
      if (socket.data.user?.id) {
        activeUsers.delete(socket.data.user.id.toString());
      }

      // Mark session as inactive
      if (socket.data.sessionId) {
        await prisma.chatSession.update({
          where: { id: socket.data.sessionId },
          data: { active: false },
        });
      }
    });
  });

// Return the io instance and helper functions
return {
  io,

  // Helper function to send a message to a specific session
  sendMessageToSession: (sessionId, message) => {
    const sockets = Array.from(io.sockets.sockets.values()).filter((socket) => socket.data.sessionId === sessionId);

    if (sockets.length > 0) {
      // Stop typing indicator
      sockets.forEach((socket) => {
        socket.emit('chat:typing', { isTyping: false });
        socket.emit('chat:message', message);
      });
      return true;
    }
    return false;
  },

  /**
   * Send typing indicator to all sockets in a specific session
   * @param {string} sessionId - The session ID to send typing indicator to
   * @param {boolean} isTyping - Whether typing is active or not
   * @returns {boolean} - Success status
   */
  sendTypingIndicator: (sessionId, isTyping) => {
    try {
      if (!sessionId) {
        logger.warn('Cannot send typing indicator: No session ID provided');
        return false;
      }

      // Find all sockets for this session
      const sockets = Array.from(io.sockets.sockets.values())
        .filter(socket => socket.data.sessionId === sessionId);

      if (sockets.length === 0) {
        logger.debug(`No active sockets found for session ${sessionId}`);
        return false;
      }

      // Send typing indicator to all sockets in the session
      sockets.forEach(socket => {
        socket.emit('chat:typing', { isTyping });
      });

      logger.debug(`Sent typing indicator (${isTyping ? 'on' : 'off'}) to session ${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Error sending typing indicator:', error);
      return false;
    }
  }
};



}

// Add a function to get the IO instance
function getIOInstance() {
  return ioInstance;
}

module.exports = { setupWebSocketServer, getIOInstance };
