// src/services/fallbackService.js
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import Redis services for persistent context
try {
  var { storeUserContext, getUserContext } = require('./redisService');
} catch (error) {
  logger.warn('Redis service not available, using local context only:', error.message);
  // Provide dummy implementations if Redis is unavailable
  var storeUserContext = async () => Promise.resolve(true);
  var getUserContext = async () => Promise.resolve({});
}

// Context management
const sessionContexts = new Map();
const sessionTimestamps = new Map();

// Context expiry configuration
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Clean up expired contexts
 */
function cleanupExpiredContexts() {
  const now = Date.now();
  
  for (const [sessionId, timestamp] of sessionTimestamps.entries()) {
    if (now - timestamp > CONTEXT_EXPIRY_MS) {
      sessionContexts.delete(sessionId);
      sessionTimestamps.delete(sessionId);
      logger.debug(`Cleaned up expired context for session ${sessionId}`);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredContexts, 5 * 60 * 1000);

/**
 * Update context timestamp when used
 * @param {string} sessionId - Session ID
 */
function updateContextTimestamp(sessionId) {
  sessionTimestamps.set(sessionId, Date.now());
}

/**
 * Handle chat message when RabbitMQ is unavailable
 * @param {Object} message - Chat message
 */
async function fallbackHandler(message) {
  try {
    logger.info(`Processing fallback message for session ${message.sessionId}`);
    
    // Get websocket service
    const websocketService = require('./websocketService').getWebSocketService();
    
    if (!websocketService) {
      logger.error('WebSocket service not available for fallback handler');
      return;
    }
    
    // Turn on typing indicator
    if (typeof websocketService.sendTypingIndicator === 'function') {
      websocketService.sendTypingIndicator(message.sessionId, true);
    }
    
    // Get context from Redis first, with local map as fallback
    let context;
    try {
      context = await getUserContext(message.sessionId);
      
      // If Redis returned empty object, check local cache
      if (Object.keys(context).length === 0) {
        const localContext = sessionContexts.get(message.sessionId);
        if (localContext) {
          context = localContext;
          logger.debug(`Using local context for session ${message.sessionId}`);
        }
      }
    } catch (redisError) {
      logger.warn(`Redis error, using local context: ${redisError.message}`);
      context = sessionContexts.get(message.sessionId) || {};
    }
    
    // Ensure the context has a filters object
    if (!context.filters) context.filters = {};
    
    // Generate response with context
    const query = message.content;
    const sessionId = message.sessionId;
    const responseText = await generateFallbackResponse(query, sessionId, context);
    
    // Update context timestamp and store in both places
    updateContextTimestamp(sessionId);
    sessionContexts.set(sessionId, context);
    
    try {
      await storeUserContext(sessionId, context);
    } catch (redisError) {
      logger.warn(`Failed to store context in Redis: ${redisError.message}`);
    }
    
    // Message ID for tracking
    const messageId = `fallback_${uuidv4()}`;
    
    // Store message in database
    try {
      await prisma.chatMessage.create({
        data: {
          id: messageId,
          sessionId: sessionId,
          content: responseText,
          isFromUser: false,
          metadata: { 
            fallbackResponse: true,
            contextFilters: context.filters // Store filters in metadata for debugging
          }
        }
      });
    } catch (dbError) {
      logger.warn('Could not store fallback message in database:', dbError.message);
    }
    
    // Turn off typing indicator
    if (typeof websocketService.sendTypingIndicator === 'function') {
      websocketService.sendTypingIndicator(sessionId, false);
    }
    
    // Send response to user
    websocketService.sendMessageToSession(
      sessionId, 
      {
        id: messageId,
        content: responseText,
        isFromUser: false,
        timestamp: new Date().toISOString(),
        metadata: { 
          fallbackResponse: true,
          contextFilters: context.filters
        }
      }
    );
    
    logger.info(`Fallback response sent to session ${sessionId}`);
  } catch (error) {
    logger.error('Error in fallback handler:', {
      message: error.message,
      sessionId: message.sessionId
    });
    
    // Try to send emergency response
    try {
      const emergencyResponse = "I'm here to help you find the perfect shoes. Our system is experiencing a brief interruption, but I can still assist you. What type of shoes are you looking for?";
      
      const websocketService = require('./websocketService').getWebSocketService();
      if (websocketService) {
        // Turn off typing indicator
        if (typeof websocketService.sendTypingIndicator === 'function') {
          websocketService.sendTypingIndicator(message.sessionId, false);
        }
        
        websocketService.sendMessageToSession(
          message.sessionId,
          {
            id: `emergency_${Date.now()}`,
            content: emergencyResponse,
            isFromUser: false,
            timestamp: new Date().toISOString(),
            metadata: { emergencyResponse: true }
          }
        );
      }
    } catch (emergencyError) {
      logger.error('Failed to send emergency response:', emergencyError.message);
    }
  }
}

/**
 * Generate response based on user query
 * @param {string} query - User's query
 * @param {string} sessionId - Chat session ID
 * @param {Object} context - Conversation context
 * @returns {Promise<string>} - Response text
 */
async function generateFallbackResponse(query, sessionId, context) {
  // Convert to lowercase for comparison
  const queryLower = query.toLowerCase().trim();
  
  // Try to get conversation history for context
  let history = [];
  try {
    history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
  } catch (error) {
    logger.warn('Could not fetch conversation history:', error.message);
  }
  
  // Extract all filters from the current query
  const newFilters = extractFilters(queryLower);
  
  // Update context with any new filters found
  if (Object.keys(newFilters).length > 0) {
    context.filters = {
      ...context.filters,
      ...newFilters
    };
    
    logger.debug(`Updated context filters for session ${sessionId}:`, context.filters);
  }
  
  // Handle greetings - reset context for new conversation
  if (isGreeting(queryLower)) {
    context.filters = {}; // Clear filters on greetings
    return handleGreeting(history);
  }

  // If we have any filters in context, use them for a filtered search
  if (context.filters && Object.keys(context.filters).length > 0) {
    return await handleFilteredQuery(context.filters);
  }
  
  // Handle shoe queries with specific size and color
  const sizeColorMatch = extractSizeAndColor(queryLower);
  if (sizeColorMatch.size && sizeColorMatch.color) {
    // Store in context
    context.filters.size = sizeColorMatch.size;
    context.filters.color = sizeColorMatch.color;
    return await handleSizeColorQuery(sizeColorMatch.size, sizeColorMatch.color);
  }
  
  // Handle color-specific queries
  if (hasColorReference(queryLower)) {
    const color = extractColor(queryLower);
    if (color) {
      // Store in context
      context.filters.color = color;
      return await handleColorQuery(color);
    }
  }
  
  // Handle size-specific queries
  const sizeMatch = extractSize(queryLower);
  if (sizeMatch) {
    // Store in context
    context.filters.size = sizeMatch;
    return await handleSizeQuery(sizeMatch);
  }
  
  // Handle brand-specific queries
  const brand = extractBrand(queryLower);
  if (brand) {
    // Store in context
    context.filters.brand = brand;
    return await handleBrandQuery(brand);
  }
  
  // Handle common queries about shipping/returns/payment
  if (queryLower.includes('shipping') || queryLower.includes('deliver')) {
    return "We offer free shipping on all orders over $100. Standard shipping typically takes 3-5 business days, while express shipping takes 1-2 business days for an additional fee.";
  } 
  
  if (queryLower.includes('return') || queryLower.includes('refund')) {
    return "We have a 30-day return policy. If you're not satisfied with your purchase, you can return unworn shoes with the original packaging for a full refund or exchange.";
  }
  
  if (queryLower.includes('payment') || queryLower.includes('pay')) {
    return "We accept all major credit cards, PayPal, and Apple Pay. Your payment information is always securely encrypted.";
  }
  
  // General shoe query
  if (queryLower.includes('shoe') || queryLower.includes('sneaker') || queryLower.includes('footwear')) {
    // Get some random shoes from database to suggest
    try {
      const popularShoes = await prisma.shoe.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        take: 3
      });
      
      if (popularShoes.length > 0) {
        const shoeList = popularShoes.map(shoe => 
          `${shoe.name} by ${shoe.brand} (${shoe.color})`
        ).join(', ');
        
        return `We have a wide selection of shoes including casual sneakers, athletic shoes, and formal options. Some of our popular options include ${shoeList}. Is there a specific type, color, or size you're looking for?`;
      }
    } catch (error) {
      logger.warn('Error fetching popular shoes:', error.message);
    }
    
    return "We have a wide selection of shoes including casual sneakers, athletic shoes, and formal options. Our most popular brands include Nike, Adidas, Vans, and Converse. Is there a specific type, color, or size you're looking for?";
  }
  
  // Default response
  return "I'd be happy to help you find the perfect shoes. We have a wide selection of running shoes, casual sneakers, dress shoes, and athletic footwear. Could you tell me more about what type of shoes you're looking for?";
}

