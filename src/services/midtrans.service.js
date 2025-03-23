// src/services/midtrans.service.js
const midtransClient = require('midtrans-client');
const midtransConfig = require('../config/midtrans');
const currencyService = require('./currency.service');


class MidtransService {
  constructor() {
    // Create Snap API instance for frontend payment page
    this.snap = new midtransClient.Snap({
      isProduction: midtransConfig.isProduction,
      serverKey: midtransConfig.serverKey,
      clientKey: midtransConfig.clientKey
    });

    // Create Core API instance for backend operations
    this.core = new midtransClient.CoreApi({
      isProduction: midtransConfig.isProduction,
      serverKey: midtransConfig.serverKey,
      clientKey: midtransConfig.clientKey
    });
  }

  /**
   * Create Snap payment for an order with currency conversion
   * @param {Object} order - The order object
   * @param {Object} customer - Customer information
   * @param {String} currency - Target currency (optional)
   * @returns {Promise<Object>} - Snap response with token and redirect URL
   */


  async createTransaction(order, customer, currency = null) {
    try {
      // Get conversion data if currency is provided
      let conversionData = null;
      let grossAmount = Math.round(order.total);
      
      if (currency && currency !== 'USD') {
        conversionData = await currencyService.convertAmount(order.total, currency);
        grossAmount = Math.round(conversionData.convertedAmount);
      }
      
      // Prepare item details
      const itemDetails = order.items.map(item => {
        let itemPrice = Math.round(item.price);
        
        if (conversionData) {
          itemPrice = Math.round(item.price * conversionData.exchangeRate);
        }
        
        return {
          id: `SHOE-${item.shoeId}`,
          price: itemPrice,
          quantity: item.quantity,
          name: `Shoe ID: ${item.shoeId}`
        };
      });

      // Calculate the sum of all item prices to check for shipping or other additional fees
      const itemsTotal = itemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
      // If there's a difference between gross amount and items total, add it as a shipping fee
      if (grossAmount > itemsTotal) {
        const shippingFee = grossAmount - itemsTotal;
        
        // Add shipping as a separate item
        itemDetails.push({
          id: 'SHIPPING-FEE',
          price: shippingFee,
          quantity: 1,
          name: order.shippingMethod === 'express' ? 'Express Shipping' : 'Shipping Fee'
        });
      } 
    // This handles any potential rounding issues or currency conversion discrepancies
    else if (grossAmount < itemsTotal) {
      // Adjust the gross amount to match the item total (required by Midtrans)
      grossAmount = itemsTotal;
    }
// Add currency conversion fees as a separate item if applicable
if (conversionData && order.shippingFee) {
  // Convert shipping fee to the target currency
  const convertedShippingFee = Math.round(order.shippingFee * conversionData.exchangeRate);
  
  // Make sure shipping fee is included in the items
  const hasShippingItem = itemDetails.some(item => 
    item.id === 'SHIPPING-FEE' || item.name.includes('Shipping'));
  
  // If shipping fee is not already included, add it
  if (!hasShippingItem && convertedShippingFee > 0) {
    itemDetails.push({
      id: 'SHIPPING-FEE',
      price: convertedShippingFee,
      quantity: 1,
      name: order.shippingMethod === 'express' ? 'Express Shipping' : 'Shipping Fee'
    });
    
    // Update gross amount to include shipping fee
    grossAmount += convertedShippingFee;
  }
}

// Final check to ensure gross_amount equals the sum of all items (required by Midtrans)
const finalItemsTotal = itemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
if (grossAmount !== finalItemsTotal) {
  grossAmount = finalItemsTotal;
}

      const parameter = {
        transaction_details: {
          order_id: `ORDER-${order.id}-${new Date().getTime()}`,
          gross_amount: grossAmount
        },
        customer_details: {
          first_name: customer.name,
          email: customer.email
        },
        item_details: itemDetails,
        credit_card: {
          secure: true
        }
      };
      
      // Add currency information if applicable
      if (currency && currency !== 'USD') {
        // Store conversion details in metadata
        parameter.custom_field1 = JSON.stringify({
          originalCurrency: currency || 'USD',
          targetCurrency: 'IDR', // Midtrans always processes in IDR
          exchangeRate: conversionData ? conversionData.exchangeRate : 1,
          originalAmount: order.total,
          note: "Display shows IDR but charge is in " + (currency || 'USD')
        });
      }
      
      const response = await this.snap.createTransaction(parameter);
      
      // Add conversion information to the response
      return {
        ...response,
        conversionData
      };
    } catch (error) {
      console.error('Midtrans create transaction error:', error);
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }


  
  /**
   * Handle notification from Midtrans
   * @param {Object} notification - The notification object from Midtrans
   * @returns {Promise<Object>} - Transaction status
   */
  async handleNotification(notification) {
    try {
      const statusResponse = await this.core.transaction.notification(notification);
      
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;
      const paymentType = statusResponse.payment_type;

      // Extract the actual order ID from the Midtrans order ID format
      const actualOrderId = orderId.split('-')[1];

      let paymentStatus;

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'challenge') {
          paymentStatus = 'PENDING';
        } else if (fraudStatus === 'accept') {
          paymentStatus = 'PAID';
        }
      } else if (transactionStatus === 'settlement') {
        paymentStatus = 'PAID';
      } else if (transactionStatus === 'pending') {
        paymentStatus = 'WAITING_FOR_PAYMENT';
      } else if (transactionStatus === 'deny' || 
                transactionStatus === 'cancel' || 
                transactionStatus === 'expire') {
        paymentStatus = 'PAYMENT_FAILED';
      }

      return {
        orderId: actualOrderId,
        status: paymentStatus,
        paymentType,
        transactionId: statusResponse.transaction_id,
        rawStatus: statusResponse
      };
    } catch (error) {
      console.error('Midtrans notification handling error:', error);
      throw new Error(`Payment notification error: ${error.message}`);
    }
  }

  /**
   * Get transaction status from Midtrans
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} - Transaction status
   */
  async getStatus(orderId) {
    try {
      return await this.core.transaction.status(orderId);
    } catch (error) {
      console.error('Midtrans get status error:', error);
      throw new Error(`Payment status error: ${error.message}`);
    }
  }

  /**
   * Cancel transaction in Midtrans
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} - Cancel response
   */
  async cancelTransaction(orderId) {
    try {
      return await this.core.transaction.cancel(orderId);
    } catch (error) {
      console.error('Midtrans cancel transaction error:', error);
      throw new Error(`Payment cancellation error: ${error.message}`);
    }
  }
}

module.exports = new MidtransService();