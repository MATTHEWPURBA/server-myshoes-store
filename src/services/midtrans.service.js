// src/services/midtrans.service.js
const midtransClient = require('midtrans-client');
const midtransConfig = require('../config/midtrans');

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
   * Create Snap payment for an order
   * @param {Object} order - The order object
   * @param {Object} customer - Customer information
   * @returns {Promise<Object>} - Snap response with token and redirect URL
   */
  async createTransaction(order, customer) {
        // Round prices to whole numbers for IDR currency
        const roundedTotal = Math.round(order.total);
    try {
      const parameter = {
        transaction_details: {
          order_id: `ORDER-${order.id}-${new Date().getTime()}`,
          gross_amount: roundedTotal
        },
        customer_details: {
          first_name: customer.name,
          email: customer.email
        },
        item_details: order.items.map(item => ({
          id: `SHOE-${item.shoeId}`,
          price: Math.round(item.price),  // Round each item price
          quantity: item.quantity,
          name: `Shoe ID: ${item.shoeId}`
        })),
        credit_card: {
          secure: true
        }
      };

      return await this.snap.createTransaction(parameter);
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