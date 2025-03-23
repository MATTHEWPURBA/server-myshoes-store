// File: src/models/order.model.js
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();
const prisma = require('../lib/prisma');
const midtransService = require('../services/midtrans.service');

class OrderModel {
  async createOrder(orderData) {
    try {


      // Extract shipping information if present
      const { shippingMethod, shippingFee, ...rest } = orderData;
    
      // First create the order in the database
      const order = await prisma.order.create({
        data: {
          userId: parseInt(orderData.userId),
          total: parseFloat(orderData.total),
          status: 'PENDING',
          shippingMethod: shippingMethod || 'standard',
          shippingFee: shippingFee || 0,
          items: {
            create: orderData.items.map((item) => ({
              shoeId: parseInt(item.shoeId),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
            })),
          },
        },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });


      // Now create a payment transaction with Midtrans
      const midtransResponse = await midtransService.createTransaction(order, order.user);

      // Update the order with payment information
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'WAITING_FOR_PAYMENT',
          paymentId: midtransResponse.transaction_id || null,
          paymentUrl: midtransResponse.redirect_url || null,
          snapToken: midtransResponse.token || null,
        },
        include: {
          items: true,
        },
      });

      return {
        ...updatedOrder,
        paymentUrl: midtransResponse.redirect_url,
        snapToken: midtransResponse.token
      };
    } catch (error) {
      console.error('Order creation error:', error);
      throw new Error(`Error creating order: ${error.message}`);
    }
  }


  async getUserOrders(userId) {
    try {
      return await prisma.order.findMany({
        where: { userId: parseInt(userId) },
        include: {
          items: true,
        },
      });
    } catch (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }
  }

  async updateOrderPaymentInfo(orderId, paymentInfo) {
    try {
      return await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: paymentInfo,
        include: {
          items: true,
        },
      });
    } catch (error) {
      throw new Error(`Error updating order payment info: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      return await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status },
        include: {
          items: true,
        },
      });
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }



  /**
 * Update order after payment notification
 * @param {string} orderId - The order ID
 * @param {Object} paymentData - Payment data from Midtrans
 * @returns {Promise<Object>} - Updated order
 */
async updateOrderPayment(orderId, paymentData) {
  try {
    const orderUpdate = {
      status: paymentData.status,
    };
    
    // Add payment details if payment was successful
    if (paymentData.status === 'PAID') {
      orderUpdate.paymentMethod = paymentData.paymentType;
      orderUpdate.paymentTime = new Date();
    }
    
    return await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: orderUpdate,
      include: {
        items: true,
      },
    });
  } catch (error) {
    throw new Error(`Error updating order payment: ${error.message}`);
  }
}

  async getOrderById(orderId) {
    try {
      return await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  async deleteOrder(orderId) {
    try {
      const order = await this.getOrderById(orderId);
      
      // If the order has a payment ID and is not yet paid, cancel it in Midtrans
      if (order.paymentId && (order.status === 'PENDING' || order.status === 'WAITING_FOR_PAYMENT')) {
        try {
          await midtransService.cancelTransaction(order.paymentId);
        } catch (error) {
          console.error('Error cancelling payment:', error);
          // Continue with deletion even if cancellation fails
        }
      }
      // With onDelete: Cascade, this will automatically delete related items
      return await prisma.order.delete({
        where: { id: parseInt(orderId) },
      });
    } catch (error) {
      throw new Error(`Error deleting order: ${error.message}`);
    }
  }
}

module.exports = new OrderModel();