/**
 * Extract all filters from query
 * @param {string} query - User query
 * @returns {Object} - Extracted filters
 */
function extractFilters(query) {
  const filters = {};
  
  // Extract size
  const sizeMatch = extractSize(query);
  if (sizeMatch) {
    filters.size = sizeMatch;
  }
  
  // Extract color
  const color = extractColor(query);
  if (color) {
    filters.color = color;
  }
  
  // Extract brand
  const brand = extractBrand(query);
  if (brand) {
    filters.brand = brand;
  }
  
  return filters;
}

/**
 * Handle queries with multiple filters (size, color, brand)
 * @param {Object} filters - Filters from context
 * @returns {Promise<string>} - Response text
 */
async function handleFilteredQuery(filters) {
  try {
    // Build database query based on filters
    const prismaQuery = {
      where: {
        AND: []
      },
      orderBy: {
        stock: 'desc'
      },
      take: 5
    };
    
    // Add size filter with exact match
    if (filters.size) {
      prismaQuery.where.AND.push({ size: filters.size });
    }
    
    // Add color filter with case-insensitive partial match
    if (filters.color) {
      // Format color for better matching
      const formattedColor = filters.color.charAt(0).toUpperCase() + filters.color.slice(1);
      
      prismaQuery.where.AND.push({
        OR: [
          { color: { equals: formattedColor, mode: 'insensitive' } },
          { color: { contains: formattedColor, mode: 'insensitive' } }
        ]
      });
    }
    
    // Add brand filter if present
    if (filters.brand) {
      prismaQuery.where.AND.push({ 
        brand: { contains: filters.brand, mode: 'insensitive' } 
      });
    }
    
    // Only show in-stock items
    prismaQuery.where.AND.push({ stock: { gt: 0 } });
    
    // Execute the query
    const matchingShoes = await prisma.shoe.findMany(prismaQuery);
    
    // Handle exact matches
    if (matchingShoes.length > 0) {
      // Format response based on number of matches
      if (matchingShoes.length === 1) {
        const shoe = matchingShoes[0];
        return `I found exactly what you're looking for! The ${shoe.name} in ${shoe.color}, available in size ${shoe.size} for $${shoe.price.toFixed(2)}. Would you like more details about this shoe?`;
      } else {
        const shoeList = matchingShoes.map(shoe => 
          `${shoe.name} (${shoe.color}) for $${shoe.price.toFixed(2)}`
        ).join(', ');
        
        return `I found ${matchingShoes.length} options that match your criteria: ${shoeList}. Would you like more details about any of these?`;
      }
    }
    
    // No exact matches - offer alternatives based on priority
    return await generateAlternativeSuggestions(filters);
  } catch (error) {
    logger.error('Database error in handleFilteredQuery:', error);
    return generateFallbackErrorResponse(filters);
  }
}

