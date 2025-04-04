/**
 * Safely converts objects with circular references to a loggable format
 */
function safeStringify(obj, replacer = null, space = 2) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      
      // Use custom replacer if provided
      return replacer ? replacer(key, value) : value;
    }, space);
  }
  
  /**
   * Extract essential information from an API error
   */
  function extractErrorInfo(error) {
    return {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    };
  }
  
  module.exports = {
    safeStringify,
    extractErrorInfo
  };