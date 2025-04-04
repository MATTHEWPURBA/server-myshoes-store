// src/middleware/requestLogger.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to log all incoming HTTP requests
 */
function requestLogger(req, res, next) {
  // Generate a unique ID for this request (helps with tracing)
  const requestId = uuidv4();
  req.requestId = requestId;
  
  // Capture the start time to calculate duration
  const startTime = Date.now();
  
  // Store original URL to help identify redirects
  const originalUrl = req.originalUrl || req.url;
  
  // Log the request details
  logger.info(`[${requestId}] ${req.method} ${originalUrl}`, {
    method: req.method,
    url: originalUrl,
    path: req.path,
    params: req.params,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    // Only log body for non-GET methods and if not a file upload
    body: req.method !== 'GET' && !req.is('multipart/form-data') 
      ? sanitizeRequestBody(req.body) 
      : undefined
  });
  
  // Capture response data by hooking into the response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel](`[${requestId}] ${req.method} ${originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
      routePath: req.route?.path // The matched Express route pattern
    });
  });
  
  next();
}

/**
 * Sanitize request body to avoid logging sensitive information
 */
function sanitizeRequestBody(body) {
  if (!body) return undefined;
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'creditCard', 'credit_card'];
  
  // Redact sensitive fields
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

module.exports = requestLogger;