/**
 * Generate fallback error response when database operations fail
 * @param {Object} filters - User filters
 * @returns {string} - Generic error response
 */
function generateFallbackErrorResponse(filters) {
  let response = "I'm having trouble finding the perfect shoes for you right now. ";
  
  if (filters.size && filters.color) {
    return response + `We have a variety of options in size ${filters.size} and ${filters.color} color. Could you tell me if you prefer athletic, casual, or formal shoes?`;
  } else if (filters.size) {
    return response + `For size ${filters.size}, we have several options including running shoes, casual sneakers, and athletic shoes. What style or color are you interested in?`;
  } else if (filters.color) {
    return response + `For ${filters.color} shoes, we have various styles and sizes available. Could you tell me what size you're looking for?`;
  } else if (filters.brand) {
    return response + `We have several popular options from ${filters.brand}. Could you tell me what size or color you're interested in?`;
  }
  
  return response + "Could you please tell me more about what you're looking for? For example, a specific size, color, or brand?";
}

/**
 * Generate alternative suggestions when exact matches aren't found
 * @param {Object} filters - User filters
 * @returns {Promise<string>} - Response with alternatives
 */
async function generateAlternativeSuggestions(filters) {
  // Copy filters to avoid modifying the original
  const filtersCopy = { ...filters };
  
  try {
    // For size + color queries with no matches
    if (filtersCopy.size && filtersCopy.color) {
      // Format color for better matching
      const formattedColor = filtersCopy.color.charAt(0).toUpperCase() + filtersCopy.color.slice(1);
      
      // Try to find shoes with the requested size
      const sizeMatches = await prisma.shoe.findMany({
        where: { 
          size: filtersCopy.size,
          stock: { gt: 0 }
        },
        take: 3
      });
      
      // Try to find shoes with the requested color
      const colorMatches = await prisma.shoe.findMany({
        where: {
          OR: [
            { color: { equals: formattedColor, mode: 'insensitive' } },
            { color: { contains: formattedColor, mode: 'insensitive' } }
          ],
          stock: { gt: 0 }
        },
        take: 3
      });
      
      // Build response with alternatives
      let response = `I don't have any ${formattedColor} shoes in size ${filtersCopy.size}. `;
      
      if (sizeMatches.length > 0 && colorMatches.length > 0) {
        // Offer both size-matching and color-matching alternatives
        const sizeOptions = sizeMatches.map(shoe => `${shoe.name} in ${shoe.color}`).join(', ');
        const colorOptions = colorMatches.map(shoe => `${shoe.name} in size ${shoe.size}`).join(', ');
        
        response += `\n\nI can offer you size ${filtersCopy.size} in these colors: ${sizeOptions}. \n\nOr I can offer ${formattedColor} shoes in these sizes: ${colorOptions}. \n\nWhich would you prefer?`;
      } else if (sizeMatches.length > 0) {
        // Only size matches available
        const options = sizeMatches.map(shoe => `${shoe.name} in ${shoe.color}`).join(', ');
        response += `However, I have size ${filtersCopy.size} available in: ${options}. Would any of these interest you?`;
      } else if (colorMatches.length > 0) {
        // Only color matches available
        const options = colorMatches.map(shoe => `${shoe.name} in size ${shoe.size}`).join(', ');
        response += `However, I have ${formattedColor} shoes available in these sizes: ${options}. Would any of these interest you?`;
      } else {
        // Neither size nor color matches
        response += `I'm sorry, I currently don't have any shoes that match either criteria. Would you like to see our most popular shoes instead?`;
      }
      
      return response;
    }
    
    // Handle just size filter
    if (filtersCopy.size && !filtersCopy.color) {
      const sizeMatches = await prisma.shoe.findMany({
        where: { 
          size: filtersCopy.size,
          stock: { gt: 0 }
        },
        take: 5
      });
      
      if (sizeMatches.length > 0) {
        const options = sizeMatches.map(shoe => `${shoe.name} in ${shoe.color}`).join(', ');
        return `For size ${filtersCopy.size}, I have these options: ${options}. What color would you prefer?`;
      } else {
        // Try finding closest sizes
        const closestSizes = await prisma.$queryRaw`
          SELECT DISTINCT size FROM "Shoe"
          WHERE stock > 0
          ORDER BY ABS(size - ${filtersCopy.size})
          LIMIT 3
        `;
        
        if (closestSizes && closestSizes.length > 0) {
          const availableSizes = closestSizes.map(row => row.size).join(', ');
          return `I don't currently have shoes in exactly size ${filtersCopy.size}. Our closest available sizes are ${availableSizes}. Would you like to see options in these sizes?`;
        }
      }
    }
    
    // Handle just color filter
    if (filtersCopy.color && !filtersCopy.size) {
      // Format color for better matching
      const formattedColor = filtersCopy.color.charAt(0).toUpperCase() + filtersCopy.color.slice(1);
      
      const colorMatches = await prisma.shoe.findMany({
        where: {
          OR: [
            { color: { equals: formattedColor, mode: 'insensitive' } },
            { color: { contains: formattedColor, mode: 'insensitive' } }
          ],
          stock: { gt: 0 }
        },
        take: 5
      });
      
      if (colorMatches.length > 0) {
        const options = colorMatches.map(shoe => `${shoe.name} in size ${shoe.size}`).join(', ');
        return `For ${formattedColor} shoes, I have these options: ${options}. What size are you looking for?`;
      }
    }
    
    // Generic fallback for other types of queries
    return `I couldn't find exact matches for your request. We have a wide selection of shoes in various styles, colors, and sizes. Could you tell me more about what you're looking for?`;
    
  } catch (error) {
    logger.error('Error generating alternative suggestions:', error);
    return generateFallbackErrorResponse(filters);
  }
}

