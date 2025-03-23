// prisma/seed-exchange-rates.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default exchange rates (example values, replace with accurate ones)
const defaultRates = {
  USD: 1,
  IDR: 15000,
  EUR: 0.85,
  SGD: 1.35,
  MYR: 4.2,
  JPY: 110,
  AUD: 1.3,
  GBP: 0.73,
  CAD: 1.25,
  CNY: 6.5,
  HKD: 7.8,
  INR: 75,
  KRW: 1150,
  NZD: 1.4,
  THB: 33,
  VND: 22800
};

async function seedExchangeRates() {
  console.log('Starting exchange rate seeding...');
  
  try {
    const updates = [];
    
    for (const [currency, rate] of Object.entries(defaultRates)) {
      updates.push(
        prisma.exchangeRate.upsert({
          where: { currency },
          update: { rate },
          create: {
            currency,
            rate,
            updatedBy: 'Seed Script'
          }
        })
      );
    }
    
    const results = await prisma.$transaction(updates);
    console.log(`Successfully seeded ${results.length} exchange rates`);
  } catch (error) {
    console.error('Error seeding exchange rates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedExchangeRates();