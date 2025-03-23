// const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
// const prisma = new PrismaClient();
// src/models/order.model.js
const prisma = require('../lib/prisma');

class UserModel {
  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      return await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
        },
      });
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async getUserByEmail(email) {
    try {
      return await prisma.user.findUnique({
        where: { email },
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
              items: true,
            },
          },
        },
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
          createdAt: true,
        },
      });
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  // New methods for user management

  async getAllUsers() {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          sellerRequestStatus: true,
          sellerRequestDate: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  async getSellerRequests(status) {
    try {
      return await prisma.user.findMany({
        where: {
          sellerRequestStatus: status,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          sellerRequestStatus: true,
          sellerRequestDate: true,
          sellerRequestInfo: true,
        },
      });
    } catch (error) {
      throw new Error(`Error fetching seller requests: ${error.message}`);
    }
  }
}

module.exports = new UserModel();