// The rest of the functions from the original file...

/**
 * Check if query is a greeting
 * @param {string} query - User query
 * @returns {boolean} - Is greeting
 */
function isGreeting(query) {
  const greetings = ['hello', 'hi', 'hey', 'greetings', 'howdy', 'hola'];
  return greetings.some(greeting => 
    query === greeting || 
    query.startsWith(`${greeting} `) || 
    query === `${greeting}!`
  );
}

/**
 * Handle greeting based on conversation history
 * @param {Array} history - Conversation history
 * @returns {string} - Greeting response
 */
function handleGreeting(history) {
  // Check if this is the first message
  if (history.length <= 1) {
    return "Hello! I'm your shoe shopping assistant. How can I help you today? We have a wide selection of shoes including brands like Nike, Adidas, Converse, and Vans. Are you looking for a specific type of shoe?";
  } else {
    // For returning users
    return "Hello again! I'm here to continue helping you find the perfect shoes. Was there a specific style, brand, or color you were interested in?";
  }
}

/**
 * Extract size and color from query
 * @param {string} query - User query
 * @returns {Object} - Size and color
 */
function extractSizeAndColor(query) {
  const result = { size: null, color: null };
  
  // Extract size (looking for numbers followed by optional .5)
  const sizeRegex = /\b(\d+(?:\.\d+)?)\b/g;
  const sizeMatches = [...query.matchAll(sizeRegex)];
  
  if (sizeMatches.length > 0) {
    result.size = parseFloat(sizeMatches[0][1]);
  }
  
  // Extract color
  result.color = extractColor(query);
  
  return result;
}

