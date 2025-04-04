require('dotenv').config();

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

// File: src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const requestLogger = require('./middleware/requestLogger');

// Import all routes from routes/index.js
const apiRoutes = require('./routes');

// Import chat routes
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Apply request logger AFTER body parsers but BEFORE routes
app.use(requestLogger);

// Use all routes under /api prefix
app.use('/api', apiRoutes);

// Add chat routes
app.use('/api/chat', chatRoutes);

// Root route for health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = app;
