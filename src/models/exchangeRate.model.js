// src/models/exchangeRate.model.js
const prisma = require('../lib/prisma');

class ExchangeRateModel {
  /**
   * Get all exchange rates from the database
   */
  async getAllRates() {
    try {
      const rates = await prisma.exchangeRate.findMany();

      // Convert to map format for easy lookup
      const rateMap = {};
      rates.forEach((rate) => {
        rateMap[rate.currency] = rate.rate;
      });

      return rateMap;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates
      return this.getFallbackRates();
    }
  }

  /**
   * Get exchange rate for a specific currency
   */
  async getRate(currency) {
    try {
      const rate = await prisma.exchangeRate.findUnique({
        where: { currency },
      });

      return rate ? rate.rate : null;
    } catch (error) {
      console.error(`Error fetching rate for ${currency}:`, error);
      return null;
    }
  }

  /**
   * Update exchange rate for a currency
   */
  async updateRate(currency, rate, admin) {
    try {
      const updated = await prisma.exchangeRate.upsert({
        where: { currency },
        update: {
          rate,
          updatedAt: new Date(),
          updatedBy: admin || 'System',
        },
        create: {
          currency,
          rate,
          updatedAt: new Date(),
          updatedBy: admin || 'System',
        },
      });

      return updated;
    } catch (error) {
      console.error(`Error updating rate for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Update multiple rates at once
   */
  async updateBulkRates(ratesData, admin) {
    try {
      const updates = [];

      for (const [currency, rate] of Object.entries(ratesData)) {
        updates.push(
          prisma.exchangeRate.upsert({
            where: { currency },
            update: {
              rate,
              updatedAt: new Date(),
              updatedBy: admin || 'System',
            },
            create: {
              currency,
              rate,
              updatedAt: new Date(),
              updatedBy: admin || 'System',
            },
          })
        );
      }

      const results = await prisma.$transaction(updates);
      return results;
    } catch (error) {
      console.error('Error updating bulk rates:', error);
      throw error;
    }
  }

  /**
   * Get fallback rates in case of database error
   */
  getFallbackRates() {
    return {
      USD: 1,
      IDR: 15000,
      EUR: 0.85,
      SGD: 1.35,
      MYR: 4.2,
      JPY: 110,
      AUD: 1.3,
      GBP: 0.73,
    };
  }
}

module.exports = new ExchangeRateModel();