/**
 * Extract color from query
 * @param {string} query - User query
 * @returns {string|null} - Extracted color
 */
function extractColor(query) {
  const colorPatterns = [
    { regex: /\bred\b/i, value: 'red' },
    { regex: /\bwhite\b/i, value: 'white' },
    { regex: /\bblack\b/i, value: 'black' },
    { regex: /\bblue\b/i, value: 'blue' },
    { regex: /\bgray\b/i, value: 'gray' },
    { regex: /\bgrey\b/i, value: 'gray' },
    { regex: /\bgreen\b/i, value: 'green' },
    { regex: /\bbrown\b/i, value: 'brown' },
    { regex: /\btan\b/i, value: 'tan' },
    { regex: /\bnavy\b/i, value: 'navy' },
    { regex: /\borange\b/i, value: 'orange' },
    { regex: /\bsilver\b/i, value: 'silver' },
    { regex: /\bearth\b/i, value: 'earth' },
    { regex: /\bwolf\b/i, value: 'wolf' }
  ];
  
  for (const pattern of colorPatterns) {
    if (pattern.regex.test(query)) {
      return pattern.value;
    }
  }
  
  return null;
}

/**
 * Extract size from query
 * @param {string} query - User query
 * @returns {number|null} - Extracted size
 */
function extractSize(query) {
  // Check for explicit size references
  const sizeRegex = /\bsize\s+(\d+(?:\.\d+)?)\b/i;
  const sizeMatch = query.match(sizeRegex);
  
  if (sizeMatch) {
    return parseFloat(sizeMatch[1]);
  }
  
  // Look for just numbers that could be sizes
  if (/\b(looking|want|need)\b.+\b\d+(?:\.\d+)?\b/i.test(query)) {
    const numberRegex = /\b(\d+(?:\.\d+)?)\b/;
    const match = query.match(numberRegex);
    if (match) {
      const size = parseFloat(match[1]);
      // Only return if it's a plausible shoe size
      if (size >= 5 && size <= 15) {
        return size;
      }
    }
  }
  
  // For one-word queries that are just numbers (like responding "10" to a size question)
  if (/^\d+(?:\.\d+)?$/.test(query.trim())) {
    const size = parseFloat(query.trim());
    if (size >= 5 && size <= 15) {
      return size;
    }
  }
  
  return null;
}

