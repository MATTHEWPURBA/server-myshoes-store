const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;
let isRedisConnecting = false;




/**
 * Set up Redis connection
 * @returns {Promise<Object>} - Redis client
 */
async function setupRedisService() {

    if (redisClient && redisClient.isReady) {
        return redisClient;
      }
      
      if (isRedisConnecting) {
        // Wait for the ongoing connection attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        return setupRedisService();
      }


  try {

    isRedisConnecting = true;
    logger.info('Setting up Redis connection...');
    
    // Close existing client if it exists but isn't ready
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (err) {
        // Ignore errors during cleanup
      }
    }    // Create new client with reconnection strategy
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff with maximum delay of 10 seconds
          const delay = Math.min(Math.pow(2, retries) * 100, 10000);
          logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    // Set up event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });
    
    redisClient.on('end', () => {
      logger.info('Redis connection closed');
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Handle process termination
    process.once('SIGINT', closeConnection);
    process.once('SIGTERM', closeConnection);
    
    logger.info('Redis client successfully initialized');
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Create a fallback in-memory implementation
    return createFallbackCache();

  }

  finally {
    isRedisConnecting = false;
  }
}



/**
 * Create a fallback in-memory cache when Redis is unavailable
 */
function createFallbackCache() {
    logger.warn('Using in-memory fallback cache instead of Redis');
    const cache = new Map();
    
    return {
      isReady: true,
      isFallback: true,
      
      async set(key, value, options = {}) {
        cache.set(key, {
          value,
          expiry: options.EX ? Date.now() + (options.EX * 1000) : null
        });
        return 'OK';
      },
      
      async get(key) {
        const entry = cache.get(key);
        if (!entry) return null;
        
        // Check expiration
        if (entry.expiry && entry.expiry < Date.now()) {
          cache.delete(key);
          return null;
        }
        
        return entry.value;
      },
      
      async quit() {
        cache.clear();
        return 'OK';
      }
    };
  }



/**
 * Store chat history
 * @param {string} sessionId - Chat session ID
 * @param {Array} messages - Array of messages
 * @returns {Promise<boolean>} - Success indicator
 */
async function storeChatHistory(sessionId, messages) {
  try {
    if (!redisClient) await setupRedisService();

    await redisClient.set(`chat:${sessionId}:history`, JSON.stringify(messages), {
      EX: 86400, // 24 hours
    });
    return true;
  } catch (error) {
    logger.error('Error storing chat history:', error);
    return false;
  }
}

/**
 * Get chat history
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<Array>} - Array of messages
 */
async function getChatHistory(sessionId) {
  try {
    if (!redisClient) await setupRedisService();

    const history = await redisClient.get(`chat:${sessionId}:history`);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    logger.error('Error getting chat history:', error);
    return [];
  }
}

/**
 * Store user context
 * @param {string} sessionId - Chat session ID
 * @param {Object} context - Context object
 * @returns {Promise<boolean>} - Success indicator
 */
async function storeUserContext(sessionId, context) {
  try {
    if (!redisClient) await setupRedisService();

    await redisClient.set(`chat:${sessionId}:context`, JSON.stringify(context), {
      EX: 3600, // 1 hour
    });
    return true;
  } catch (error) {
    logger.error('Error storing user context:', error);
    return false;
  }
}

/**
 * Get user context
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<Object>} - Context object
 */
async function getUserContext(sessionId) {
  try {
    if (!redisClient) await setupRedisService();

    const context = await redisClient.get(`chat:${sessionId}:context`);
    return context ? JSON.parse(context) : {};
  } catch (error) {
    logger.error('Error getting user context:', error);
    return {};
  }
}

/**
 * Cache common responses
 * @param {string} query - User query
 * @param {Object} response - Response object
 * @returns {Promise<boolean>} - Success indicator
 */
async function cacheResponse(query, response) {
  try {
    if (!redisClient) await setupRedisService();

    const normalizedQuery = normalizeQuery(query);
    await redisClient.set(`chat:cache:${normalizedQuery}`, JSON.stringify(response), {
      EX: 86400, // 24 hours
    });
    return true;
  } catch (error) {
    logger.error('Error caching response:', error);
    return false;
  }
}

/**
 * Get cached response
 * @param {string} query - User query
 * @returns {Promise<Object|null>} - Cached response
 */
async function getCachedResponse(query) {
  try {
    if (!redisClient) await setupRedisService();

    const normalizedQuery = normalizeQuery(query);
    const cached = await redisClient.get(`chat:cache:${normalizedQuery}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Error getting cached response:', error);
    return null;
  }
}

/**
 * Normalize query for caching
 * @param {string} query - User query
 * @returns {string} - Normalized query
 */
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Close Redis connection
 */
async function closeConnection() {
  try {
    if (redisClient) await redisClient.quit();
    logger.info('Closed Redis connection');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
}





// Add a heartbeat mechanism to keep connection alive
let heartbeatInterval;
function startHeartbeat() {
  // Clear any existing interval
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Send a PING command every 30 seconds to keep the connection alive
  heartbeatInterval = setInterval(async () => {
    try {
      if (redisClient && redisClient.isReady && !redisClient.isFallback) {
        await redisClient.ping();
        logger.debug('Redis heartbeat successful');
      }
    } catch (error) {
      logger.error('Redis heartbeat failed:', error);
      
      // Try to reconnect
      try {
        await setupRedisService();
      } catch (reconnectError) {
        logger.error('Redis reconnection failed:', reconnectError);
      }
    }
  }, 30000); // 30 seconds
}

// Start the heartbeat when the module is loaded
startHeartbeat();





module.exports = {
    setupRedisService,
    storeChatHistory,
    getChatHistory,
    storeUserContext,
    getUserContext,
    cacheResponse,
    getCachedResponse,
    // Export for testing
    _redisClient: () => redisClient
};
