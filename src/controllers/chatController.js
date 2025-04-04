const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { indexAllProducts } = require('../services/vectorService');
const { setupQueueService, consumeMessages, publishMessage } = require('../services/queueService');
const { setupRedisService, getChatHistory, storeUserContext, getUserContext } = require('../services/redisService');
const { generateResponse } = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let websocketService = null;


/**
 * Format error objects for better logging
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error object
 */
function formatError(error) {
  if (!error) return { message: 'Unknown error (null or undefined)' };
  
  
  
  try {
    // Create a basic error object with standard properties
    const formattedError = {
      message: error.message || 'No error message provided',
      name: error.name || 'Error'
    };
    
    // Include stack trace in development but not in production
    if (process.env.NODE_ENV !== 'production') {
      formattedError.stack = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
    }
    
    // Add any additional properties from the error that are safe to include
    const safeProps = ['code', 'status', 'statusCode'];
    safeProps.forEach(prop => {
      if (error[prop]) formattedError[prop] = error[prop];
    });
    
    // Include response status if available
    if (error.response && error.response.status) {
      formattedError.responseStatus = error.response.status;
    }
    
    return formattedError;
  } catch (e) {
    // If formatting the error itself causes an error, return a simplified object
    return { 
      message: String(error),
      formattingError: e.message
    };
  }



}





/**
 * Set websocket service for chat controller
 * @param {Object} service - WebSocket service
 */
function setChatWebSocketService(service) {
  websocketService = service;
}

/**
 * Initialize chat services
 * @returns {Promise<boolean>} - Success indicator
 */
async function initializeChatServices() {
  try {
    logger.info('Initializing chat services...');
    
    // Set up Redis
    await setupRedisService();
    
    // Set up RabbitMQ
    await setupQueueService();
    
// Set up message consumer
await consumeMessages('chat_responses', async (response) => {
  try {
    if (!websocketService) {
      logger.warn('WebSocket service not available for sending response');
      return;
    }
    
    if (!response || !response.sessionId) {
      logger.warn('Invalid response received from queue', { response });
      return;
    }


        // Turn off typing indicator if it was on
        if (typeof websocketService.sendTypingIndicator === 'function') {
          websocketService.sendTypingIndicator(response.sessionId, false);
        }

    
    websocketService.sendMessageToSession(
      response.sessionId, 
      {
        id: response.messageId || uuidv4(),
        content: response.content || "I'm sorry, I couldn't process that properly.",
        isFromUser: false,
        timestamp: new Date().toISOString(),
        metadata: response.metadata || {}
      }
    );
  } catch (error) {
    logger.error('Error sending response to websocket:', formatError(error));
  }
});
    
    // Start worker
    await startChatWorker();

    
    logger.info('Chat services initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing chat services:', error);
    return false;
  }
}