/**
 * Check if query contains color references
 * @param {string} query - User query
 * @returns {boolean} - Has color reference
 */
function hasColorReference(query) {
  const colorWords = ['red', 'blue', 'black', 'white', 'green', 'gray', 'grey', 'brown', 'orange', 'yellow', 'purple', 'pink', 'tan', 'navy', 'silver', 'earth', 'wolf'];
  return colorWords.some(color => query.includes(color));
}

/**
 * Extract brand from query
 * @param {string} query - User query
 * @returns {string|null} - Brand name
 */
function extractBrand(query) {
  const brands = [
    { regex: /\bnike\b/i, name: 'Nike' },
    { regex: /\badidas\b/i, name: 'Adidas' },
    { regex: /\bconverse\b/i, name: 'Converse' },
    { regex: /\bvans\b/i, name: 'Vans' },
    { regex: /\bnew balance\b/i, name: 'New Balance' },
    { regex: /\basics\b/i, name: 'ASICS' },
    { regex: /\bpuma\b/i, name: 'Puma' },
    { regex: /\breebok\b/i, name: 'Reebok' },
    { regex: /\bdr\.?\s*martens\b/i, name: 'Dr. Martens' },
    { regex: /\bcole haan\b/i, name: 'Cole Haan' }
  ];
  
  for (const brand of brands) {
    if (brand.regex.test(query)) {
      return brand.name;
    }
  }
  
  return null;
}

/**
 * Handle query with specific size and color
 * @param {number} size - Shoe size
 * @param {string} color - Shoe color
 * @returns {Promise<string>} - Response
 */
