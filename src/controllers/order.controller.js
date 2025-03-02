// File: src/controllers/order.controller.js
const OrderModel = require('../models/order.model');

class OrderController {
    async createOrder(req, res) {
        try {
            const order = await OrderModel.createOrder(req.body);
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