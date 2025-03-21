// src/controllers/payment.controller.js
const OrderModel = require('../models/order.model');
const midtransService = require('../services/midtrans.service');

class PaymentController {
  /**
   * Get payment status for an order
   */
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = await OrderModel.getOrderById(parseInt(orderId));
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // If the order has a payment ID, check its status with Midtrans
      if (order.paymentId) {
        try {
          const paymentStatus = await midtransService.getStatus(order.paymentId);
          return res.json({
            orderId: order.id,
            status: order.status,
            paymentStatus: paymentStatus.transaction_status,
            paymentMethod: order.paymentMethod,
            paymentTime: order.paymentTime,
          });
        } catch (error) {
          // If there's an error getting the status from Midtrans, just return the order status
          return res.json({
            orderId: order.id,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentTime: order.paymentTime,
            error: 'Could not fetch payment status from payment gateway'
          });
        }
      }
      
      // If there's no payment ID, just return the order status
      return res.json({
        orderId: order.id,
        status: order.status,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle notification from Midtrans
   */
  async handleNotification(req, res) {
    try {
      const notification = req.body;
      
      // Process the notification with Midtrans service
      const paymentStatus = await midtransService.handleNotification(notification);
      
      // Update the order in the database
      if (paymentStatus.orderId) {
        await OrderModel.updateOrderPayment(paymentStatus.orderId, paymentStatus);
        
        // For successful payments, you might want to reduce stock quantities
        if (paymentStatus.status === 'PAID') {
          // TODO: Implement stock reduction logic here
          // This would need to get the order items and update the shoe stock accordingly
        }
      }
      
      // Always return 200 OK to Midtrans regardless of processing success
      res.status(200).json({ status: 'OK' });
    } catch (error) {
      console.error('Payment notification error:', error);
      // Still return 200 even on error, but log the error
      res.status(200).json({ status: 'OK', error: error.message });
    }
  }

  /**
   * Generate a new payment for an existing order
   */
  async generatePayment(req, res) {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = await OrderModel.getOrderById(parseInt(orderId));
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Only allow generating payment for orders in PENDING or PAYMENT_FAILED status
      if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
        return res.status(400).json({ 
          error: 'Cannot generate payment. Order status is ' + order.status 
        });
      }
      
      // Create a new payment transaction
      const midtransResponse = await midtransService.createTransaction(order, order.user);
      
      // Update the order with new payment information
      const updatedOrder = await OrderModel.updateOrderStatus(order.id, 'WAITING_FOR_PAYMENT');
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: midtransResponse.transaction_id || null,
          paymentUrl: midtransResponse.redirect_url || null,
          snapToken: midtransResponse.token || null,
        }
      });
      
      res.json({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        paymentUrl: midtransResponse.redirect_url,
        snapToken: midtransResponse.token
      });
    } catch (error) {
      console.error('Generate payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cancel payment for an order
   */
  async cancelPayment(req, res) {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = await OrderModel.getOrderById(parseInt(orderId));
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Only allow cancelling payments for orders in WAITING_FOR_PAYMENT status
      if (order.status !== 'WAITING_FOR_PAYMENT') {
        return res.status(400).json({ 
          error: 'Cannot cancel payment. Order status is ' + order.status 
        });
      }
      
      // Cancel the payment in Midtrans
      if (order.paymentId) {
        await midtransService.cancelTransaction(order.paymentId);
      }
      
      // Update the order status
      const updatedOrder = await OrderModel.updateOrderStatus(order.id, 'CANCELLED');
      
      res.json({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: 'Payment cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PaymentController();