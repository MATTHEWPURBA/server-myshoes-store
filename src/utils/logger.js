// src/utils/logger.js
const fs = require('fs');
const path = require('path');
const { safeStringify, extractErrorInfo } = require('./objectUtils');


// Log rotation configuration
const LOG_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const LOG_RETENTION_DAYS = 7;

// Make sure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}


// Clean up old log files
function cleanupOldLogs() {
  try {
    const files = fs.readdirSync(logsDir);
    const now = new Date();
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than retention period
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // in days
      if (fileAge > LOG_RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  } catch (err) {
    console.error(`Error cleaning up logs: ${err.message}`);
  }
}





// Run cleanup on startup and then daily
cleanupOldLogs();
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Run daily

// Function to get a dated log filename
function getLogFilename(baseFilename) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${baseFilename}-${date}.log`;
}

// Create or get stream for current day's log
function getLogStream(baseFilename) {
  const filename = getLogFilename(baseFilename);
  const filepath = path.join(logsDir, filename);
  
  // Create new stream or get existing one
  return fs.createWriteStream(filepath, { flags: 'a' });
}

// Track current streams
let currentAccessLogStream = getLogStream('access');
let currentErrorLogStream = getLogStream('error');

// Update streams daily
setInterval(() => {
  currentAccessLogStream = getLogStream('access');
  currentErrorLogStream = getLogStream('error');
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Then replace your existing stream definitions with:
const accessLogStream = {
  write: (data) => {
    currentAccessLogStream.write(data);
  }
};

const errorLogStream = {
  write: (data) => {
    currentErrorLogStream.write(data);
  }
};






// File streams for persistent logging
// const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });

/**
 * Format a log message with timestamp and additional data
 */
function formatLogMessage(message, data) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;

  if (data) {
    try {
      // For console, add data as formatted JSON using safeStringify
      if (typeof data === 'object') {
        // Handle potential API errors specially
        if (data.response && data.config) {
          // This looks like an Axios error, extract relevant info
          const errorInfo = extractErrorInfo(data);
          logMessage += `\n${safeStringify(errorInfo)}`;
        } else {
          logMessage += `\n${safeStringify(data)}`;
        }
      } else {
        logMessage += ` ${data}`;
      }
    } catch (err) {
      // If any stringification fails, add a fallback message
      logMessage += ` [Error stringifying data: ${err.message}]`;
    }
  }

  return logMessage;
}


/**
 * Write to log file
 */
function writeToFile(stream, message, data) {
  try {
    const timestamp = new Date().toISOString();
    let logData;

    // Prepare data for logging, handling potential circular references
    if (data) {
      if (typeof data === 'object') {
        // For API errors, extract only the important information
        if (data.response && data.config) {
          logData = extractErrorInfo(data);
        } else {
          // For normal objects, use as is (safeStringify will handle later)
          logData = data;
        }
      } else {
        // For primitive values, convert to string
        logData = String(data);
      }
    }

    // Create the log entry
    const logEntry = {
      timestamp,
      message,
      data: logData
    };

    // Write to stream using safeStringify to handle circular references
    stream.write(safeStringify(logEntry) + '\n');
  } catch (err) {
    // If logging fails, output to console as a last resort
    console.error(`Failed to write to log file: ${err.message}`);
    console.error(`Original message: ${message}`);
  }
}

/**
 * Enhanced logger utility
 */
const logger = {
  info: (message, data) => {
    try {
      const formattedMessage = formatLogMessage(message, data);
      console.log(formattedMessage);

      // Also write to access log file
      writeToFile(accessLogStream, message, data);
    } catch (err) {
      // Emergency fallback if logging itself fails
      console.error(`Logger error in info: ${err.message}`);
      console.log(message);
    }
  },

  error: (message, data) => {
    try {
      // If data is an Error object, extract useful properties
      if (data instanceof Error) {
        data = {
          message: data.message,
          name: data.name,
          stack: data.stack,
          ...(data.response ? { response: extractErrorInfo(data) } : {})
        };
      }

      const formattedMessage = formatLogMessage(message, data);
      console.error(formattedMessage);

      // Also write to error log file
      writeToFile(errorLogStream, message, data);
    } catch (err) {
      // Emergency fallback if logging itself fails
      console.error(`Logger error in error: ${err.message}`);
      console.error(message);
    }
  },

  warn: (message, data) => {
    try {
      const formattedMessage = formatLogMessage(message, data);
      console.warn(formattedMessage);

      // Also write to access log file
      writeToFile(accessLogStream, message, data);
    } catch (err) {
      // Emergency fallback if logging itself fails
      console.error(`Logger error in warn: ${err.message}`);
      console.warn(message);
    }
  },

  debug: (message, data) => {
    if (process.env.DEBUG) {
      try {
        const formattedMessage = formatLogMessage(message, data);
        console.debug(formattedMessage);
      } catch (err) {
        // Emergency fallback if logging itself fails
        console.error(`Logger error in debug: ${err.message}`);
        console.debug(message);
      }
    }
  },

  // Specialized method for route logging
  route: (req, message) => {
    try {
      const routeInfo = {
        method: req.method,
        path: req.path,
        handler: req.route?.stack?.[0]?.name || 'unknown',
      };

      logger.info(`ROUTE: ${message}`, routeInfo);
    } catch (err) {
      // Emergency fallback if logging itself fails
      console.error(`Logger error in route: ${err.message}`);
      console.log(`ROUTE: ${message}`);
    }
  },
};




module.exports = logger;
