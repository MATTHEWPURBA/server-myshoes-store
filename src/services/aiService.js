const axios = require('axios');
const logger = require('../utils/logger');
const { getCachedResponse, cacheResponse } = require('./redisService');
const { findRelevantProducts } = require('./vectorService');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';
// Use a smaller model as backup

const HUGGINGFACE_MODELS = [
  // Primary model (larger but might be slower)
  process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2'
];

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Simple in-memory cache for common responses
const localResponseCache = new Map();

// Flag to track if we've warmed up the model
let isModelWarmedUp = false;

// Circuit breaker configuration
let apiFailureCount = 0;
const MAX_API_FAILURES = 5;
const API_FAILURE_RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes


// Reset circuit breaker after interval
setInterval(() => {
  if (apiFailureCount > 0) {
    logger.info(`Resetting API failure counter from ${apiFailureCount} to 0`);
    apiFailureCount = 0;
  }
}, API_FAILURE_RESET_INTERVAL);






/**
 * Safely extract important info from error objects to avoid circular references
 * @param {Error} error - Error object
 * @returns {Object} - Safe error object for logging
 */
function safeErrorObject(error) {
  if (!error) return { message: 'Unknown error (null or undefined)' };
  
  try {
    return {
      message: error.message || 'No message',
      name: error.name || 'Error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code
    };
  } catch (e) {
    return { message: 'Error extracting error details', originalError: String(error) };
  }
}






/**
 * Send warming request to initialize model on Hugging Face
 */
async function warmupModel() {
  if (isModelWarmedUp) return;
  
  try {
    logger.info('Pre-warming Hugging Face model...');
    
    // Send a simple request to warm up the model
    await axios.post(
      `${HUGGINGFACE_API_URL}${HUGGINGFACE_MODELS[0]}`,
      { inputs: "Hello, how can you help me with shoes?" },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for warmup
      }
    );
    
    isModelWarmedUp = true;
    logger.info('Hugging Face model successfully warmed up');
  } catch (error) {
    logger.warn('Failed to warm up model, will try on first request', error.message);
  }
}


/**
 * Generate response using Hugging Face API
 * @param {string} query - User query
 * @param {Array} history - Conversation history
 * @param {Object} context - Conversation context
 * @param {number} userId - User ID (optional)
 * @returns {Promise<Object>} - Response object
 */
async function generateResponse(query, history, context = {}, userId) {
  try {

    // Check local cache first (for ultra-fast responses)
    const localCacheKey = normalizeQuery(query);
    if (localResponseCache.has(localCacheKey)) {
      logger.info('Using local cached response for query:', query);
      return localResponseCache.get(localCacheKey);
    }

    // Check cache for common queries
    const cachedResponse = await getCachedResponse(query);
    if (cachedResponse) {
      // Store in local cache too
      localResponseCache.set(localCacheKey, cachedResponse);
      logger.info('Using cached response for query:', query);
      return cachedResponse;
    }
    
    // Check if circuit breaker is open
    if (apiFailureCount >= MAX_API_FAILURES) {
      logger.warn(`Circuit breaker open (${apiFailureCount} failures), using fallback response`);
      return generateLocalResponse(query, history, context);
    }



    // Check if this is a product query
    const isProductQuery = query.match(/shoe|sneaker|footwear|boot|size|fit|brand|color|red|blue|black|white/i);
    let relevantProducts = [];
    
    // For product queries, search the vector database
    if (isProductQuery) {
      try {
        relevantProducts = await findRelevantProducts(query, 3);
        logger.info(`Found ${relevantProducts.length} relevant products for query "${query}"`);
      } catch (searchError) {
        logger.error(`Error searching products: ${searchError.message}`);
        // Continue without products if search fails
      }
    }

    

    // Handle greeting or simple queries with direct responses
    const simpleResponse = handleSimpleQuery(query);
    if (simpleResponse) {
      logger.info(`Using simple response handler for query: "${query}"`);
      
      const result = {
        message: simpleResponse,
        metadata: {
          intent: detectIntent(query),
          sentiment: detectSentiment(query),
          handled: "simple_response"
        },
        updatedContext: {
          lastQuery: query
        }
      };
      
      // Cache these simple responses
      localResponseCache.set(normalizeQuery(query), result);
      return result;
    }




    // Create prompt with context and product information
    let prompt = createPrompt(query, history, relevantProducts, context, userId);
    
    // Variable to hold response
    let aiResponse = null;
    let modelUsed = null;
    
    // Try primary and backup models with retry logic
    for (let modelIdx = 0; modelIdx < HUGGINGFACE_MODELS.length; modelIdx++) {
      const model = HUGGINGFACE_MODELS[modelIdx];
      
      // Try up to 3 times with exponential backoff
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const timeout = 30000 + (attempt * 10000); // Increase timeout with each retry
          
          logger.info(`Calling Hugging Face API (model: ${model}, attempt: ${attempt + 1}, timeout: ${timeout}ms)`);
          
          const response = await axios.post(
            `${HUGGINGFACE_API_URL}${model}`,
            { inputs: prompt },
            {
              headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: timeout // Adaptive timeout
            }
          );
          
          // Extract the response based on model's output format
          if (Array.isArray(response.data)) {
            aiResponse = response.data[0].generated_text || '';
            
            // Extract just the assistant's response if the model returns the full conversation
            const assistantPrefix = '[ASSISTANT]:';
            if (aiResponse.includes(assistantPrefix)) {
              const parts = aiResponse.split(assistantPrefix);
              aiResponse = parts[parts.length - 1].trim();
            }
          } else {
            aiResponse = response.data.generated_text || '';
          }
          
          modelUsed = model;
          
          // If we succeeded, break out of retry loop
          break;
          
        } catch (error) {
          const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
          const isRateLimit = error.response?.status === 429;
          const isAuthError = error.response?.status === 401 || error.response?.status === 403;


          // Increment failure counter for auth, limit, and other server errors
          if (isAuthError || isRateLimit || error.response?.status >= 500) {
            apiFailureCount++;
            logger.warn(`API failure count increased to ${apiFailureCount}`);
          }

          
          if (isTimeout) {
            logger.warn(`Timeout connecting to model ${model} (attempt ${attempt + 1})`);
          } else if (isRateLimit) {
            logger.warn(`Rate limit hit for model ${model}`);
            // Break immediately to try backup model if rate limited
            break; 
          } else if (isAuthError) {
            logger.error(`Authentication error with model ${model}: ${error.response?.status} ${error.response?.statusText}`);
            // Auth errors won't be resolved with retries, so break
            break;
          } else {
            logger.error(`Error calling model ${model} (attempt ${attempt + 1}):`, safeErrorObject(error));
          }

          
          // If this is the last attempt with the last model, let the error propagate
          if (attempt === 2 && modelIdx === HUGGINGFACE_MODELS.length - 1) {
            // Instead of throwing, use fallback
            logger.warn(`All API attempts failed, using fallback response`);
            aiResponse = generateFallbackResponse(query, relevantProducts);
            modelUsed = 'fallback';
            break;
          }
          
          // Otherwise, wait before retrying
          if (attempt < 2) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            logger.info(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If we got a response from this model, no need to try others
      if (aiResponse) break;
    }
    
    // If we still don't have a response after all retries and models, use a hardcoded fallback
    if (!aiResponse) {
      logger.warn('All Hugging Face models failed, using fallback response');
      aiResponse = generateFallbackResponse(query, relevantProducts);
      modelUsed = 'fallback';
    }
    
    const result = {
      message: aiResponse,
      metadata: {
        products: relevantProducts.map(p => p.id),
        intent: detectIntent(query),
        sentiment: detectSentiment(query),
        model: modelUsed
      },
      updatedContext: {
        lastQuery: query,
        mentionedProducts: relevantProducts.map(p => p.id)
      }
    };
    
    // Cache common queries in memory and Redis
    const isCommonQuery = query.match(/shipping|returns|payment|order|tracking/i);
    if (isCommonQuery || query.length < 20) {
      localResponseCache.set(normalizeQuery(query), result);
      await cacheResponse(query, result);
    }
    
    return result;
  } catch (error) {
    logger.error('Error generating AI response:', safeErrorObject(error));

    
     // Return a fallback response
     return {
      message: "I'm here to help you find the perfect shoes for your needs. Could you tell me what type of shoes you're looking for?",
      metadata: {
        error: true,
        intent: detectIntent(query)
      },
      updatedContext: {
        lastQuery: query
      }
    };
  }
}


/**
 * Generate a local response without calling the API
 */
function generateLocalResponse(query, history, context = {}) {
  try {
    // Try to detect intent
    const intent = detectIntent(query);
    logger.info(`Generating local response for query "${query}" with intent "${intent}"`);
    
    // Use intent-based responses
    const result = {
      message: generateFallbackResponse(query, context.relevantProducts || [], intent),
      metadata: {
        intent,
        sentiment: detectSentiment(query),
        local: true
      },
      updatedContext: {
        lastQuery: query
      }
    };
    
    return result;
  } catch (error) {
    logger.error(`Error generating local response: ${error.message}`);
    
    // Emergency fallback
    return {
      message: "I'd be happy to help you find the perfect shoes. We have a wide selection of running shoes, casual sneakers, dress shoes, and athletic footwear. What type of shoes are you looking for?",
      metadata: {
        intent: 'general',
        emergency: true
      },
      updatedContext: {
        lastQuery: query
      }
    };
  }
}

/**
 * Handle simple queries directly without AI service
 * @param {string} query - User query
 * @returns {string|null} - Response if applicable, null otherwise
 */
function handleSimpleQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Greetings
  if (/^(hi|hello|hey|greetings|howdy|hola)( there)?( bot)?( system)?([!.?])?$/.test(normalizedQuery)) {
    return "Hello! I'm your shoe shopping assistant. How can I help you today? Are you looking for any specific type of shoes?";
  }
  
  // Thank you responses
  if (/^(thanks|thank you|ty)( very much)?( so much)?([!.?])?$/.test(normalizedQuery)) {
    return "You're welcome! Is there anything else I can help you with today?";
  }
  
  // Help queries
  if (/^(help|what can you do|how does this work)([?])?$/.test(normalizedQuery)) {
    return "I can help you find the perfect shoes based on your preferences. You can ask me about specific types, colors, or sizes of shoes. I can also provide information about shipping, returns, and payment options. What kind of shoes are you looking for today?";
  }
  
  // No simple response applicable
  return null;
}


