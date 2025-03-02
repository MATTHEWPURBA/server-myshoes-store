const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

class UserModel {
    async createUser(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            return await prisma.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    name: userData.name
                }
            });
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    async getUserByEmail(email) {
        try {
            return await prisma.user.findUnique({
                where: { email }
            });
        } catch (error) {
            throw new Error(`Error fetching user: ${error.message}`);
        }
    }

    async getUserById(id) {
        try {
            return await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    orders: {
                        include: {
                            items: true
                        }
                    }
                }
            });
        } catch (error) {
            throw new Error(`Error fetching user: ${error.message}`);
        }
    }

    async updateUser(id, userData) {
        try {
            const data = { ...userData };
            if (userData.password) {
                data.password = await bcrypt.hash(userData.password, 10);
            }
            
            return await prisma.user.update({
                where: { id: parseInt(id) },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                }
            });
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
}

module.exports = new UserModel();