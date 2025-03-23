// prisma/create-superadmin.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
  const name = process.env.SUPERADMIN_NAME || 'System Administrator';

  try {
    // Check if superadmin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { role: 'SUPERADMIN' }],
      },
    });

    if (existingAdmin) {
      console.log('SuperAdmin already exists:', existingAdmin.email);
      return;
    }

    // Create superadmin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPERADMIN',
      },
    });

    console.log('SuperAdmin created successfully:', superAdmin.email);
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
