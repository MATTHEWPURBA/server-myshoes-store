const amqp = require('amqplib');
const logger = require('../utils/logger');

const { v4: uuidv4 } = require('uuid');

// Connection management
let connection = null;
let channel = null;
let isConnecting = false;
let reconnectAttempt = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000; // 2 seconds


// Fallback message handling
const localMessageQueue = [];
const LOCAL_QUEUE_LIMIT = 200;
let isProcessingLocalQueue = false;

// Connection health monitoring
let lastSuccessfulOperation = Date.now();
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
let healthCheckInterval = null;




// /**
//  * Set up RabbitMQ connection and channels
//  * @returns {Promise<Object>} - Connection and channel objects
//  */
// async function setupQueueService() {
//   if (channel && connection) {
//     return { connection, channel };
//   }

//   if (isConnecting) {
//     // Wait for the ongoing connection attempt
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     return setupQueueService();
//   }

//   try {
//     isConnecting = true;
//     logger.info('Setting up RabbitMQ connection...');

//     // Clean up existing connections if necessary
//     await cleanupExistingConnections();

//     // Connect to RabbitMQ with heartbeat
//     connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672', {
//       heartbeat: 30, // 30 seconds heartbeat
//       timeout: 10000, // 10 seconds connection timeout
//     });

//     // Create channel
//     channel = await connection.createChannel();

//     // Set up event handlers for both connection and channel
//     setupConnectionHandlers();

//     // Ensure queues exist
//     await channel.assertQueue('chat_requests', { durable: true });
//     await channel.assertQueue('chat_responses', { durable: true });

//     // Set prefetch to 1 to ensure even distribution among workers
//     channel.prefetch(1);

//     logger.info('Connected to RabbitMQ successfully');
//     startConnectionPing();

//     // Reset reconnect attempt counter upon successful connection
//     reconnectAttempt = 0;

//     // Handle process termination
//     process.once('SIGINT', closeConnection);
//     process.once('SIGTERM', closeConnection);

//     return { connection, channel };
//   } catch (error) {
//     logger.error('Failed to connect to RabbitMQ:', error);

//     // Implement exponential backoff for reconnection
//     reconnectAttempt++;

//     if (reconnectAttempt <= maxReconnectAttempts) {
//       const delay = Math.min(Math.pow(2, reconnectAttempt) * 100, 30000);
//       logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${reconnectAttempt}/${maxReconnectAttempts})...`);

//       await new Promise((resolve) => setTimeout(resolve, delay));
//       isConnecting = false;
//       return setupQueueService();
//     } else {
//       logger.error(`Failed to connect to RabbitMQ after ${maxReconnectAttempts} attempts. Giving up.`);
//       throw error;
//     }
//   } finally {
//     isConnecting = false;
//   }
// }



/**
 * Set up queue service
 */
// async function setupQueueService() {
//   // Prevent multiple connection attempts
//   if (isConnecting) {
//     logger.debug('Connection attempt already in progress');
//     return false;
//   }

//   isConnecting = true;

//   try {
//     logger.info('Setting up RabbitMQ connection...');
    
//     // Get connection URL with fallbacks
//     const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    
//     // Close existing connection if any
//     if (connection) {
//       try {
//         logger.debug('Closing existing connection before reconnecting');
//         await connection.close();
//       } catch (closeErr) {
//         logger.warn('Error closing existing connection:', closeErr.message);
//       }
//     }
    
//     // Create connection with timeout
//     const connectPromise = amqp.connect(rabbitUrl);
//     connection = await Promise.race([
//       connectPromise,
//       new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000)
//       )
//     ]);
    
//     // Set up connection event handlers
//     connection.on('error', (err) => {
//       logger.error('RabbitMQ connection error:', {
//         message: err.message,
//         name: err.name
//       });
      
//       // Mark as disconnected
//       connection = null;
//       channel = null;
//     });
    
//     connection.on('close', () => {
//       logger.warn('RabbitMQ connection closed');
//       connection = null;
//       channel = null;
      
