const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT token and return user
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} - User object or null
 */
async function verifyToken(token) {
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

module.exports = { verifyToken };