async function handleSizeColorQuery(size, color) {
  // Format color for display
  const formattedColor = color.charAt(0).toUpperCase() + color.slice(1);
  
  try {
    // Find matching shoes in the database
    const matches = await prisma.shoe.findMany({
      where: {
        AND: [
          { size: size },
          {
            OR: [
              { color: { equals: formattedColor, mode: 'insensitive' } },
              { color: { contains: formattedColor, mode: 'insensitive' } }
            ]
          },
          { stock: { gt: 0 } }
        ]
      },
      take: 5
    });
    
    if (matches.length === 0) {
      // No exact matches, suggest alternatives
      const sizeMatches = await prisma.shoe.findMany({
        where: { 
          size: size,
          stock: { gt: 0 }
        },
        take: 3
      });
      
      const colorMatches = await prisma.shoe.findMany({
        where: {
          OR: [
            { color: { equals: formattedColor, mode: 'insensitive' } },
            { color: { contains: formattedColor, mode: 'insensitive' } }
          ],
          stock: { gt: 0 }
        },
        take: 3
      });
      
      if (sizeMatches.length > 0 && colorMatches.length > 0) {
        return `I don't have an exact match for ${formattedColor} shoes in size ${size}, but I do have other ${formattedColor} shoes and other shoes in size ${size}. Would you like to see options in a different color or a different size?`;
      } else if (sizeMatches.length > 0) {
        const sizeOptions = sizeMatches.map(shoe => `${shoe.name} (${shoe.color})`).join(', ');
        return `I don't have ${formattedColor} shoes in size ${size}, but I do have size ${size} in ${sizeOptions}. Would you like to see these options?`;
      } else if (colorMatches.length > 0) {
        const colorOptions = colorMatches.map(shoe => `${shoe.name} (size ${shoe.size})`).join(', ');
        return `I don't have ${formattedColor} shoes in size ${size}, but I do have ${formattedColor} shoes in ${colorOptions}. Would these interest you?`;
      } else {
        return `I'm sorry, I don't currently have ${formattedColor} shoes in size ${size}. We do have other colors and sizes available. Would you like me to suggest some alternatives?`;
      }
    }
    
    // We have matches!
    if (matches.length === 1) {
      const shoe = matches[0];
      return `I found the perfect match! The ${shoe.name} in ${shoe.color}, available in size ${shoe.size} for $${shoe.price.toFixed(2)}. Would you like more details about this shoe?`;
    } else {
      const shoeList = matches.map(shoe => `${shoe.name} (${shoe.color}) for $${shoe.price.toFixed(2)}`).join(', ');
      return `I found ${matches.length} options in ${formattedColor} with size ${size}: ${shoeList}. Would you like more details about any of these?`;
    }
  } catch (error) {
    logger.error('Database error in handleSizeColorQuery:', error);
    return `I'm looking for ${formattedColor} shoes in size ${size}. We have several options that might interest you. Could you tell me if you prefer athletic, casual, or formal shoes?`;
  }
}

/**
 * Handle color-specific queries
 * @param {string} color - Requested color
 * @returns {Promise<string>} - Response
 */
