// src/controllers/admin.controller.js
const UserModel = require('../models/user.model');
const ShoeModel = require('../models/shoe.model');
const exchangeRateModel = require('../models/exchangeRate.model');
const currencyService = require('../services/currency.service');

class AdminController {

    // User Management Methods
  
  /**
   * Get all users (SuperAdmin only)
   */
  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

    /**
   * Get all pending seller requests (SuperAdmin only)
   */
    async getPendingSellerRequests(req, res) {
        try {
          const requests = await UserModel.getSellerRequests('PENDING');
          res.json(requests);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }

       /**
   * Approve or reject a seller request (SuperAdmin only)
   */
  async processSellerRequest(req, res) {
    try {
      const { userId } = req.params;
      const { status, notes } = req.body;
      
      if (!userId || !status) {
        return res.status(400).json({ error: 'User ID and status are required' });
      }
      
      if (status !== 'APPROVED' && status !== 'REJECTED') {
        return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
      }
      
      // Get the admin who processed this request
      const adminUser = req.user.name || req.user.email || req.user.id.toString();
      
      // Update user info
      const updateData = {
        sellerRequestStatus: status,
        sellerRequestInfo: JSON.stringify({
          processedBy: adminUser,
          processedAt: new Date(),
          notes: notes || ''
        })
      };
      
      // If approved, update role to SELLER
      if (status === 'APPROVED') {
        updateData.role = 'SELLER';
      }
      
      const user = await UserModel.updateUser(parseInt(userId), updateData);
      
      res.json({
        success: true,
        message: `Seller request ${status.toLowerCase()}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sellerRequestStatus: user.sellerRequestStatus
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Change user role (SuperAdmin only)
   */
  async changeUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ error: 'User ID and role are required' });
      }
      
      if (!['CUSTOMER', 'SELLER', 'SUPERADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      const user = await UserModel.updateUser(parseInt(userId), { role });
      
      res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Product Management Methods
  
  /**
   * Get all products (Admin dashboard)
   */
  async getAllProducts(req, res) {
    try {
      // For sellers, get only their products
      // For superadmins, get all products
      const filters = {};
      
      if (req.user.role === 'SELLER') {
        filters.createdBy = req.user.id;
      }
      
      const products = await ShoeModel.getAllShoes(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  
  /**
   * Get all currency rates
   */
  async getAllCurrencies(req, res) {
    try {
      const currencies = await currencyService.getAvailableCurrencies();
      
      // Add last update time
      const response = {
        currencies,
        lastUpdated: currencyService.lastFetchTime,
        baseCurrency: currencyService.baseCurrency
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Update a single currency rate
   */
  async updateCurrencyRate(req, res) {
    try {
      const { currency } = req.params;
      const { rate } = req.body;
      
      if (!currency || !rate) {
        return res.status(400).json({ error: 'Currency and rate are required' });
      }
      
      // Validate input
      const parsedRate = parseFloat(rate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        return res.status(400).json({ error: 'Rate must be a positive number' });
      }
      
      // Get admin username or ID
      const adminUser = req.user.name || req.user.email || req.user.id;
      
      const updated = await exchangeRateModel.updateRate(currency, parsedRate, adminUser);
      
      // Refresh the service cache
      await currencyService.refreshRates();
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating currency rate:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Update multiple currency rates at once
   */
  async updateCurrencyRates(req, res) {
    try {
      const { rates } = req.body;
      
      if (!rates || typeof rates !== 'object') {
        return res.status(400).json({ error: 'Rates object is required' });
      }
      
      // Validate all inputs
      const validatedRates = {};
      for (const [currency, rate] of Object.entries(rates)) {
        const parsedRate = parseFloat(rate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          validatedRates[currency] = parsedRate;
        }
      }
      
      // Get admin username or ID
      const adminUser = req.user.name || req.user.email || req.user.id;
      
      const results = await exchangeRateModel.updateBulkRates(validatedRates, adminUser);
      
      // Refresh the service cache
      await currencyService.refreshRates();
      
      res.json({
        updated: results.length,
        results
      });
    } catch (error) {
      console.error('Error updating currency rates:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Force refresh of exchange rates
   */
  async refreshRates(req, res) {
    try {
      const rates = await currencyService.refreshRates();
      
      res.json({
        success: true,
        currencies: Object.keys(rates).length,
        lastUpdated: currencyService.lastFetchTime
      });
    } catch (error) {
      console.error('Error refreshing rates:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();