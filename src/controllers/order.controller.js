// File: src/controllers/order.controller.js
const OrderModel = require('../models/order.model');

class OrderController {
    // New controller method to get all orders for the authenticated user
    async getAllOrders(req, res) {
        try {
            // Use the authenticated user's ID from the request
            const orders = await OrderModel.getUserOrders(req.user.id);
            console.log(orders,'ini orderan')
            console.log(req.user.id,'ini user')
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createOrder(req, res) {
        try {
            console.log('masuk pa')
            console.log(req.body,'ini dari body')
            const order = await OrderModel.createOrder(req.body);
            console.log(order,'ini orderan nih')
            res.status(201).json(order);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUserOrders(req, res) {
        try {
            const orders = await OrderModel.getUserOrders(req.params.userId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const order = await OrderModel.updateOrderStatus(req.params.orderId, req.body.status);
            res.json(order);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getOrderById(req, res) {
        try {
            const order = await OrderModel.getOrderById(req.params.orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json(order);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new OrderController();