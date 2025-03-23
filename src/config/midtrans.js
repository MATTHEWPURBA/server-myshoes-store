// src/config/midtrans.js
require('dotenv').config();

const midtransConfig = {
  isProduction: false, // Set to true for production
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
};

module.exports = midtransConfig;