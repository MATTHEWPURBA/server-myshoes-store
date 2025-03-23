//src/services/currency.service.js
const axios = require('axios');
const exchangeRateModel = require('../models/exchangeRate.model');

class CurrencyService {
    constructor() {
        // Cache exchange rates to avoid excessive API calls
        this.exchangeRates = {};
        this.lastFetchTime = null;
        this.baseCurrency = 'USD'; // Your store's base currency
        
        // Initialize cache on startup
        this.initializeRates();
      }

        /**
   * Initialize rates on service startup
   */
  async initializeRates() {
    await this.fetchExchangeRates();
    
    // Schedule periodic updates (e.g., every 4 hours)
    setInterval(() => this.fetchExchangeRates(), 4 * 60 * 60 * 1000);
  }



        /**
   * Get latest exchange rates from API
   * Using ExchangeRate-API as an example
   */
  async fetchExchangeRates() {
    try {
      // Check if we need to update rates (every 3 hours)
      const now = new Date();
      if (
        this.lastFetchTime && 
        now.getTime() - this.lastFetchTime.getTime() < 3 * 60 * 60 * 1000 &&
        this.exchangeRates && Object.keys(this.exchangeRates).length > 0
      ) {
        return this.exchangeRates;
      }


      // Get rates from DB
      const rates = await exchangeRateModel.getAllRates();
      
      // Update cache
      this.exchangeRates = rates;
      this.lastFetchTime = now;
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // If cache exists, use it despite being stale
      if (this.exchangeRates && Object.keys(this.exchangeRates).length > 0) {
        return this.exchangeRates;
      }
      
      // Otherwise, use fallback rates
      return exchangeRateModel.getFallbackRates();
    }
  }

 /**
   * Convert amount from base currency to target currency
   */
 async convertAmount(amount, targetCurrency) {
    if (!targetCurrency || targetCurrency === this.baseCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        currency: this.baseCurrency,
        exchangeRate: 1,
        formattedOriginal: `${this.baseCurrency} ${amount.toFixed(2)}`,
        formattedConverted: `${this.baseCurrency} ${amount.toFixed(2)}`
      };
    }

    const rates = await this.fetchExchangeRates();
    const exchangeRate = rates[targetCurrency] || this.fallbackRates[targetCurrency] || 1;
    
    const convertedAmount = amount * exchangeRate;
    
    return {
      originalAmount: amount,
      convertedAmount: convertedAmount,
      currency: targetCurrency,
      exchangeRate: exchangeRate,
      formattedOriginal: `${this.baseCurrency} ${amount.toFixed(2)}`,
      formattedConverted: `${targetCurrency} ${convertedAmount.toFixed(2)}`
    };
  }





  /**
   * Get available currencies for selection
   */
  async getAvailableCurrencies() {
    const rates = await this.fetchExchangeRates();
    
    // Return the most common currencies or all available ones
    const commonCurrencies = ['USD', 'IDR', 'EUR', 'SGD', 'MYR', 'JPY', 'AUD', 'GBP'];
    
    return commonCurrencies
      .filter(code => rates[code])
      .map(code => ({
        code,
        rate: rates[code],
        name: this.getCurrencyName(code)
      }));
  }



    /**
   * Force refresh of exchange rates
   */
    async refreshRates() {
      // Reset last fetch time to force update
      this.lastFetchTime = null;
      return await this.fetchExchangeRates();
    }
    
  
  /**
   * Get currency name from code
   */
  getCurrencyName(code) {
    const currencyNames = {
      USD: 'US Dollar',
      IDR: 'Indonesian Rupiah',
      EUR: 'Euro',
      SGD: 'Singapore Dollar',
      MYR: 'Malaysian Ringgit',
      JPY: 'Japanese Yen',
      AUD: 'Australian Dollar',
      GBP: 'British Pound',
      CAD: 'Canadian Dollar',
      CNY: 'Chinese Yuan',
      HKD: 'Hong Kong Dollar',
      INR: 'Indian Rupee',
      KRW: 'South Korean Won',
      NZD: 'New Zealand Dollar',
      THB: 'Thai Baht',
      VND: 'Vietnamese Dong'
    };
    
    return currencyNames[code] || code;
  }
}

module.exports = new CurrencyService();



