// src/lib/prisma.js (simplified)
const { PrismaClient } = require('@prisma/client');

// Simple connection - just use the URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;