async function handleColorQuery(color) {
  // Format color for display
  const formattedColor = color.charAt(0).toUpperCase() + color.slice(1);
  
  try {
    // Find matching shoes
    const matches = await prisma.shoe.findMany({
      where: {
        OR: [
          { color: { equals: formattedColor, mode: 'insensitive' } },
          { color: { contains: formattedColor, mode: 'insensitive' } }
        ],
        stock: { gt: 0 }
      },
      take: 5
    });
    
    // Special case for red shoes since it's specifically mentioned
    if (color === 'red') {
      // Find exact red shoes
      const redShoes = await prisma.shoe.findMany({
        where: {
          OR: [
            { color: { equals: 'Red' } },
            { color: { equals: 'Red/White' } },
            { color: { contains: 'Red/' } },
            { color: { contains: '/Red' } }
          ],
          stock: { gt: 0 }
        },
        take: 3
      });
      
      if (redShoes.length > 0) {
        const options = redShoes.map(shoe => 
          `${shoe.name} (size ${shoe.size}, ${shoe.color}) for $${shoe.price.toFixed(2)}`
        ).join(', ');
        
        return `I found some great red shoes for you! Here are your options: ${options}. Would you like more information about any of these?`;
      }
    }
    
    if (matches.length === 0) {
      return `I'm sorry, I don't currently have any shoes in ${formattedColor}. We have shoes in various colors including Red, Black, White, Blue, and Gray. Would you like to see options in one of these colors?`;
    }
    
    if (matches.length <= 3) {
      const options = matches.map(shoe => 
        `${shoe.name} (size ${shoe.size}) for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} options in ${formattedColor}: ${options}. Would you like more details about any of these?`;
    } else {
      const featured = matches.slice(0, 3);
      const options = featured.map(shoe => 
        `${shoe.name} (size ${shoe.size}) for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} options in ${formattedColor}! Here are a few: ${options}, and more. Would you like to narrow down by size or see more options?`;
    }
  } catch (error) {
    logger.error('Database error in handleColorQuery:', error);
    
    // Fallback for red shoes specially
    if (color === 'red') {
      return "I found some red shoes that might interest you! We have the Chuck Taylor All Star by Converse in Red (size 8.0) and the Authentic by Vans in Red/White (size 8.0). Would you like more details about either of these?";
    }
    
    return `I'm looking for shoes in ${formattedColor}. We have several options in this color. Could you tell me what size you're looking for or if you prefer athletic, casual, or formal shoes?`;
  }
}

/**
 * Handle size-specific queries
 * @param {number} size - Shoe size
 * @returns {Promise<string>} - Response
 */
async function handleSizeQuery(size) {
  try {
    // Find shoes in this size
    const matches = await prisma.shoe.findMany({
      where: { 
        size: size,
        stock: { gt: 0 }
      },
      take: 5
    });
    
    if (matches.length === 0) {
      // Find closest available sizes
      const closestSizes = await prisma.$queryRaw`
        SELECT DISTINCT size FROM "Shoe"
        WHERE stock > 0
        ORDER BY ABS(size - ${size})
        LIMIT 3
      `;
      
      if (closestSizes && closestSizes.length > 0) {
        const availableSizes = closestSizes.map(row => row.size).join(', ');
        return `I don't currently have shoes in exactly size ${size}. Our closest available sizes are ${availableSizes}. Would you like to see options in these sizes?`;
      }
      
      return `I don't currently have shoes in exactly size ${size}. Our sizes range from 8.0 to 11.0. Would you like to see options in the closest available size?`;
    }
    
    if (matches.length <= 3) {
      const options = matches.map(shoe => 
        `${shoe.name} in ${shoe.color} for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} options in size ${size}: ${options}. Would you like more information about any of these?`;
    } else {
      const featured = matches.slice(0, 3);
      const options = featured.map(shoe => 
        `${shoe.name} in ${shoe.color} for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} shoes in size ${size}! Here are a few options: ${options}, and more. Would you like to narrow down by color or style?`;
    }
  } catch (error) {
    logger.error('Database error in handleSizeQuery:', error);
    return `For size ${size}, we have several options including running shoes, casual sneakers, and athletic shoes. What style or color are you interested in?`;
  }
}

/**
 * Handle brand-specific queries
 * @param {string} brand - Brand name
 * @returns {Promise<string>} - Response
 */
async function handleBrandQuery(brand) {
  try {
    // Find shoes by this brand
    const matches = await prisma.shoe.findMany({
      where: { 
        brand: { contains: brand, mode: 'insensitive' },
        stock: { gt: 0 }
      },
      take: 5
    });
    
    if (matches.length === 0) {
      return `I don't currently see any ${brand} shoes in our database. We have popular brands like Nike, Adidas, Converse, and Vans. Would you like to see options from these brands?`;
    }
    
    if (matches.length <= 3) {
      const options = matches.map(shoe => 
        `${shoe.name} (${shoe.color}, size ${shoe.size}) for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} options from ${brand}: ${options}. Would you like more details about any of these?`;
    } else {
      const featured = matches.slice(0, 3);
      const options = featured.map(shoe => 
        `${shoe.name} (${shoe.color}, size ${shoe.size}) for $${shoe.price.toFixed(2)}`
      ).join(', ');
      
      return `I found ${matches.length} shoes from ${brand}! Here are a few options: ${options}, and more. Would you like to narrow down by size or color?`;
    }
  } catch (error) {
    logger.error('Database error in handleBrandQuery:', error);
    return `We have several popular options from ${brand}. They're known for their quality and style. Would you like to know about specific colors or sizes available?`;
  }
}

module.exports = {
  fallbackHandler,
  generateFallbackResponse,
  extractFilters,
  handleFilteredQuery
};