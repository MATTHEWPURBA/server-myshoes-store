// src/services/healthService.js
const logger = require('../utils/logger');
const { setupRedisService } = require('./redisService');
const { setupQueueService } = require('./queueService');

// Track service health
const serviceStatus = {
  redis: false,
  rabbitmq: false,
  vectorService: false
};

/**
 * Initialize all dependent services with proper error handling
 */
async function initializeServices() {
  logger.info('Initializing services...');
  
  // Initialize Redis
  try {
    await setupRedisService();
    serviceStatus.redis = true;
    logger.info('Redis service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis service:', error);
  }
  
  // Initialize RabbitMQ
  try {
    await setupQueueService();
    serviceStatus.rabbitmq = true;
    logger.info('RabbitMQ service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ service:', error);
  }
  
  // Report overall status
  logger.info('Service initialization completed with status:', serviceStatus);
  
  return serviceStatus;
}

/**
 * Check and recover unhealthy services
 */
async function checkAndRecoverServices() {
  logger.debug('Checking service health...');
  
  // Check Redis
  if (!serviceStatus.redis) {
    try {
      await setupRedisService();
      serviceStatus.redis = true;
      logger.info('Redis service recovered');
    } catch (error) {
      logger.error('Failed to recover Redis service:', error);
    }
  }
  
  // Check RabbitMQ
  if (!serviceStatus.rabbitmq) {
    try {
      await setupQueueService();
      serviceStatus.rabbitmq = true;
      logger.info('RabbitMQ service recovered');
    } catch (error) {
      logger.error('Failed to recover RabbitMQ service:', error);
    }
  }
  
  return serviceStatus;
}

// Set up periodic health checks
let healthCheckInterval;
function startHealthChecks(intervalMs = 60000) {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  
  healthCheckInterval = setInterval(async () => {
    await checkAndRecoverServices();
  }, intervalMs);
}

// Gracefully stop health checks
function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

module.exports = {
  initializeServices,
  checkAndRecoverServices,
  startHealthChecks,
  stopHealthChecks,
  getServiceStatus: () => ({ ...serviceStatus })
};