//       // Schedule reconnection if not already connecting
//       if (!isConnecting) {
//         const backoffDelay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, Math.min(reconnectAttempt, 10));
//         reconnectAttempt++;
        
//         logger.info(`Scheduling reconnection in ${backoffDelay}ms (attempt ${reconnectAttempt})`);
//         setTimeout(() => {
//           setupQueueService().catch(err => {
//             logger.error('Scheduled reconnection failed:', err.message);
//           });
//         }, backoffDelay);
//       }
//     });
    
//     // Create channel
//     channel = await connection.createChannel();
    
//     // Set up channel event handlers
//     channel.on('error', (err) => {
//       logger.error('RabbitMQ channel error:', {
//         message: err.message,
//         name: err.name
//       });
//       channel = null;
//     });
    
//     channel.on('close', () => {
//       logger.warn('RabbitMQ channel closed');
//       channel = null;
//     });
    
//     // Declare queues with proper settings
//     await channel.assertQueue('chat_requests', { 
//       durable: true,
//       arguments: {
//         'x-dead-letter-exchange': 'dlx',
//         'x-dead-letter-routing-key': 'chat_requests_dlq',
//         'x-message-ttl': 60000 // 1 minute TTL for unprocessed messages
//       }
//     });
    
//     await channel.assertQueue('chat_responses', { 
//       durable: true,
//       arguments: {
//         'x-dead-letter-exchange': 'dlx',
//         'x-dead-letter-routing-key': 'chat_responses_dlq',
//         'x-message-ttl': 60000 // 1 minute TTL
//       }
//     });
    
//     // Set up dead-letter exchange and queues
//     await channel.assertExchange('dlx', 'direct', { durable: true });
//     await channel.assertQueue('chat_requests_dlq', { durable: true });
//     await channel.assertQueue('chat_responses_dlq', { durable: true });
//     await channel.bindQueue('chat_requests_dlq', 'dlx', 'chat_requests_dlq');
//     await channel.bindQueue('chat_responses_dlq', 'dlx', 'chat_responses_dlq');
    
//     // Connection successful, reset reconnect attempt counter
//     reconnectAttempt = 0;
//     lastSuccessfulOperation = Date.now();
//     logger.info('Connected to RabbitMQ successfully');
    
//     // Start health check if not already running
//     if (!healthCheckInterval) {
//       startHealthCheck();
//     }
    
//     // Process any messages in local queue
//     if (localMessageQueue.length > 0) {
//       logger.info(`Processing ${localMessageQueue.length} messages from local queue`);
//       processLocalQueue();
//     }
    
//     return true;
//   } catch (error) {
//     logger.error('Failed to set up RabbitMQ:', {
//       message: error.message,
//       stack: error.stack?.split('\n')[0] || 'No stack trace'
//     });
    
//     // Reset connection state
//     connection = null;
//     channel = null;
    
//     // Schedule reconnection with exponential backoff
//     if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
//       const backoffDelay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempt);
//       reconnectAttempt++;
      
//       logger.info(`Will attempt to reconnect in ${backoffDelay}ms (attempt ${reconnectAttempt})`);
//       setTimeout(() => {
//         setupQueueService().catch(err => {
//           logger.error('Reconnection attempt failed:', err.message);
//         });
//       }, backoffDelay);
//     } else {
//       logger.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Will only try on demand.`);
//       reconnectAttempt = Math.max(5, reconnectAttempt - 3); // Reduce backoff but don't reset completely
//     }
    
//     return false;
//   } finally {
//     isConnecting = false;
//   }
// }









// Add this to queueService.js after your setupQueueService function:


/**
 * Set up queue service
 */
