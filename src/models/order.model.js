// File: src/models/order.model.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OrderModel {
    async createOrder(orderData) {
        try {
            return await prisma.order.create({
                data: {
                    userId: parseInt(orderData.userId),
                    total: parseFloat(orderData.total),
                    items: {
                        create: orderData.items.map(item => ({
                            shoeId: parseInt(item.shoeId),
                            quantity: parseInt(item.quantity),
                            price: parseFloat(item.price)
                        }))
                    }
                },
                include: {
                    items: true
                }
            });
        } catch (error) {
            throw new Error(`Error creating order: ${error.message}`);
        }
    }

    async getUserOrders(userId) {
        try {
            return await prisma.order.findMany({
                where: { userId: parseInt(userId) },
                include: {
                    items: true
                }
            });
        } catch (error) {
            throw new Error(`Error fetching orders: ${error.message}`);
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            return await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: { status },
                include: {
                    items: true
                }
            });
        } catch (error) {
            throw new Error(`Error updating order status: ${error.message}`);
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
                            email: true
                        }
                    }
                }
            });
        } catch (error) {
            throw new Error(`Error fetching order: ${error.message}`);
        }
    }
}

module.exports = new OrderModel();