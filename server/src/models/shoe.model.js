// File: src/models/shoe.model.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ShoeModel {
    async getAllShoes(filters = {}) {
        try {
            const where = {};
            if (filters.brand) where.brand = filters.brand;
            if (filters.size) where.size = parseFloat(filters.size);
            if (filters.color) where.color = filters.color;
            if (filters.minPrice) where.price = { ...where.price, gte: parseFloat(filters.minPrice) };
            if (filters.maxPrice) where.price = { ...where.price, lte: parseFloat(filters.maxPrice) };

            return await prisma.shoe.findMany({ where });
        } catch (error) {
            throw new Error(`Error fetching shoes: ${error.message}`);
        }
    }

    async getShoeById(id) {
        try {
            return await prisma.shoe.findUnique({
                where: { id: parseInt(id) }
            });
        } catch (error) {
            throw new Error(`Error fetching shoe: ${error.message}`);
        }
    }

    async createShoe(shoeData) {
        try {
            return await prisma.shoe.create({
                data: {
                    name: shoeData.name,
                    brand: shoeData.brand,
                    price: parseFloat(shoeData.price),
                    size: parseFloat(shoeData.size),
                    color: shoeData.color,
                    stock: parseInt(shoeData.stock),
                    imageUrl: shoeData.imageUrl,
                    description: shoeData.description
                }
            });
        } catch (error) {
            throw new Error(`Error creating shoe: ${error.message}`);
        }
    }

    async updateShoe(id, shoeData) {
        try {
            return await prisma.shoe.update({
                where: { id: parseInt(id) },
                data: {
                    ...(shoeData.name && { name: shoeData.name }),
                    ...(shoeData.brand && { brand: shoeData.brand }),
                    ...(shoeData.price && { price: parseFloat(shoeData.price) }),
                    ...(shoeData.size && { size: parseFloat(shoeData.size) }),
                    ...(shoeData.color && { color: shoeData.color }),
                    ...(shoeData.stock && { stock: parseInt(shoeData.stock) }),
                    ...(shoeData.imageUrl && { imageUrl: shoeData.imageUrl }),
                    ...(shoeData.description && { description: shoeData.description })
                }
            });
        } catch (error) {
            throw new Error(`Error updating shoe: ${error.message}`);
        }
    }

    async deleteShoe(id) {
        try {
            return await prisma.shoe.delete({
                where: { id: parseInt(id) }
            });
        } catch (error) {
            throw new Error(`Error deleting shoe: ${error.message}`);
        }
    }
}

module.exports = new ShoeModel();