/**
 * Generate a fallback response when API is unavailable
 */
function generateFallbackResponse(query, products = [], intent = null) {
  // Use intent detection if it wasn't provided
  if (!intent) {
    intent = detectIntent(query);
  }
  
  // For color-specific queries about red shoes
  if (query.toLowerCase().includes('red') && query.toLowerCase().includes('shoe')) {
    // Filter products to find those with red in the color
    const redShoes = products.filter(p => 
      (p.color && p.color.toLowerCase().includes('red'))
    );
    
    if (redShoes.length > 0) {
      const shoeList = redShoes.map(shoe => 
        `${shoe.name} by ${shoe.brand} (${shoe.color}, $${shoe.price.toFixed(2)})`
      ).join(', ');
      
      return `I found some red shoes that might interest you! Here are a few options: ${shoeList}. Would you like more details about any of these?`;
    } else {
      return "I can help you find red shoes! We have several options like the Chuck Taylor All Star by Converse and the Authentic by Vans which come in red. What size are you looking for?";
    }
  }
  
  // Size-specific queries
  if (intent === 'sizing' || query.match(/size\s+\d+/i)) {
    // Try to extract the size from the query
    const sizeMatch = query.match(/size\s+(\d+(\.\d+)?)/i);
    let size = sizeMatch ? sizeMatch[1] : null;
    
    if (size) {
      // Filter products by size if we have it
      const sizeShoes = products.filter(p => p.size === parseFloat(size));
      
      if (sizeShoes.length > 0) {
        const shoeList = sizeShoes.slice(0, 3).map(shoe => 
          `${shoe.name} by ${shoe.brand} (${shoe.color})`
        ).join(', ');
        
        return `I found some shoes in size ${size}! Here are some options: ${shoeList}. Would you like more information about any of these?`;
      } else {
        return `For size ${size}, we have several options including running shoes, casual sneakers, and athletic shoes. What style or color are you interested in?`;
      }
    } else {
      return "Our shoes generally run true to size. If you're between sizes, I'd recommend going up half a size, especially for athletic shoes. What size are you looking for?";
    }
  }
  
  // Simple template-based responses based on intent
  if (intent === 'shipping') {
    return "We offer free shipping on all orders over $100. Standard shipping typically takes 3-5 business days, while express shipping takes 1-2 business days for an additional fee.";
  } 
  else if (intent === 'returns') {
    return "We have a 30-day return policy. If you're not satisfied with your purchase, you can return unworn shoes with the original packaging for a full refund or exchange.";
  }
  else if (intent === 'purchase') {
    return "Ready to make a purchase? You can add items to your cart and proceed to checkout where you'll have multiple payment options including credit card and PayPal. Is there a specific pair of shoes you'd like to buy?";
  }
  else if (products && products.length > 0) {
    // If we have product recommendations, use them
    const product = products[0];
    return `Based on your interests, I'd recommend checking out the ${product.name} by ${product.brand}. It's priced at $${product.price.toFixed(2)} and available in ${product.color}. Would you like more details about this shoe?`;
  }
  
  // Generic fallback
  return "I'd be happy to help you find the perfect shoes. We have a wide selection of running shoes, casual sneakers, dress shoes, and athletic footwear. Could you tell me more about what type of shoes you're looking for?";
}