async function startChatWorker() {
  await consumeMessages('chat_requests', async (request) => {
    // Track each stage of processing for better error reporting
    const processingStage = { current: 'initializing' };
    const startTime = Date.now();
    
    try {
      // Validate request
      if (!request || !request.sessionId || !request.content) {
        throw new Error('Invalid chat request: Missing required fields');
      }
      
      logger.debug('Processing chat request', { 
        sessionId: request.sessionId,
        contentLength: request.content.length,
        userId: request.userId || 'anonymous'
      });
      
      // Track stage for better error reporting
      processingStage.current = 'fetching_history';
      
      // Get conversation history
      const history = await getConversationHistory(request.sessionId);
      
      processingStage.current = 'fetching_context';
      const context = await getUserContext(request.sessionId);
      
      // Send typing indicator to client immediately - WITH FEATURE CHECK
      if (websocketService) {
        processingStage.current = 'sending_typing_indicator';
        
        // Check if the method exists before calling it
        if (typeof websocketService.sendTypingIndicator === 'function') {
          websocketService.sendTypingIndicator(request.sessionId, true);
        } else {
          // Log as info, not error - it's just a missing feature
          logger.info('Typing indicator feature not available in websocketService');
        }
      }
      
      
      // Generate response with retry logic
      processingStage.current = 'generating_ai_response';
      let response;
      let attempts = 0;
      let lastError = null;




      // Try up to 3 times to get a response
      while (attempts < 3 && !response) {
        try {
          attempts++;
          logger.debug(`AI response generation attempt ${attempts}`);
          
          // Generate response with timeout
          response = await Promise.race([
            generateResponse(
              request.content,
              history,
              context,
              request.userId
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI response timeout after 25 seconds')), 25000)
            )
          ]);
        } catch (error) {
          lastError = error;
          logger.warn(`AI response generation attempt ${attempts} failed:`, formatError(error));
          
          // If this was our last attempt, we'll use the guaranteed fallback below
          if (attempts >= 3) break;
          
          // Wait before retrying (exponential backoff)
          const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 4000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }



      
      // If all attempts failed, use guaranteed fallback
      if (!response) {
        logger.warn(`All ${attempts} attempts to generate AI response failed, using guaranteed fallback`);
        
        // Determine if this is a product query
        const isProductQuestion = request.content.match(/shoe|sneaker|boot|size|color|red|blue|black|white/i);
        
        // Fallback message
        const fallbackMessage = isProductQuestion
          ? "I'd be happy to help you find the perfect shoes. We have various styles and colors available. For specific colors like red, we have options like the Chuck Taylor All Star and Authentic by Vans. Could you tell me more about what you're looking for?"
          : "I'm here to help with any questions about our shoes, shipping, or return policies. How can I assist you today?";
        
        response = {
          message: fallbackMessage,
          metadata: {
            fallback: true,
            error: true,
            attempts
          },
          updatedContext: {
            lastQuery: request.content
          }
        };
      }
      
      // Store bot's message
      processingStage.current = 'storing_bot_message';
      const botMessage = await prisma.chatMessage.create({
        data: {
          id: uuidv4(),
          sessionId: request.sessionId,
          content: response.message,
          isFromUser: false,
          metadata: response.metadata || undefined
        }
      });
      
      // Update context
      processingStage.current = 'updating_context';
      await storeUserContext(request.sessionId, {
        ...context,
        ...(response.updatedContext || {})
      });
      
      // Send response back
      processingStage.current = 'publishing_response';
      await publishMessage('chat_responses', {
        sessionId: request.sessionId,
        content: response.message,
        messageId: botMessage.id,
        metadata: response.metadata || {}
      });
      
      const processingTime = Date.now() - startTime;
      logger.info(`Chat request processed successfully in ${processingTime}ms`, {
        sessionId: request.sessionId,
        responseLength: response.message.length,
        processingTime
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Create a detailed error log with context
      const errorDetails = {
        stage: processingStage.current,
        sessionId: request?.sessionId,
        processingTime,
        error: formatError(error)
      };
      
      logger.error('Error processing chat request:', errorDetails);
      
      try {

         // Turn off typing indicator if there was an error
         if (websocketService && 
          typeof websocketService.sendTypingIndicator === 'function' && 
          request?.sessionId) {
        websocketService.sendTypingIndicator(request.sessionId, false);
      }


        // Only proceed if we have a valid session ID
        if (request && request.sessionId) {
          // Create a user-friendly error message
          const errorMessage = "I'm here to help you find the perfect shoes for your needs. Could you tell me what type of shoes you're looking for?";
          
          // Store error response in database
          const errorBotMessage = await prisma.chatMessage.create({
            data: {
              id: uuidv4(),
              sessionId: request.sessionId,
              content: errorMessage,
              isFromUser: false,
              metadata: { 
                error: true,
                errorStage: processingStage.current
              }
            }
          });
          
          // Send error response
          await publishMessage('chat_responses', {
            sessionId: request.sessionId,
            content: errorMessage,
            messageId: errorBotMessage.id,
            metadata: { 
              error: true,
              errorType: 'system_error',
              errorStage: processingStage.current 
            }
          });
        }
      } catch (secondaryError) {
        // If error handling itself fails, log that too
        logger.error('Error while handling chat error:', formatError(secondaryError));
      }
    }
  });
  
  logger.info('Chat worker started');
}



/**
 * Get conversation history
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<Array>} - Conversation history
 */
async function getConversationHistory(sessionId) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      take: 20
    });
    
    return messages.map(msg => ({
      role: msg.isFromUser ? 'user' : 'assistant',
      content: msg.content
    }));
  } catch (error) {
    logger.error('Error fetching conversation history:', formatError(error));
    return [];
  }
}




/**
 * API endpoint to trigger product indexing
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function indexProducts(req, res) {
  try {
    const result = await indexAllProducts();
    return res.json({ success: result, message: 'Product indexing completed' });
  } catch (error) {
    logger.error('Error in indexProducts endpoint:', formatError(error));
    return res.status(500).json({ success: false, error: 'Failed to index products' });
  }
}





/**
 * API endpoint to get chat history
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getChatHistoryById(req, res) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });
    
    return res.json({ success: true, messages });
  } catch (error) {
    logger.error('Error in getChatHistoryById endpoint:', formatError(error));
    return res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
}



module.exports = {
  setChatWebSocketService,
  initializeChatServices,
  indexProducts,
  getChatHistoryById
};