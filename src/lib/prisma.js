// src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// Build DATABASE_URL with params from separate env vars if needed
const buildDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL_BASE || process.env.DATABASE_URL;

  // If there's no base URL, return the direct DATABASE_URL to avoid errors
  if (!baseUrl) return process.env.DATABASE_URL;

  // If the URL already has query parameters, don't add them again
  if (baseUrl.includes('?')) return baseUrl;

  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || 10;
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT || 30;
  const connectTimeout = process.env.DATABASE_CONNECT_TIMEOUT || 10;

  return `${baseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;
};

// Create a global variable to store the Prisma instance
const globalForPrisma = global;

// Check if we already have a Prisma instance to avoid recreating during hot reloads
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Add connection settings for better performance
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

// Graceful shutdown handling
let isShuttingDown = false;

// REMOVED: The problematic $on('beforeExit') line that was causing the error

// Use process events instead for cleanup
process.on('SIGINT', async () => {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Prisma Client shutting down...');

  try {
    await prisma.$disconnect();
    console.log('Prisma Client disconnected successfully');
  } catch (e) {
    console.error('Error during Prisma disconnect:', e);
  } finally {
    process.exit(0);
  }
});

// Note: The 'exit' event cannot be async (promises won't complete)
process.on('exit', () => {
  if (!isShuttingDown) {
    console.log('Process exiting, disconnecting Prisma client');
    // We can't use await here as promises won't complete during 'exit'
    prisma.$disconnect().catch((e) => {
      console.error('Error during final Prisma disconnect:', e);
    });
  }
});

// Also handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Attempt graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Just log, don't exit
});

// Save our instance if we're not in production
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