/**
 * Normalize query for caching
 */
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


// Rest of your existing functions (createPrompt, detectIntent, detectSentiment)...


/**
 * Create conversation prompt
 * @param {string} query - User query
 * @param {Array} history - Conversation history
 * @param {Array} products - Relevant products
 * @param {Object} context - Conversation context
 * @param {number} userId - User ID (optional)
 * @returns {string} - Formatted prompt
 */
function createPrompt(query, history, products, context, userId) {
  let prompt = `[SYSTEM]: You are a helpful assistant for a shoe store. Answer customer questions politely and concisely. 
  Your goal is to help customers find the perfect shoes based ONLY on the product information I provide below.
  IMPORTANT: Only mention products that are listed in the product information section. DO NOT make up or suggest products that aren't listed below.
  
  Here are the types of shoes we offer:
  - Running shoes
  - Casual sneakers
  - Dress shoes
  - Athletic shoes
  
  We offer free shipping on all orders over $100 and have a 30-day return policy.`;

  // Add product information
  if (products.length > 0) {
    prompt += `\n\nRELEVANT PRODUCTS (ONLY recommend these specific products to the customer):\n`;
    products.forEach((product, index) => {
      prompt += `${index + 1}. ${product.name} by ${product.brand}: $${product.price}.
      - Size: ${product.size}, Color: ${product.color} (IMPORTANT: Only suggest this product if the color matches what the customer is looking for)
      - Stock available: ${product.stock} pairs
      - Features: ${product.description || 'No description available'}\n`;
    });
    prompt += `\nONLY refer to the above products in your response. If none of these products match what the customer is looking for, say we don't have exact matches available right now but you can check our website for more options. NEVER mention products that aren't in the above list.`;
  } else {
    prompt += `\n\nWe don't have products that match the customer's exact request. Let them know we don't have matches in our current inventory but they can check our website for more options.`;
  }

  // Add conversation history
  if (history.length > 0) {
    prompt += '\n\nPrevious messages:';
    history.forEach(msg => {
      prompt += `\n[${msg.role.toUpperCase()}]: ${msg.content}`;
    });
  }

  // Add the current query
  prompt += `\n\n[USER]: ${query}\n[ASSISTANT]:`;

  return prompt;
}



/**
 * Simple intent detection
 * @param {string} query - User query
 * @returns {string} - Detected intent
 */
function detectIntent(query) {
  const queryLower = query.toLowerCase();
  
  // Product search patterns
  if (queryLower.match(/looking for|find|search|show me|have any|got any/i)) {
    return 'product_search';
  }
  
  // Color-specific searches
  if (queryLower.match(/red|blue|black|white|green|brown|yellow|purple|pink|orange|gray|grey/i)) {
    return 'product_search';
  }
  
  // Size-related queries
  if (queryLower.match(/size|fit|sizing|too big|too small|width|narrow|wide/i)) {
    return 'sizing';
  }
  
  // Shipping-related
  if (queryLower.match(/ship|deliver|shipping|delivery|arrive|when will|how soon/i)) {
    return 'shipping';
  }
  
  // Return policy
  if (queryLower.match(/return|exchange|refund|send back|money back/i)) {
    return 'returns';
  }
  
  // Brand specific
  if (queryLower.match(/nike|adidas|puma|reebok|vans|converse|asics|new balance/i)) {
    return 'product_search';
  }
  
  // General purchase intent
  if (queryLower.match(/buy|purchase|order|checkout|want to get|interested in/i)) {
    return 'purchase';
  }
  
  // Default to general
  return 'general';
}








/**
 * Simple sentiment analysis
 * @param {string} query - User query
 * @returns {string} - Detected sentiment
 */
function detectSentiment(query) {
  const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'happy', 'thanks'];
  const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'unhappy', 'disappointed'];
  
  let score = 0;
  
  for (const word of positiveWords) {
    if (query.toLowerCase().includes(word)) score += 1;
  }
  
  for (const word of negativeWords) {
    if (query.toLowerCase().includes(word)) score -= 1;
  }
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}


module.exports = {
  generateResponse,
  detectIntent,
  detectSentiment,
  warmupModel
};