async function setupQueueService() {
  // Prevent multiple connection attempts
  if (isConnecting) {
    logger.debug('Connection attempt already in progress');
    return false;
  }

  isConnecting = true;

  try {
    logger.info('Setting up RabbitMQ connection...');
    
    // Get connection URL with fallbacks
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    
    // Close existing connection if any
    if (connection) {
      try {
        logger.debug('Closing existing connection before reconnecting');
        await connection.close();
      } catch (closeErr) {
        logger.warn('Error closing existing connection:', closeErr.message);
      }
    }
    
    // Create connection with timeout
    const connectPromise = amqp.connect(rabbitUrl);
    connection = await Promise.race([
      connectPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000)
      )
    ]);
    
    // Set up connection event handlers
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', {
        message: err.message,
        name: err.name
      });
      
      // Mark as disconnected
      connection = null;
      channel = null;
    });
    
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
      
      // Schedule reconnection if not already connecting
      if (!isConnecting) {
        const backoffDelay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, Math.min(reconnectAttempt, 10));
        reconnectAttempt++;
        
        logger.info(`Scheduling reconnection in ${backoffDelay}ms (attempt ${reconnectAttempt})`);
        setTimeout(() => {
          setupQueueService().catch(err => {
            logger.error('Scheduled reconnection failed:', err.message);
          });
        }, backoffDelay);
      }
    });
    
    // Create channel
    channel = await connection.createChannel();
    
    // Set up channel event handlers
    channel.on('error', (err) => {
      logger.error('RabbitMQ channel error:', {
        message: err.message,
        name: err.name
      });
      channel = null;
    });
    
    channel.on('close', () => {
      logger.warn('RabbitMQ channel closed');
      channel = null;
    });
    
    // Create all queues first before trying to bind anything
    
    // Set up dead-letter exchange first
    if (channel) {
      try {
        await channel.assertExchange('dlx', 'direct', { durable: true });
        logger.info('Dead letter exchange created or confirmed');
      } catch (err) {
        logger.error('Failed to set up dead letter exchange:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    // Create dead letter queues first
    if (channel) {
      try {
        await channel.assertQueue('chat_requests_dlq', { durable: true });
        logger.info('Dead letter queue created or confirmed: chat_requests_dlq');
      } catch (err) {
        logger.error('Failed to set up dead letter queue chat_requests_dlq:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    if (channel) {
      try {
        await channel.assertQueue('chat_responses_dlq', { durable: true });
        logger.info('Dead letter queue created or confirmed: chat_responses_dlq');
      } catch (err) {
        logger.error('Failed to set up dead letter queue chat_responses_dlq:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    // Now bind dead letter queues to exchange
    if (channel) {
      try {
        await channel.bindQueue('chat_requests_dlq', 'dlx', 'chat_requests_dlq');
        logger.info('Bound chat_requests_dlq to dlx exchange');
      } catch (err) {
        logger.error('Failed to bind chat_requests_dlq:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    if (channel) {
      try {
        await channel.bindQueue('chat_responses_dlq', 'dlx', 'chat_responses_dlq');
        logger.info('Bound chat_responses_dlq to dlx exchange');
      } catch (err) {
        logger.error('Failed to bind chat_responses_dlq:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    // Now create or check main queues
    if (channel) {
      try {
        // For chat_requests queue
        try {
          await channel.checkQueue('chat_requests');
          logger.info('Using existing chat_requests queue');
        } catch (err) {
          if (channel) { // Make sure channel still exists
            await channel.assertQueue('chat_requests', { 
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'dlx',
                'x-dead-letter-routing-key': 'chat_requests_dlq',
                'x-message-ttl': 60000 // 1 minute TTL for unprocessed messages
              }
            });
            logger.info('Created chat_requests queue with specified parameters');
          } else {
            throw new Error('Channel closed unexpectedly');
          }
        }
      } catch (err) {
        logger.error('Failed to set up chat_requests queue:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    // Chat responses queue
    if (channel) {
      try {
        // For chat_responses queue
        try {
          await channel.checkQueue('chat_responses');
          logger.info('Using existing chat_responses queue');
        } catch (err) {
          if (channel) { // Make sure channel still exists
            await channel.assertQueue('chat_responses', { 
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'dlx',
                'x-dead-letter-routing-key': 'chat_responses_dlq',
                'x-message-ttl': 60000 // 1 minute TTL
              }
            });
            logger.info('Created chat_responses queue with specified parameters');
          } else {
            throw new Error('Channel closed unexpectedly');
          }
        }
      } catch (err) {
        logger.error('Failed to set up chat_responses queue:', err.message);
        if (!channel) {
          // Re-create channel if it was closed
          try {
            channel = await connection.createChannel();
            logger.info('Channel recreated after error');
          } catch (channelErr) {
            logger.error('Failed to recreate channel:', channelErr.message);
            throw new Error('Failed to recreate channel after error');
          }
        }
      }
    }
    
    // Check if we still have a valid channel after all operations
    if (!channel) {
      throw new Error('No valid channel after setup operations');
    }
    
    // Connection successful, reset reconnect attempt counter
    reconnectAttempt = 0;
    lastSuccessfulOperation = Date.now();
    logger.info('Connected to RabbitMQ successfully');
    
    // Start health check if not already running
    if (!healthCheckInterval) {
      startHealthCheck();
    }
    
    // Process any messages in local queue
    if (localMessageQueue.length > 0) {
      logger.info(`Processing ${localMessageQueue.length} messages from local queue`);
      processLocalQueue();
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to set up RabbitMQ:', {
      message: error.message,
      stack: error.stack?.split('\n')[0] || 'No stack trace'
    });
    
    // Reset connection state
    connection = null;
    channel = null;
    
    // Schedule reconnection with exponential backoff
    if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
      const backoffDelay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempt);
      reconnectAttempt++;
      
      logger.info(`Will attempt to reconnect in ${backoffDelay}ms (attempt ${reconnectAttempt})`);
      setTimeout(() => {
        setupQueueService().catch(err => {
          logger.error('Reconnection attempt failed:', err.message);
        });
      }, backoffDelay);
    } else {
      logger.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Will only try on demand.`);
      reconnectAttempt = Math.max(5, reconnectAttempt - 3); // Reduce backoff but don't reset completely
    }
    
    return false;
  } finally {
    isConnecting = false;
  }
}







let pingInterval = null;

function startConnectionPing() {
  // Clear any existing ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
  }

  // Ping every 15 seconds (less than the 30s heartbeat)
  pingInterval = setInterval(async () => {
    try {
      if (isConnectionReady()) {
        // Send a lightweight ping through the channel
        await channel.checkQueue('chat_requests');
        logger.debug('RabbitMQ connection ping successful');
      } else {
        logger.warn('RabbitMQ connection not ready during ping, reconnecting...');
        await setupQueueService();
      }
    } catch (error) {
      logger.error('Error during RabbitMQ ping:', formatError(error));
      await setupQueueService();
    }
  }, 15000);

  // Ensure the interval is cleared on process exit
  process.on('exit', () => {
    if (pingInterval) clearInterval(pingInterval);
  });
}

/**
 * Check if connection and channel are valid and ready
 * @returns {boolean} - True if connection is ready, false otherwise
 */
function isConnectionReady() {
  return connection && channel && connection.connection && connection.connection.writable && channel.connection && !channel.connection.closing && !channel.connection.closed;
}

/**
 * Format error objects for better logging
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error object
 */
function formatError(error) {
  if (!error) return { message: 'Unknown error (null or undefined)' };

  // Create a basic error object with standard properties
  const formattedError = {
    message: error.message || 'No error message provided',
    name: error.name || 'Error',
    stack: error.stack || 'No stack trace available',
  };

  // Add any additional properties from the error
  if (typeof error === 'object') {
    for (const key in error) {
      if (key !== 'message' && key !== 'name' && key !== 'stack') {
        formattedError[key] = error[key];
      }
    }
  }

  return formattedError;
}

/**
 * Clean up existing connections if they exist
 */
async function cleanupExistingConnections() {
  try {
    if (channel) {
      // Check if channel is open before trying to close it
      if (channel.connection && channel.connection.connection && !channel.closing && !channel.closed) {
        logger.debug('Closing existing RabbitMQ channel');
        await channel.close();
      } else {
        logger.debug('RabbitMQ channel already closed or closing');
      }
    }
  } catch (error) {
    logger.warn('Error closing existing RabbitMQ channel:', formatError(error));
  }

  try {
    if (connection) {
      // Check if connection is open before trying to close it
      if (connection.connection && connection.connection.writable && !connection.closing && !connection.closed) {
        logger.debug('Closing existing RabbitMQ connection');
        await connection.close();
      } else {
        logger.debug('RabbitMQ connection already closed or closing');
      }
    }
  } catch (error) {
    logger.warn('Error closing existing RabbitMQ connection:', formatError(error));
  }

  // Reset variables
  channel = null;
  connection = null;
}

/**
 * Handle connection errors
 */
function handleConnectionError(error) {
  logger.error('RabbitMQ connection error:', error);
  // Don't try to reconnect here, as the 'close' event will be emitted next
}

/**
 * Handle connection close events
 */
function handleConnectionClose() {
  logger.warn('RabbitMQ connection closed');

  // Clean up channel
  channel = null;

  // Attempt to reconnect
  setTimeout(async () => {
    try {
      await setupQueueService();
    } catch (error) {
      logger.error('Failed to reconnect to RabbitMQ:', error);
    }
  }, 5000);
}

/**
 * Handle channel errors
 */
function handleChannelError(error) {
  logger.error('RabbitMQ channel error:', error);
  // Don't try to recreate the channel here, as the 'close' event will be emitted next
}

/**
 * Handle channel close events
 */
function handleChannelClose() {
  logger.warn('RabbitMQ channel closed');

  // Only try to recreate the channel if the connection is still open
  if (connection && connection.connectionOpen) {
    setTimeout(async () => {
      try {
        channel = await connection.createChannel();
        channel.on('error', handleChannelError);
        channel.on('close', handleChannelClose);

        // Re-assert queues
        await channel.assertQueue('chat_requests', { durable: true });
        await channel.assertQueue('chat_responses', { durable: true });
        channel.prefetch(1);

        logger.info('RabbitMQ channel recreated');
      } catch (error) {
        logger.error('Failed to recreate RabbitMQ channel:', error);
      }
    }, 1000);
  }
}

/**
 * Set up connection and channel event handlers with duplicates prevention
 */
function setupConnectionHandlers() {
  // Remove any existing handlers to prevent duplicates
  if (connection) {
    connection.removeAllListeners('error');
    connection.removeAllListeners('close');

    // Set up new handlers
    connection.on('error', handleConnectionError);
    connection.on('close', handleConnectionClose);
  }

  if (channel) {
    channel.removeAllListeners('error');
    channel.removeAllListeners('close');

    // Set up new handlers
    channel.on('error', handleChannelError);
    channel.on('close', handleChannelClose);
  }
}




/**
 * Ensure connection is available or reconnect
 * @returns {Promise<boolean>} - Connection status
 */
async function ensureConnection() {
  // If we have a valid connection and channel, we're good
  if (connection && channel) {
    return true;
  }
  
  // If we're already connecting, wait briefly for that to finish
  if (isConnecting) {
    logger.debug('Connection already in progress, waiting...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (connection && channel) {
      return true;
    }
    
    throw new Error('Failed to establish connection after waiting');
  }
  
  // Try to reconnect
  const connected = await setupQueueService();
  
  if (!connected) {
    throw new Error('Failed to establish connection after reconnection attempt');
  }
  
  return true;
}




/**
 * Start health check interval
 */
function startHealthCheck() {
  healthCheckInterval = setInterval(async () => {
    // Check if too much time has passed since last successful operation
    const timeSinceLastSuccess = Date.now() - lastSuccessfulOperation;
    
    if (timeSinceLastSuccess > 60000) { // 1 minute
      logger.warn(`No successful operations for ${Math.round(timeSinceLastSuccess/1000)}s, checking connection health`);
      
      // Check if connection is actually working by trying a no-op
      if (connection && channel) {
        try {
          // Try to check queue status as a health check
          await channel.checkQueue('chat_requests');
          
          // Update last successful operation time
          lastSuccessfulOperation = Date.now();
          logger.info('Health check passed');
        } catch (error) {
          logger.warn('Health check failed, forcing reconnection:', error.message);
          
          // Force reconnection
          connection = null;
          channel = null;
          await setupQueueService();
        }
      } else if (!isConnecting) {
        // Try to reconnect if not already connecting
        logger.warn('Connection or channel not available during health check');
        await setupQueueService();
      }
    }
  }, HEALTH_CHECK_INTERVAL);
  
  // Ensure interval is cleaned up on process exit
  process.on('beforeExit', () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
  });
}





// /**
//  * Publish a message to a queue
//  * @param {string} queue - Queue name
//  * @param {Object} message - Message object
//  * @returns {Promise<boolean>} - Success indicator
//  */
// async function publishMessage(queue, message) {
//   try {
//     await ensureConnection();

//     // If connection isn't ready, try to reconnect
//     if (!isConnectionReady()) {
//       await setupQueueService();
//     }

//     // Double-check connection is now ready
//     if (!isConnectionReady()) {
//       throw new Error('Failed to establish connection to RabbitMQ');
//     }

//     if (!channel) {
//       await setupQueueService();
//     }

//     // Validate message
//     if (!message || typeof message !== 'object') {
//       throw new Error('Invalid message: Must be a valid object');
//     }

//     // Ensure the message can be serialized
//     const messageBuffer = Buffer.from(JSON.stringify(message));

//     return channel.sendToQueue(queue, messageBuffer, {
//       persistent: true,
//       // Add a timestamp and message ID for better tracking
//       timestamp: Date.now(),
//       messageId: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
//     });
//   } catch (error) {
//     logger.error(`Error publishing message to ${queue}:`, error);
//     return false;
//   }
// }







/**
 * Publish message to queue with failover to local queue
 * @param {string} queueName - Queue name
 * @param {Object} message - Message to send
 * @returns {Promise<boolean>} - Success indicator
 */
async function publishMessage(queueName, message) {
  // Try to publish to RabbitMQ
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Ensure we have a connection
      await ensureConnection();
      
      // Prepare message buffer
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      // Use mandatory flag for better delivery confirmation
      const published = await channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        mandatory: true,
        messageId: uuidv4(),
        timestamp: Date.now()
      });
      
      if (!published) {
        logger.warn(`Buffer full on attempt ${attempt}/3`);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }
      } else {
        // Update last successful operation time
        lastSuccessfulOperation = Date.now();
        
        logger.debug(`Published message to ${queueName}`, { 
          sessionId: message.sessionId
        });
        
        return true;
      }
    } catch (error) {
      logger.error(`Error publishing to ${queueName} (attempt ${attempt}/3):`, {
        message: error.message
      });
      
      // Force reconnection if channel is closed
      if (error.message.includes('channel closed') || !channel) {
        connection = null;
        channel = null;
        await setupQueueService();
      }
      
      // Backoff before retry
      if (attempt < 3) {
        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Publishing to RabbitMQ failed after all attempts
  logger.warn('Failed to publish message after 3 attempts');
  
  // Add to local queue for fallback processing if it's a request
  if (queueName === 'chat_requests' && message && message.sessionId && message.content) {
    addToLocalQueue(message);
  }
  
  return false;
}





/**
 * Add message to local queue for fallback handling
 * @param {Object} message - Message object
 */
function addToLocalQueue(message) {
  // Prevent queue overflow
  if (localMessageQueue.length >= LOCAL_QUEUE_LIMIT) {
    logger.warn(`Local queue limit reached (${LOCAL_QUEUE_LIMIT}), dropping oldest message`);
    localMessageQueue.shift();
  }
  
  // Add message with timestamp
  localMessageQueue.push({
    ...message,
    queueTimestamp: Date.now(),
    fromLocalQueue: true
  });
  
  logger.info(`Added message to local queue (size: ${localMessageQueue.length})`);
  
  // Start processing if not already processing
  if (!isProcessingLocalQueue) {
    processLocalQueue();
  }
}

/**
 * Process messages in local queue using fallback mechanism
 */
async function processLocalQueue() {
  // Prevent concurrent processing
  if (isProcessingLocalQueue || localMessageQueue.length === 0) {
    return;
  }
  
  isProcessingLocalQueue = true;
  logger.info(`Starting to process local queue (${localMessageQueue.length} messages)`);
  
  // Lazy-load dependencies to avoid circular references
  const { fallbackHandler } = require('./fallbackService');
  
  try {
    // Process messages one by one
    while (localMessageQueue.length > 0) {
      const message = localMessageQueue.shift();
      
      // Skip old messages (older than 2 minutes)
      if (Date.now() - message.queueTimestamp > 120000) {
        logger.warn(`Skipping stale message from ${new Date(message.queueTimestamp).toISOString()}`);
        continue;
      }
      
      try {
        // Process with fallback handler
        await fallbackHandler(message);
        
        // Allow a small break between messages
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        logger.error('Error in local queue processing:', {
          message: error.message,
          sessionId: message.sessionId
        });
      }
    }
  } finally {
    isProcessingLocalQueue = false;
    logger.info('Finished processing local queue');
  }
}






//ini consumeMessage Function yang tidak terpakai(old updated)

/**
 * Consume messages from a queue
 * @param {string} queue - Queue name
 * @param {Function} callback - Callback function
 * @returns {Promise<void>}
 */

// async function consumeMessages(queue, callback) {
//   try {
//     if (!channel) {
//       await setupQueueService();
//     }

//     channel.consume(queue, async (msg) => {
//       if (!msg) return;

//       try {
//         // Log the raw message for debugging
//         logger.debug(`Received raw message from ${queue}:`, msg.content.toString().substring(0, 200) + '...');

//         let content;
//         try {
//           content = JSON.parse(msg.content.toString());
//         } catch (parseError) {
//           logger.error(`Failed to parse message from ${queue}:`, formatError(parseError));
//           // Reject malformed messages immediately
//           channel.nack(msg, false, false);
//           return;
//         }

//         // Set a timeout for processing in case the callback hangs
//         const timeoutMs = 30000; // 30 seconds
//         const timeoutPromise = new Promise((_, reject) => {
//           setTimeout(() => reject(new Error(`Processing timeout after ${timeoutMs}ms`)), timeoutMs);
//         });

//         // Execute the callback with a timeout
//         try {
//           await Promise.race([callback(content), timeoutPromise]);
//           channel.ack(msg);
//           logger.debug(`Successfully processed message from ${queue}`);
//         } catch (callbackError) {
//           logger.error(`Error processing message from ${queue}:`, formatError(callbackError));

//           // Add context to the error log
//           logger.error(`Failed message details:`, {
//             queue,
//             messageId: msg.properties.messageId,
//             timestamp: msg.properties.timestamp,
//             contentPreview: JSON.stringify(content).substring(0, 200) + '...',
//           });

//           // Determine if we should requeue based on the error type
//           // For example, don't requeue if it's a validation error
//           const shouldRequeue = !(callbackError.name === 'ValidationError' || callbackError.message.includes('validation'));

//           channel.nack(msg, false, shouldRequeue);
//         }
//       } catch (error) {
//         logger.error(`Unexpected error handling message from ${queue}:`, formatError(error));
//         channel.nack(msg, false, false);
//       }
//     });

//     logger.info(`Started consuming messages from ${queue}`);
//   } catch (error) {
//     logger.error(`Error setting up consumer for ${queue}:`, formatError(error));
//     throw error;
//   }
// }




//ini consumeMessage Function yang tidak terpakai(old)
// async function consumeMessages(queue, callback) {
//   try {
//     if (!channel) {
//       await setupQueueService();
//     }

//     channel.consume(queue, async (msg) => {
//       if (!msg) return;

//       try {
//         const content = JSON.parse(msg.content.toString());
//         await callback(content);
//         channel.ack(msg);
//       } catch (error) {
//         logger.error(`Error processing message from ${queue}:`, error);
//         // Nack the message with requeue=false if it's a parsing error
//         // This prevents bad messages from blocking the queue
//         channel.nack(msg, false, false);
//       }
//     });

//     logger.info(`Started consuming messages from ${queue}`);
//   } catch (error) {
//     logger.error(`Error setting up consumer for ${queue}:`, error);
//     throw error;
//   }
// }


/**
 * Close connection gracefully
 */
async function closeConnection() {
  try {
    if (channel) {
      // Check if channel is still open before trying to close it
      if (channel.connection && channel.connection.connection && channel.connection.connection.writable) {
        await channel.close();
      }
    }

    if (connection) {
      // Check if connection is still open before trying to close it
      if (connection.connection && connection.connection.writable) {
        await connection.close();
      }
    }

    // Reset variables regardless of close success
    channel = null;
    connection = null;
    logger.info('Closed RabbitMQ connection');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', formatError(error));
    // Reset variables even if close failed
    channel = null;
    connection = null;
  }
}


/**
 * Consume messages from queue with reconnection
 * @param {string} queueName - Queue name
 * @param {Function} callback - Message handler
 */
async function consumeMessages(queueName, callback) {
  let isConsuming = false;
  let consumerTag = null;
  
  async function startConsumer() {
    if (isConsuming) return;
    
    try {
      isConsuming = true;
      logger.info(`Starting consumer for ${queueName}`);
      
      // Ensure connection is available
      await ensureConnection();
      
      // Set prefetch to limit concurrent processing
      await channel.prefetch(1);
      
      // Register consumer with acknowledgments
      const consumer = await channel.consume(queueName, async (msg) => {
        if (!msg) return;
        
        try {
          logger.debug(`Processing message from ${queueName}`);
          
          // Parse message
          const msgContent = JSON.parse(msg.content.toString());
          
          // Update last successful operation time
          lastSuccessfulOperation = Date.now();
          
          // Process message
          await callback(msgContent);
          
          // Acknowledge success
          channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing message from ${queueName}:`, {
            message: error.message
          });
          
          // Negative acknowledge with requeue=false to send to dead-letter queue
          channel.nack(msg, false, false);
        }
      });
      
      consumerTag = consumer.consumerTag;
      logger.info(`Consumer registered for ${queueName} with tag: ${consumerTag}`);
    } catch (error) {
      logger.error(`Failed to start consumer for ${queueName}:`, {
        message: error.message
      });
      
      isConsuming = false;
      
      // Schedule restart of consumer
      setTimeout(() => {
        logger.info(`Attempting to restart consumer for ${queueName}`);
        startConsumer().catch(err => {
          logger.error(`Error restarting consumer:`, err.message);
        });
      }, 5000);
    }
  }
  
  // Start consumer initially
  await startConsumer();
  
  // Set up connection monitoring for consumer
  setInterval(async () => {
    if (!connection || !channel || !isConsuming) {
      logger.info(`Consumer monitor detected disconnection for ${queueName}, restarting...`);
      isConsuming = false;
      await startConsumer().catch(err => {
        logger.error('Error in consumer monitor:', err.message);
      });
    }
  }, 30000);
}


/**
 * Get connection health status
 * @returns {Object} Health status
 */
function getConnectionHealth() {
  return {
    connected: !!(connection && channel),
    lastSuccessful: new Date(lastSuccessfulOperation).toISOString(),
    reconnectAttempts: reconnectAttempt,
    localQueueSize: localMessageQueue.length,
    timeSinceLastSuccess: Date.now() - lastSuccessfulOperation
  };
}







module.exports = {
  setupQueueService,
  publishMessage,
  consumeMessages,
  getConnectionHealth,
  addToLocalQueue
};
