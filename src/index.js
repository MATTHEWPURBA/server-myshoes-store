require('dotenv').config();

if(process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

// File: src/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import all routes from routes/index.js
const apiRoutes = require('./routes');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Use all routes under /api prefix
app.use('/api', apiRoutes);

module.exports = app;